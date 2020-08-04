import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
export default {
    get name() {
        return 'ExponentUpdates';
    },
    async reload() {
        if (!canUseDOM)
            return;
        window.location.reload(true);
    },
    async reloadFromCache() {
        if (!canUseDOM)
            return;
        window.location.reload(false);
    },
};
//# sourceMappingURL=ExponentUpdates.web.js.map