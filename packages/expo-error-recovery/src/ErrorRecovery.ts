import { setRecoveryPropsToSave } from './ErroRecoveryStore';
import ExpoErrorRecovery from './ExpoErrorRecovery';
import './ErrorRecovery.fx';

export const recoveredProps = _getRecoveredProps();

export function setRecoveryProps(props: { [key: string]: any }): void {
  setRecoveryPropsToSave(props);
}

function _getRecoveredProps(): { [key: string]: any } | null {
  if (ExpoErrorRecovery.recoveredProps) {
    return JSON.parse(ExpoErrorRecovery.recoveredProps);
  }
  return null;
}
