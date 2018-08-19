import { NativeModules } from 'react-native';
import ErrorRecovery from '../ErrorRecovery';

import { describeCrossPlatform } from '../../test/mocking';

describeCrossPlatform('ErrorRecovery', () => {
  it('passes the recovery props to the native method', () => {
    ErrorRecovery.setRecoveryProps({ a: 'test' });
    expect(NativeModules.ExponentErrorRecovery.setRecoveryProps).toHaveBeenCalledWith({
      a: 'test',
    });
  });
});
