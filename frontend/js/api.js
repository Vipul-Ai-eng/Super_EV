// API Calls 

const API_BASE = window.SUPEREV_API_BASE || '';

/**
 * Fetch the full graph data.
 * @returns {Promise<Object>}
 */
async function getGraph() {
    const res = await fetch(`${API_BASE}/graph`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Fetch audit events.
 * @returns {Promise<Array>}
 */
async function getEvents() {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Trigger an analysis cycle.
 * @returns {Promise<Object>}
 */
async function runCycle() {
    const res = await fetch(`${API_BASE}/run-cycle`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Approve a work order.
 * @param {string|number} id
 * @returns {Promise<void>}
 */
async function approveAction(id) {
    const res = await fetch(`${API_BASE}/work-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/**
 * Dismiss a work order.
 * @param {string|number} id
 * @returns {Promise<void>}
 */
async function dismissAction(id) {
    const res = await fetch(`${API_BASE}/work-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}