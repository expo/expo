import { Platform } from '@unimodules/core';
export default {
    get name() {
        return 'ExponentUpdates';
    },
    async reload() {
        if (!Platform.isDOMAvailable) {
            return;
        }
        location.reload(true);
    },
    async reloadFromCache() {
        if (!Platform.isDOMAvailable) {
            return;
        }
        location.reload(true);
    },
};
//# sourceMappingURL=ExponentUpdates.web.js.map