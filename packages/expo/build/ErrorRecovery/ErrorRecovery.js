import { UnavailabilityError } from '@unimodules/core';
import ExponentErrorRecovery from './ExponentErrorRecovery';
export function setRecoveryProps(props) {
    if (!ExponentErrorRecovery.setRecoveryProps) {
        throw new UnavailabilityError('ErrorRecovery', 'setRecoveryProps');
    }
    ExponentErrorRecovery.setRecoveryProps(props);
}
//# sourceMappingURL=ErrorRecovery.js.map