// KPI Component

/**
 * Render the KPI cards.
 * @param {Object} graph - full graph data
 * @returns {string}
 */
function renderKPIs(graph) {
    const vehicles = Object.values(graph.vehicles || {});
    const batteries = Object.values(graph.batteries || {});
    const suppliers = Object.values(graph.suppliers || {});
    const evCount = vehicles.filter(v => v.powertrain === 'EV').length;
    const dieselCount = vehicles.length - evCount;
    const avgSoh = batteries.length ?
        (batteries.reduce((s, b) => s + (b.soh_pct || 0), 0) / batteries.length).toFixed(1) :
        '—';
    const flaggedSuppliers = suppliers.filter(s => getFlagsCount(s) > 0 || (s.concentration_share_pct || 0) > 40).length;
    const baseline = graph.emissions?.baseline;
    const target = baseline ? `${baseline.target_reduction_pct_2030}%` : '—';
    const sohColor = (avgSoh === '—') ? 'text-white' :
        (parseFloat(avgSoh) < 75 ? 'text-error' : (parseFloat(avgSoh) < 85 ? 'text-warning' : 'text-white'));

    return `
        <div class="kpi-card glass-card rounded-xl p-3">
            <div class="flex justify-between items-start">
                <span class="text-[10px] uppercase tracking-wider text-text-muted">EV / Diesel</span>
                <span class="material-symbols-outlined text-primary-400 text-lg">directions_car</span>
            </div>
            <div class="metric-value text-white mt-1">${evCount} / ${dieselCount}</div>
            <div class="text-[10px] text-text-muted">electrification progress</div>
        </div>
        <div class="kpi-card glass-card rounded-xl p-3">
            <div class="flex justify-between items-start">
                <span class="text-[10px] uppercase tracking-wider text-text-muted">Avg SOH</span>
                <span class="material-symbols-outlined text-info text-lg">battery_charging_full</span>
            </div>
            <div class="metric-value ${sohColor} mt-1">${avgSoh}%</div>
            <div class="text-[10px] text-text-muted">fleet average</div>
        </div>
        <div class="kpi-card glass-card rounded-xl p-3">
            <div class="flex justify-between items-start">
                <span class="text-[10px] uppercase tracking-wider text-text-muted">Flagged Suppliers</span>
                <span class="material-symbols-outlined ${flaggedSuppliers > 0 ? 'text-error' : 'text-text-muted'} text-lg">warning</span>
            </div>
            <div class="metric-value ${flaggedSuppliers > 0 ? 'text-error' : 'text-white'} mt-1">${flaggedSuppliers}</div>
            <div class="text-[10px] text-text-muted">concentration / ESG risk</div>
        </div>
        <div class="kpi-card glass-card rounded-xl p-3">
            <div class="flex justify-between items-start">
                <span class="text-[10px] uppercase tracking-wider text-text-muted">Scope 1 Target</span>
                <span class="material-symbols-outlined text-warning text-lg">eco</span>
            </div>
            <div class="metric-value text-warning mt-1">${target}</div>
            <div class="text-[10px] text-text-muted">reduction target 2030</div>
        </div>
    `;
}