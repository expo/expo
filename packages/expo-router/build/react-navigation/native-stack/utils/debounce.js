export function debounce(func, duration) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, duration);
    };
}
//# sourceMappingURL=debounce.js.map