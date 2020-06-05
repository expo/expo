import { Platform } from '@unimodules/core';
export default {
    get name() {
        return 'ExponentUpdates';
    },
    async reload() {
        if (!Platform.isDOMAvailable)
            return;
        window.location.reload(true);
    },
    async reloadFromCache() {
        if (!Platform.isDOMAvailable)
            return;
        window.location.reload(false);
    },
};
//# sourceMappingURL=ExponentUpdates.web.js.map