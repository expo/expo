import { SafeAreaProvider as UpstreamSafeAreaProvider } from 'react-native-safe-area-context';

import { SafeAreaProvider } from '../SafeAreaProvider';

it('uses the upstream provider on native', () => {
  expect(SafeAreaProvider).toBe(UpstreamSafeAreaProvider);
});
