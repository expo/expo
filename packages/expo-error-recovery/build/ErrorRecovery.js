import ExpoErrorRecovery from './ExpoErrorRecovery';
import { setRecoveryPropsToSave } from './ErroRecoveryStore';
import './ErrorRecovery.fx';
export const recoveredProps = _getRecoveredProps();
export function setRecoveryProps(props) {
    setRecoveryPropsToSave(props);
}
function _getRecoveredProps() {
    if (ExpoErrorRecovery.recoveredProps) {
        return JSON.parse(ExpoErrorRecovery.recoveredProps);
    }
    return null;
}
//# sourceMappingURL=ErrorRecovery.js.map