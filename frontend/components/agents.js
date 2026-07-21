// Agents Component

const AGENT_NAMES = {
    apm_agent: 'APM',
    procurement_readiness_agent: 'Procurement',
    supply_chain_risk_agent: 'Supply Chain',
    quality_intelligence_agent: 'Quality',
    carbon_intelligence_agent: 'Carbon',
    maintenance_ops_agent: 'Maintenance'
};

/**
 * Render the agent station cards.
 * @param {Object} statuses - map of agent key -> status string (idle|running|flagged|resolved)
 * @returns {string}
 */
function renderAgents(statuses = {}) {
    const agents = Object.keys(AGENT_NAMES);
    let html = '';
    agents.forEach((key) => {
        const status = statuses[key] || 'idle';
        const label = AGENT_NAMES[key];
        html += `
            <div class="agent-station flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/5" data-agent="${key}">
                <span class="status-dot ${status}"></span>
                <span class="text-xs text-white/80 truncate">${label}</span>
            </div>
        `;
    });
    return html;
}