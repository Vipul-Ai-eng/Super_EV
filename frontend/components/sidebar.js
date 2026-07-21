// Sidebar Component

/**
 * Render the desktop sidebar HTML.
 * @param {Object} options - { collapsed: boolean }
 * @returns {string}
 */
function renderSidebar(options = {}) {
    const collapsed = options.collapsed || false;
    const brandClass = collapsed ? 'hidden' : '';

    return `
        <div class="px-4 py-4 flex items-center justify-between border-b border-white/5">

            <div class="flex items-center gap-3">

                <!-- Logo -->
                <div class="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <img
                    src="/assets/logo.png"
                    alt="SuperEV Logo"
                    class="h-10 w-auto object-contain"
                    loading="eager"
                    decoding="async"
                    />
                </div>

                <!-- Brand -->
                <div class="brand-text ${brandClass}">
                    <h1 class="font-display font-bold text-white text-lg tracking-tight leading-none">
                        SuperEV
                    </h1>

                    <p class="text-[9px] uppercase tracking-[0.15em] text-primary-400/60 font-medium">
                        OPS INTELLIGENCE
                    </p>
                </div>

            </div>

            <button
            id="sidebar-toggle-btn"
            type="button"
            aria-label="Collapse sidebar"
            aria-expanded="${!collapsed}"
            title="Collapse sidebar">

                <span class="material-symbols-outlined text-lg">
                    chevron_left
                </span>

            </button>

        </div>

        <nav 
        class="flex-1 overflow-y-auto"
        aria-label="Primary navigation">
        <ul class="px-3 py-4 space-y-1">

            <li>
                <a href="#overview" 
                aria-label="Overview" 
                class="nav-link active flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60">
                    <span class="material-symbols-outlined text-xl flex-shrink-0">dashboard</span>
                    <span class="nav-label ${brandClass}">Overview</span>
                </a>
            </li>

            <li>
                <a href="#agents" 
                aria-label="AI Agents" 
                class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60">
                    <span class="material-symbols-outlined text-xl flex-shrink-0">hub</span>
                    <span class="nav-label ${brandClass}">AI Agents</span>
                </a>
            </li>

            <li>
                <a href="#queue" 
                aria-label="Action Queue"
                class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60">
                    <span class="material-symbols-outlined text-xl flex-shrink-0">assignment_turned_in</span>
                    <span class="nav-label ${brandClass}">Action Queue</span>

                    <span
                        id="queue-badge"
                        class="ml-auto text-[10px] bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full badge-count ${brandClass}">
                        0
                    </span>
                </a>
            </li>

            <!-- Battery, Supply, Carbon links removed -->

            <li>
                <a href="#audit" 
                aria-label="Audit Trail"
                class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60">
                    <span class="material-symbols-outlined text-xl flex-shrink-0">history</span>
                    <span class="nav-label ${brandClass}">Audit Trail</span>
                </a>
            </li>

        </ul>

        <div class="px-4 py-4 border-t border-white/5">

            <div class="flex items-center gap-2.5">

                <div class="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-primary-400 text-sm">
                        account_circle
                    </span>
                </div>

                <div class="user-details ${brandClass} text-xs">
                    <p class="text-white/80 font-medium">Fleet Ops</p>
                    <p class="text-white/40 text-[10px]">Demo · v0.4</p>
                </div>

            </div>

            <div class="mt-3 flex items-center gap-2 text-[10px] text-white/30">
                <span class="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                <span>NASA PCoE · Real data</span>
            </div>

        </div>
    `;
}

/**
 * Render the mobile navigation HTML.
 * @returns {string}
 */
function renderMobileNav() {
    return `
        <button id="mobile-toggle-btn" class="text-white/60 hover:text-white">
            <span class="material-symbols-outlined">menu</span>
        </button>

        <div class="flex items-center gap-2">

            <div class="w-8 h-8 flex items-center justify-center">
                <img
                    src="/assets/logo.png"
                    alt="SuperEV Logo"
                    class="w-full h-full object-contain"
                />
            </div>

            <span class="font-display font-bold text-white text-sm">
                SuperEV
            </span>

        </div>

        <div class="flex items-center gap-1 overflow-x-auto">

            <a href="#overview" 
            aria-label="Overview"
            class="nav-link active flex flex-col items-center px-2 py-1 text-[9px] uppercase tracking-wider text-white/40">
                <span class="material-symbols-outlined text-lg">dashboard</span>
                <span>Overview</span>
            </a>

            <a href="#queue" 
            aria-label="Action Queue"
            class="nav-link flex flex-col items-center px-2 py-1 text-[9px] uppercase tracking-wider text-white/40">
                <span class="material-symbols-outlined text-lg">assignment_turned_in</span>
                <span>Queue</span>
            </a>

            <a href="#audit" 
            aria-label="Audit Trail"
            class="nav-link flex flex-col items-center px-2 py-1 text-[9px] uppercase tracking-wider text-white/40">
                <span class="material-symbols-outlined text-lg">history</span>
                <span>Audit</span>
            </a>

        </div>
    `;
}