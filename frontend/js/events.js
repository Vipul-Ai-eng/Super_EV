// Event Handlers

let isAuthenticated = false;
let isSidebarCollapsed = false;

/**
 * Reset all agent status dots to a given state.
 * @param {string} status - 'idle', 'running', 'flagged', or 'resolved'
 */
function resetAgentStatuses(status = 'idle') {
    document.querySelectorAll('.agent-station').forEach(el => {
        const dot = el.querySelector('.status-dot');
        if (dot) {
            dot.className = `status-dot ${status}`;
            if (status === 'running') {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        }
    });
}

/**
 * Handle login button click.
 */
function handleLogin() {
    if (isAuthenticated) return;
    isAuthenticated = true;
    const authScreen = document.getElementById('auth-screen');
    authScreen.style.opacity = '0';
    setTimeout(() => {
        authScreen.style.display = 'none';
    }, 300);
    showToast('Signed in successfully', 'success');
    loadInitialData();
}

/**
 * Toggle sidebar (desktop collapse / mobile slide).
 */
function toggleSidebar() {
    const isMobile = window.innerWidth < 1025;
    const sidebar = document.getElementById('desktop-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (isMobile) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('hidden');
    } else {
        isSidebarCollapsed = !isSidebarCollapsed;
        document.body.classList.toggle('sidebar-collapsed', isSidebarCollapsed);
        const btn = document.getElementById('sidebar-toggle-btn');
        const chevron = btn?.querySelector('.material-symbols-outlined');
        if (chevron) {
            chevron.textContent = isSidebarCollapsed ? 'chevron_right' : 'chevron_left';
        }
    }
}

/**
 * Load initial graph and events after login.
 */
async function loadInitialData() {
    try {
        const graph = await getGraph();
        renderDashboard(graph);
        const events = await getEvents();
        updateAudit(events);
    } catch (e) {
        console.error('Initial load error:', e);
        showToast('Failed to load initial data', 'error');
        // Show a user‑friendly fallback inside the dashboard
        const container = document.getElementById('dashboard-container');
        if (container) {
            container.innerHTML = `
                <div class="glass-card rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-4xl text-error">error</span>
                    <p class="text-text-muted mt-2">Could not load fleet data.</p>
                    <p class="text-xs text-text-muted/50">Please refresh the page or check your API connection.</p>
                </div>
            `;
        }
    }
}

/**
 * Run the analysis cycle.
 */
async function handleRunCycle() {
    if (!isAuthenticated) {
        showToast('Please sign in first', 'error');
        return;
    }
    const runBtn = document.getElementById('run-btn');
    if (!runBtn) return; // safety guard
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> RUNNING...';

    // Set all agents to running
    resetAgentStatuses('running');

    const queueContainer = document.getElementById('queue-container');
    const conflictsContainer = document.getElementById('conflicts-container');
    if (queueContainer) queueContainer.innerHTML = skeletonHtml(3);
    if (conflictsContainer) conflictsContainer.innerHTML = '';

    try {
        const data = await runCycle();
        const graph = await getGraph();
        renderDashboard(graph, data);
        const events = await getEvents();
        updateAudit(events);
        showToast('Analysis cycle completed successfully', 'success');
    } catch (e) {
        console.error('runCycle error:', e);
        showToast(`Cycle failed: ${e.message}`, 'error');
        if (queueContainer) {
            queueContainer.innerHTML = `
                <div class="rounded-xl border border-dashed border-white/10 p-6 text-center text-text-muted text-sm">
                    Analysis cycle failed: ${e.message}
                </div>
            `;
        }
        // Reset agents to idle on failure
        resetAgentStatuses('idle');
    } finally {
        // Reset run button
        const newBtn = document.getElementById('run-btn');
        if (newBtn) {
            newBtn.disabled = false;
            newBtn.innerHTML = 'RUN ANALYSIS CYCLE';
        }
    }
}

/**
 * Handle approve/dismiss action.
 * @param {number} idx - index of the card
 * @param {string} action - 'approve' or 'dismiss'
 * @param {string|number} id - work order ID (or fallback)
 */
async function handleAction(idx, action, id) {
    const card = document.getElementById(`card-${idx}`);
    if (!card || card.classList.contains('done')) return;

    // Optimistic UI
    card.classList.add('done');
    const badge = document.getElementById('queue-badge');
    const current = parseInt(badge?.textContent || '0');
    if (badge) badge.textContent = Math.max(0, current - 1);

    try {
        if (action === 'approve') {
            await approveAction(id || idx);
        } else {
            await dismissAction(id || idx);
        }
        showToast(`Action ${action}d successfully`, 'success');
    } catch (e) {
        console.warn('Action API error:', e);
        // Rollback
        card.classList.remove('done');
        if (badge) badge.textContent = current + 1;
        // If 405, it's a demo fallback (simulate success)
        if (e.message.includes('405')) {
            showToast(`Action ${action}d (simulated — backend 405)`, 'success');
            // Keep it done
            card.classList.add('done');
            if (badge) badge.textContent = Math.max(0, current - 1);
            return;
        }
        showToast(`Failed to ${action}: ${e.message}`, 'error');
    }
}

// ─── Bind Events ──────────────────────────────────────────────

function bindEvents() {
    // Auth button
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) authBtn.addEventListener('click', handleLogin);

    // Sidebar toggle button (desktop)
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);

    // Mobile toggle
    const mobileToggle = document.getElementById('mobile-toggle-btn');
    if (mobileToggle) mobileToggle.addEventListener('click', toggleSidebar);

    // Run button (delegated – works even after re-render)
    document.addEventListener('click', function(e) {
        if (e.target.closest('#run-btn')) {
            handleRunCycle();
        }
    });

    // Approve/Dismiss buttons (delegated)
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.approve-btn, .dismiss-btn');
        if (!target) return;
        const card = target.closest('.action-card');
        if (!card) return;
        const idx = parseInt(card.id.replace('card-', ''));
        const id = card.dataset.id;
        const action = target.classList.contains('approve-btn') ? 'approve' : 'dismiss';
        handleAction(idx, action, id);
    });

    // Escape key to close mobile sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('desktop-sidebar');
            if (sidebar?.classList.contains('open')) toggleSidebar();
        }
    });

    // Scroll‑spy for nav
    const main = document.querySelector('main');
    if (main) {
        main.addEventListener('scroll', updateActiveNav);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const isMobile = window.innerWidth < 1025;
            const sidebar = document.getElementById('desktop-sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (!isMobile) {
                // If on desktop, ensure mobile overlay is hidden and sidebar is visible
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.add('hidden');
                // If we were collapsed, keep it collapsed; else ensure it's visible
                if (!isSidebarCollapsed) {
                    document.body.classList.remove('sidebar-collapsed');
                }
            }
            // On mobile, we let the user toggle manually – no forced changes
        }, 200);
    });
}

// Nav scroll‑spy

function updateActiveNav() {
    const sections = ['overview', 'agents', 'queue', 'battery', 'supply', 'carbon', 'audit'];
    let current = sections[0];
    for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 120) current = id;
    }
    document.querySelectorAll('.nav-link').forEach(a => {
        const href = a.getAttribute('href');
        a.classList.toggle('active', href === '#' + current);
    });
}