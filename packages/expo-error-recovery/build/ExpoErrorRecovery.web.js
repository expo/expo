import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
const LOCAL_STORAGE_KEY = 'EXPO_ERROR_RECOVERY_STORAGE';
function _consumeRecoveryProps() {
    if (!canUseDOM)
        return null;
    const props = localStorage.getItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return props;
}
export default {
    get name() {
        return 'ExpoErrorRecovery';
    },
    saveRecoveryProps(props) {
        if (!canUseDOM)
            return;
        localStorage.setItem(LOCAL_STORAGE_KEY, props);
    },
    recoveredProps: _consumeRecoveryProps(),
};
//# sourceMappingURL=ExpoErrorRecovery.web.js.map