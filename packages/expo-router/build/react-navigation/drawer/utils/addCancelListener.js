"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCancelListener = void 0;
const addCancelListener = (callback) => {
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
exports.addCancelListener = addCancelListener;
//# sourceMappingURL=addCancelListener.js.map