export const addCancelListener = (callback) => {
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            callback();
        }
    };
    document?.body?.addEventListener?.('keyup', handleEscape);
    return () => {
        document?.body?.removeEventListener?.('keyup', handleEscape);
    };
};
//# sourceMappingURL=addCancelListener.js.map