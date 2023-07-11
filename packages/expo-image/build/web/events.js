export function getImageWrapperEventHandler(events) {
    return (event) => {
        if (typeof window !== 'undefined') {
            // this ensures the animation will run, since the starting class is applied at least 1 frame before the target class set in the onLoad event callback
            window.requestAnimationFrame(() => {
                events?.onLoad?.forEach((e) => e?.(event));
            });
        }
        else {
            events?.onLoad?.forEach((e) => e?.(event));
        }
    };
}
//# sourceMappingURL=events.js.map