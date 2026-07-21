// UI Render Functions 

/**
 * Update the entire dashboard with new data.
 * @param {Object} graph - graph data
 * @param {Object} cycleResult - result from /run-cycle 
 */
function renderDashboard(graph, cycleResult = null) {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    // Header
    const headerHtml = renderHeader(graph);
    // KPIs
    const kpiHtml = renderKPIs(graph);

    // Provenance / status strip 
    const realCount = Object.values(graph.batteries || {}).filter(b => b.data_source === 'real_nasa_pcoe').length;
    const totalBatteries = Object.values(graph.batteries || {}).length;

    // Determine conflict state for the strip (if cycleResult exists)
    let dotClass = 'idle';
    let stripText = 'Ready. Click Run Analysis Cycle to dispatch agents.';
    if (cycleResult?.reconciled) {
        const conflicts = cycleResult.reconciled.conflicts_detected || [];
        const count = conflicts.length;
        dotClass = count > 0 ? 'flagged' : 'resolved';
        stripText = count ? `${count} conflict(s) detected — reconciled.` : 'No conflicts detected. All agents agree.';
    }

    const provenanceHtml = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
            <div class="glass-card rounded-xl p-2.5 lg:col-span-1 flex flex-wrap items-center gap-3 text-xs">
                <span class="flex items-center gap-1.5 text-text-muted">
                    <span class="provenance-dot real"></span>
                    Real: <b class="font-mono text-white/80">${realCount} of ${totalBatteries}</b>
                </span>
                <span class="flex items-center gap-1.5 text-text-muted">
                    <span class="provenance-dot synthetic"></span>
                    Synthetic: <b class="font-mono text-white/80">${totalBatteries - realCount} of ${totalBatteries}</b>
                </span>
            </div>
            <div id="recon-strip" class="glass-card rounded-xl p-2.5 lg:col-span-2 flex items-center gap-2.5 font-mono text-xs text-text-muted overflow-hidden">
                <span id="recon-dot" class="status-dot ${dotClass}"></span>
                <span id="recon-text" class="truncate">${stripText}</span>
            </div>
        </div>
    `;

    // Agents 
    const agentStatuses = cycleResult?.specialist_outputs ? 
        Object.keys(cycleResult.specialist_outputs).reduce((acc, key) => {
            const out = cycleResult.specialist_outputs[key];
            const hasFlags = (out.flags || out.drift_signals || out.at_risk_batteries || []).length > 0;
            acc[key] = hasFlags ? 'flagged' : 'resolved';
            return acc;
        }, {}) : {};

    const agentsHtml = renderAgents(agentStatuses);

    // Conflicts & Queue
    let conflictsHtml = '';
    let queueHtml = '';
    let badgeCount = 0;
    if (cycleResult?.reconciled) {
        const reconciled = cycleResult.reconciled;
        conflictsHtml = renderConflicts(reconciled.conflicts_detected || []);
        const queue = reconciled.unified_action_queue || [];
        badgeCount = queue.length;
        queueHtml = renderQueue(queue, badgeCount);
    } else {
        queueHtml = `
            <div class="rounded-xl border border-dashed border-white/10 p-6 text-center text-text-muted text-sm">
                No analysis run yet. Click Run Analysis Cycle to generate the unified action queue.
            </div>
        `;
    }

    // Audit (initial empty, will be updated later)
    const auditHtml = renderAudit([]);

    // Build full dashboard HTML 
    container.innerHTML = `
        <div class="animate-fade-in">
            ${headerHtml}
            <section id="overview" class="grid grid-cols-2 md:grid-cols-4 gap-3 scroll-mt-16">
                ${kpiHtml}
            </section>
            ${provenanceHtml}
            <div class="dashboard-grid flex gap-4 mt-4">
                <div class="flex-1 min-w-0 space-y-4">
                    <section id="agents" class="glass-card rounded-xl p-4 scroll-mt-16">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Specialist Agents</h3>
                            <span class="chip">6 agents</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2" id="stations">
                            ${agentsHtml}
                        </div>
                        <button id="run-btn" class="btn-primary w-full mt-3 min-h-[40px] rounded-xl text-surface font-semibold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed">
                            RUN ANALYSIS CYCLE
                        </button>
                    </section>
                    <section id="queue" class="glass-card rounded-xl p-4 scroll-mt-16">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Action Queue</h3>
                            <span class="chip">Orchestrator</span>
                        </div>
                        <div id="conflicts-container" class="space-y-2 mb-3">${conflictsHtml}</div>
                        <div id="queue-container" class="space-y-3">${queueHtml}</div>
                    </section>
                </div>
                <div class="w-[240px] flex-shrink-0">
                    <section id="audit" class="glass-card rounded-xl p-4 h-full scroll-mt-16">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Audit Trail</h3>
                            <span class="chip">Live</span>
                        </div>
                        <div id="log-container" class="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 font-mono text-[10px] text-text-muted">
                            ${auditHtml}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `;
}

/**
 * Update the audit log separately.
 * @param {Array} events
 */
function updateAudit(events) {
    const container = document.getElementById('log-container');
    if (container) {
        container.innerHTML = renderAudit(events);
    }
}