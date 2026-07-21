// Utilities 

/**
 * Safely convert a value to an array.
 * @param {any} value
 * @returns {Array}
 */
function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

/**
 * Get the number of deviation flags for a supplier.
 * @param {Object} supplier
 * @returns {number}
 */
function getFlagsCount(supplier) {
    const flags = safeArray(supplier.recent_deviation_flags);
    return flags.length;
}

/**
 * Format a timestamp to local time string.
 * Handles seconds (number) or ISO date strings.
 * If the number is > 1e12, it's treated as milliseconds.
 * @param {number|string} ts - timestamp in seconds (number) or date string
 * @returns {string} formatted time or '—' on error
 */
function formatTimestamp(ts) {
    if (!ts) return '—';
    let d;
    if (typeof ts === 'number') {
        // If timestamp is in milliseconds (e.g., > 1e12), use as is; otherwise treat as seconds.
        d = new Date(ts > 1e12 ? ts : ts * 1000);
    } else {
        d = new Date(ts);
    }
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString();
}

/**
 * Generate HTML for skeleton loading placeholders.
 * @param {number} count - number of skeleton items
 * @returns {string}
 */
function skeletonHtml(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="rounded-xl bg-white/5 border border-white/5 p-3">
                <div class="skeleton-line w-1/3 mb-2"></div>
                <div class="skeleton-line w-full mb-1.5"></div>
                <div class="skeleton-line w-2/3"></div>
                <div class="flex gap-2 mt-2">
                    <div class="skeleton-line w-12 h-7 rounded-lg"></div>
                    <div class="skeleton-line w-12 h-7 rounded-lg"></div>
                </div>
            </div>
        `;
    }
    return html;
}