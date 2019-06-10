import { describeCrossPlatform } from 'jest-expo';
import { NativeModules } from 'react-native';
import * as ErrorRecovery from '../ErrorRecovery/ErrorRecovery';

describeCrossPlatform('ErrorRecovery', () => {
  it('passes the recovery props to the native method', () => {
    ErrorRecovery.setRecoveryProps({ a: 'test' });
    expect(NativeModules.ExponentErrorRecovery.setRecoveryProps).toHaveBeenCalledWith({
      a: 'test',
    });
  });
});
