export function throttle(func, duration) {
    let timeout;
    return function (...args) {
        if (timeout == null) {
            func.apply(this, args);
            timeout = setTimeout(() => {
                timeout = undefined;
            }, duration);
        }
    };
}
//# sourceMappingURL=throttle.js.map