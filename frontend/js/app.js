// Application Entry

document.addEventListener('DOMContentLoaded', function() {
    // Render sidebar and mobile nav
    const sidebarContent = document.getElementById('sidebar-content');
    if (sidebarContent) {
        sidebarContent.innerHTML = renderSidebar();
    }
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
        mobileNav.innerHTML = renderMobileNav();
    }

    // Initial empty state
    const container = document.getElementById('dashboard-container');
    if (container) {
        container.innerHTML = `
            ${renderHeader()}
            <section id="overview" class="grid grid-cols-2 md:grid-cols-4 gap-3 scroll-mt-16">
                ${renderKPIs({ vehicles: [], batteries: [], suppliers: [], emissions: {} })}
            </section>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
                <div class="glass-card rounded-xl p-2.5 lg:col-span-1 flex flex-wrap items-center gap-3 text-xs">
                    <span class="flex items-center gap-1.5 text-text-muted"><span class="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(71,228,158,0.4)]"></span>Real: <b class="font-mono text-white/80">—</b></span>
                    <span class="flex items-center gap-1.5 text-text-muted"><span class="w-1.5 h-1.5 rounded-full bg-white/20"></span>Synthetic: <b class="font-mono text-white/80">—</b></span>
                </div>
                <div id="recon-strip" class="glass-card rounded-xl p-2.5 lg:col-span-2 flex items-center gap-2.5 font-mono text-xs text-text-muted overflow-hidden">
                    <span id="recon-dot" class="status-dot idle"></span>
                    <span id="recon-text" class="truncate">Sign in to load data.</span>
                </div>
            </div>
            <div class="dashboard-grid flex gap-4 mt-4">
                <div class="flex-1 min-w-0 space-y-4">
                    <section id="agents" class="glass-card rounded-xl p-4 scroll-mt-16">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Specialist Agents</h3>
                            <span class="chip">6 agents</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2" id="stations">
                            ${renderAgents()}
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
                        <div id="conflicts-container" class="space-y-2 mb-3"></div>
                        <div id="queue-container" class="space-y-3">
                            <div class="rounded-xl border border-dashed border-white/10 p-6 text-center text-text-muted text-sm">
                                Sign in and run analysis.
                            </div>
                        </div>
                    </section>
                </div>
                <div class="w-[240px] flex-shrink-0">
                    <section id="audit" class="glass-card rounded-xl p-4 h-full scroll-mt-16">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Audit Trail</h3>
                            <span class="chip">Live</span>
                        </div>
                        <div id="log-container" class="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 font-mono text-[10px] text-text-muted">
                            <div class="text-text-muted/40 text-center py-6">Sign in to view events</div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    // Bind all event listeners
    bindEvents();

    // Expose toggleSidebar globally so the inline onclick works
    window.toggleSidebar = toggleSidebar;
});