import { render, within } from '@testing-library/react-native';
import { Text } from 'react-native';

import { RouterToolbarHost } from '../native';

jest.mock('@expo/ui/jetpack-compose', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    Host: jest.fn((props) => <View testID="Host" {...props} />),
    Box: jest.fn((props) => <View testID="Box" {...props} />),
    HorizontalFloatingToolbar: jest.fn((props) => (
      <View testID="HorizontalFloatingToolbar" {...props} />
    )),
  };
});

jest.mock('@expo/ui/jetpack-compose/modifiers', () => ({
  fillMaxWidth: jest.fn(() => ({ type: 'fillMaxWidth' })),
  height: jest.fn((h: number) => ({ type: 'height', height: h })),
  padding: jest.fn((...args: number[]) => ({ type: 'padding', values: args })),
  imePadding: jest.fn(() => ({ type: 'imePadding' })),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 12, left: 0, right: 0 }),
}));

const flatten = (style: unknown) =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));

describe('RouterToolbarHost (Android bottom toolbar)', () => {
  it('does not cover the full screen so touches above the toolbar pass through', () => {
    const { getByTestId } = render(
      <RouterToolbarHost>
        <Text>item</Text>
      </RouterToolbarHost>
    );

    const host = getByTestId('Host');
    const wrapper = getByTestId('RouterToolbarWrapper');

    // The wrapper fills the screen but must not be a touch target itself, and it must pin the
    // toolbar to the bottom so the Compose host only covers the toolbar area.
    expect(wrapper.props.pointerEvents).toBe('box-none');
    expect(flatten(wrapper.props.style).justifyContent).toBe('flex-end');

    expect(host.props.matchContents.vertical).toBe(true);
  });

  it('renders its children inside the floating toolbar', () => {
    const { getByTestId } = render(
      <RouterToolbarHost>
        <Text testID="toolbar-child">item</Text>
      </RouterToolbarHost>
    );

    const toolbar = getByTestId('HorizontalFloatingToolbar');
    expect(within(toolbar).getByTestId('toolbar-child')).toBeDefined();
  });

  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])(
    'includes the imePadding modifier only when withImePadding is %s',
    (withImePadding, expected) => {
      const { getByTestId } = render(
        <RouterToolbarHost withImePadding={withImePadding}>
          <Text>item</Text>
        </RouterToolbarHost>
      );

      const modifiers = getByTestId('Box').props.modifiers as { type: string }[];
      expect(modifiers.some((m) => m.type === 'imePadding')).toBe(expected);
    }
  );
});
