// Queue Component

/**
 * Render conflicts.
 * @param {Array} conflicts - list of conflict objects
 * @returns {string}
 */
function renderConflicts(conflicts = []) {
    if (!conflicts.length) return '';
    return conflicts.map(c => `
        <div class="rounded-lg border border-error/20 bg-error/5 p-4 animate-fade-in">
            <div class="flex items-center gap-2 text-error text-[10px] font-mono uppercase tracking-wider">
                <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
                ${(c.agents_involved||[]).map(a => AGENT_NAMES[a] || a).join(' vs ')}
            </div>
            <p class="text-sm text-white/80 mt-1.5 leading-relaxed">${c.description || ''}</p>
            <div class="text-xs text-primary-400 mt-2 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
                ${c.resolution_recommendation || ''}
            </div>
        </div>
    `).join('');
}

/**
 * Render the action queue items.
 * @param {Array} queue - list of action objects
 * @param {number} badgeCount - number of pending actions
 * @returns {string}
 */
function renderQueue(queue = [], badgeCount = 0) {
    // Update badge
    const badgeEl = document.getElementById('queue-badge');
    if (badgeEl) badgeEl.textContent = badgeCount;

    if (!queue.length) {
        return `
            <div class="rounded-xl border border-dashed border-white/10 p-6 text-center text-text-muted text-sm">
                No actionable items returned.
            </div>
        `;
    }

    return queue.map((item, idx) => {
        const priority = item.priority ?? idx + 1;
        const cls = priority <= 2 ? 'high' : priority <= 4 ? 'medium' : 'low';
        const owner = AGENT_NAMES[item.owner_agent] || item.owner_agent || 'orchestrator';
        return `
            <div class="action-card rounded-xl bg-white/5 border border-white/5 p-4 flex gap-4 items-start animate-fade-in" id="card-${idx}" data-id="${item.id || idx}">
                <div class="font-mono text-xl font-bold text-white/50 min-w-[32px] text-center">${priority}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[9px] uppercase tracking-wider text-text-muted font-mono">${owner}</span>
                        <span class="priority-badge ${cls}">P${priority}</span>
                    </div>
                    <div class="text-sm text-white/90 mt-1.5 leading-snug">${item.action || ''}</div>
                    <div class="text-xs text-text-muted italic mt-1">${item.trade_off_explained || ''}</div>
                    <div class="flex gap-2 mt-3">
                        <button type="button" class="approve-btn min-h-[34px] px-4 rounded-lg border border-primary-400/20 text-primary-400 text-xs font-medium hover:bg-primary-400/10 transition-all" aria-label="Approve action">Approve</button>
                        <button type="button" class="dismiss-btn min-h-[34px] px-4 rounded-lg border border-error/20 text-error text-xs font-medium hover:bg-error/10 transition-all" aria-label="Dismiss action">Dismiss</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}