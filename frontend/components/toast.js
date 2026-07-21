// Toast Component

const TOAST_CONTAINER = document.getElementById('toast-container');

/**
 * Show a toast notification.
 * @param {string} message - message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-up`;
    const icon = type === 'success' ? 'check_circle' : 'error';
    toast.innerHTML = `
        <span class="material-symbols-outlined toast-icon text-${type === 'success' ? 'success' : 'error'}">${icon}</span>
        <span class="text-sm text-white/90">${message}</span>
    `;
    TOAST_CONTAINER.appendChild(toast);

    // Limit to 5 toasts
    while (TOAST_CONTAINER.children.length > 5) {
        TOAST_CONTAINER.firstChild.remove();
    }

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}