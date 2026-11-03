import { View } from 'react-native';
import { ScreenStackItem } from 'react-native-screens';

import { enableLegacyHeaderAppearance } from '../..';
import { DefaultTheme } from '../../react-navigation/native';
import { renderRouter } from '../../testing-library';
import Stack from '../Stack';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

// The flag is module state. Jest gives each test file its own modules, so other files keep the default.
enableLegacyHeaderAppearance();

it('restores the opaque iOS header with theme fonts', async () => {
  await renderRouter({ _layout: () => <Stack />, index: () => <View /> });

  expect(jest.mocked(ScreenStackItem).mock.lastCall?.[0].headerConfig).toMatchObject({
    backgroundColor: DefaultTheme.colors.card,
    translucent: false,
    titleFontWeight: DefaultTheme.fonts.bold.fontWeight,
  });
});
