import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DefaultTheme, ThemeProvider } from '../../native';
import { PlatformPressable } from '../PlatformPressable';

it('exposes the disabled state', async () => {
  const { getByTestId } = await render(
    <ThemeProvider value={DefaultTheme}>
      <PlatformPressable disabled testID="pressable">
        <Text>Action</Text>
      </PlatformPressable>
    </ThemeProvider>
  );

  expect(getByTestId('pressable').props.accessibilityState.disabled).toBe(true);
});
