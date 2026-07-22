"""
Base class for all specialist agents. Supports two LLM providers,
switchable via environment variable:

    EV_PLATFORM_PROVIDER = "anthropic" (default) | "groq"
    EV_PLATFORM_MODEL    = model string for whichever provider is active

Each agent:
  1. Reads only the slice of the shared graph it needs.
  2. Returns structured JSON findings, not prose, so the orchestrator can
     reconcile outputs programmatically.
  3. Writes its findings back to the graph (audit trail via
     GRAPH.log_event, called from each agent's own run() method).

call() implements retries with backoff, a request timeout, and a JSON
parse fallback that never raises — a malformed or failed response
degrades to a typed error object instead of crashing the orchestration
cycle. Latency and token usage are logged per call.
"""

import json
import os
import time
import logging

logger = logging.getLogger("ev_platform.agents")

PROVIDER = os.environ.get("EV_PLATFORM_PROVIDER", "anthropic").lower()
REQUEST_TIMEOUT_SECONDS = float(os.environ.get("EV_PLATFORM_AGENT_TIMEOUT", "30"))
MAX_RETRIES = int(os.environ.get("EV_PLATFORM_AGENT_MAX_RETRIES", "3"))

DEFAULT_MODELS = {
    "anthropic": "claude-sonnet-4-5",
    "groq": "llama-3.3-70b-versatile",
}
MODEL = os.environ.get("EV_PLATFORM_MODEL", DEFAULT_MODELS.get(PROVIDER, ""))

if PROVIDER == "groq":
    from groq import Groq, APIError, APIStatusError, APITimeoutError
    _client = Groq(timeout=REQUEST_TIMEOUT_SECONDS)
elif PROVIDER == "anthropic":
    from anthropic import Anthropic, APIError, APIStatusError, APITimeoutError
    _client = Anthropic(timeout=REQUEST_TIMEOUT_SECONDS)
else:
    raise ValueError(f"Unknown EV_PLATFORM_PROVIDER: {PROVIDER!r} (expected 'anthropic' or 'groq')")

logger.info("agents configured for provider=%s model=%s", PROVIDER, MODEL)

TEMPERATURE = float(os.environ.get("EV_PLATFORM_TEMPERATURE", "0.2"))

def _call_anthropic(system_prompt: str, user_prompt: str, max_tokens: int):
    resp = _client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        temperature=TEMPERATURE,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    text = "".join(block.text for block in resp.content if block.type == "text")
    usage = {
        "input_tokens": getattr(resp.usage, "input_tokens", None),
        "output_tokens": getattr(resp.usage, "output_tokens", None),
    }
    return text, usage


def _call_groq(system_prompt: str, user_prompt: str, max_tokens: int):
    resp = _client.chat.completions.create(
        model=MODEL,
        max_tokens=max_tokens,
        temperature=TEMPERATURE,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )
    text = resp.choices[0].message.content
    usage = {
        "input_tokens": getattr(resp.usage, "prompt_tokens", None),
        "output_tokens": getattr(resp.usage, "completion_tokens", None),
    }
    return text, usage


_CALL_FN = {"anthropic": _call_anthropic, "groq": _call_groq}[PROVIDER]


class Agent:
    name: str = "base_agent"
    system_prompt: str = "You are a helpful assistant."

    def call(self, user_payload: dict, max_tokens: int = 1500) -> dict:
        """Sends structured context to the configured LLM, forces
        JSON-only output, and parses it. Never raises."""
        user_prompt = (
            f"{json.dumps(user_payload, indent=2)}\n\n"
            "Respond with ONLY a JSON object matching the schema described "
            "in your system prompt. No prose, no markdown fences."
        )

        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            start = time.time()
            try:
                text, usage = _CALL_FN(self.system_prompt, user_prompt, max_tokens)
                latency_ms = round((time.time() - start) * 1000)
                text = text.strip().removeprefix("```json").removesuffix("```").strip()

                logger.info(
                    "agent=%s provider=%s attempt=%d latency_ms=%d input_tokens=%s output_tokens=%s",
                    self.name, PROVIDER, attempt, latency_ms,
                    usage.get("input_tokens"), usage.get("output_tokens"),
                )

                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    logger.warning("agent=%s non_json_response raw=%.200s", self.name, text)
                    return {"error": "non_json_response", "raw": text, "agent": self.name}

            except (APIStatusError, APITimeoutError, APIError) as e:
                last_error = e
                wait = min(2 ** attempt, 10)
                logger.warning(
                    "agent=%s provider=%s attempt=%d failed: %s — retrying in %ss",
                    self.name, PROVIDER, attempt, e, wait,
                )
                if attempt < MAX_RETRIES:
                    time.sleep(wait)

        logger.error("agent=%s provider=%s failed after %d attempts: %s",
                      self.name, PROVIDER, MAX_RETRIES, last_error)
        return {
            "error": "agent_unavailable",
            "agent": self.name,
            "provider": PROVIDER,
            "detail": str(last_error),
            "at_risk_batteries": [], "transition_candidates": [], "flags": [],
            "drift_signals": [], "proposed_work_orders": [],
        }

    def run(self, graph) -> dict:
        raise NotImplementedError