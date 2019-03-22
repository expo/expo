import { UnavailabilityError } from '@unimodules/core';
import ExponentErrorRecovery from './ExponentErrorRecovery';

export default {
  setRecoveryProps(props: { [key: string]: any }): void {
    if (!ExponentErrorRecovery.setRecoveryProps) {
      throw new UnavailabilityError('ErrorRecovery', 'setRecoveryProps');
    }

    return ExponentErrorRecovery.setRecoveryProps(props);
  },
};
