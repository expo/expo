import { setRecoveryPropsToSave } from './ErroRecoveryStore';
import ExpoErrorRecovery from './ExpoErrorRecovery';
import './ErrorRecovery.fx';

export const recoveredProps = _getRecoveredProps();

export type ErrorRecoveryProps = Record<string, any>;

export function setRecoveryProps(props: ErrorRecoveryProps): void {
  setRecoveryPropsToSave(props);
}

function _getRecoveredProps(): ErrorRecoveryProps | null {
  if (ExpoErrorRecovery.recoveredProps) {
    return JSON.parse(ExpoErrorRecovery.recoveredProps);
  }
  return null;
}
