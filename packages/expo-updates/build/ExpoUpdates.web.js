import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
export default {
    get name() {
        return 'ExpoUpdates';
    },
    async reload() {
        if (!canUseDOM)
            return;
        window.location.reload(true);
    },
};
//# sourceMappingURL=ExpoUpdates.web.js.map