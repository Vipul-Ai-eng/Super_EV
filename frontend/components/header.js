// Header Component

/**
 * Render the main header.
 * @param {Object} data - graph data (for provenance label)
 * @returns {string}
 */
function renderHeader(data) {
    const realCount = data?.batteries ? Object.values(data.batteries).filter(b => b.data_source === 'real_nasa_pcoe').length : 0;
    const totalBatteries = data?.batteries ? Object.values(data.batteries).length : 0;
    const label = data ? `${realCount} real NASA PCoE batteries` : 'Loading data...';
    return `
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
                <div class="flex items-center gap-2 text-[10px] text-primary-400/70 font-medium tracking-wider uppercase">
                    <span class="w-1.5 h-1.5 rounded-full bg-primary-400"></span> Live Fleet Intelligence
                </div>
                <h2 class="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">Fleet Overview</h2>
                <p class="text-text-secondary text-sm">6 specialist agents · 1 shared knowledge graph</p>
            </div>
            <div class="flex items-center gap-3 text-xs text-text-muted font-mono bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <span class="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                <span id="prov-real-label">${label}</span>
            </div>
        </div>
    `;
}