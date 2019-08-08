import { UnavailabilityError } from '@unimodules/core';
import ExponentErrorRecovery from './ExponentErrorRecovery';

export function setRecoveryProps(props: { [key: string]: any }): void {
  if (!ExponentErrorRecovery.setRecoveryProps) {
    throw new UnavailabilityError('ErrorRecovery', 'setRecoveryProps');
  }

  ExponentErrorRecovery.setRecoveryProps(props);
}