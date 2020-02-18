import { setRecoveryPropsToSave } from './ErroRecoveryStore';
import ExpoErrorRecovery from './ExpoErrorRecovery';
import './ErrorRecovery.fx';

export const recoveredProps = _getRecoveredProps();

export type Props = {
  [key: string]: any;
};

export function setRecoveryProps(props: Props): void {
  setRecoveryPropsToSave(props);
}

function _getRecoveredProps(): Props | null {
  if (ExpoErrorRecovery.recoveredProps) {
    return JSON.parse(ExpoErrorRecovery.recoveredProps);
  }
  return null;
}
