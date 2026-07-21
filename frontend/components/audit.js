// Audit Component

/**
 * Render the audit log entries.
 * @param {Array} events - list of event objects
 * @returns {string}
 */
function renderAudit(events = []) {
    if (!events || events.length === 0) {
        return '<div class="text-text-muted/40 text-center py-6">No events yet</div>';
    }
    const recent = events.slice(-30).reverse();
    return recent.map(e => `
        <div class="flex items-start gap-1.5 border-b border-white/5 pb-1">
            <span class="text-text-muted/40 font-mono text-[9px]">${formatTimestamp(e.ts)}</span>
            <span class="text-primary-400 font-mono text-[9px]">${e.agent || 'system'}</span>
            <span class="text-text-muted text-[9px] truncate">:: ${e.action || ''}</span>
        </div>
    `).join('');
}