import * as ErrorRecovery from '../ErrorRecovery/ErrorRecovery';
import ExponentErrorRecovery from '../ErrorRecovery/ExponentErrorRecovery';

it(`passes the recovery props to the native method`, () => {
  ErrorRecovery.setRecoveryProps({ a: 'test' });
  expect(ExponentErrorRecovery.setRecoveryProps).toHaveBeenCalledWith({
    a: 'test',
  });
});
