import { Text } from 'react-native';
import { ScreenStackItem as _ScreenStackItem } from 'react-native-screens';

import { router } from '../../../imperative-api';
import { act, renderRouter, screen } from '../../../testing-library';
import Stack from '../../Stack';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    ScreenStackItem: jest.fn(({ children }) => <View testID="ScreenStackItem">{children}</View>),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;

it('should set options correctly, using composition without separate components', () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index">
          <Stack.Header
            style={{ backgroundColor: '#fff' }}
            largeStyle={{ backgroundColor: '#f00' }}>
            <Stack.Header.Title>Custom Title</Stack.Header.Title>
          </Stack.Header>
        </Stack.Screen>
        <Stack.Screen name="a">
          <Stack.Header style={{ backgroundColor: '#000', shadowColor: 'transparent' }}>
            <Stack.Header.Title large>Another Title</Stack.Header.Title>
            <Stack.Header.BackButton withMenu={false}>Back123</Stack.Header.BackButton>
          </Stack.Header>
        </Stack.Screen>
      </Stack>
    ),
    index: () => {
      return <Text testID="index">index</Text>;
    },
    a: () => <Text testID="a">a</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(1);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Custom Title');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.backgroundColor).toBe('#fff');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.largeTitleBackgroundColor).toBe('#f00');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.disableBackButtonMenu).toBe(false);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.hideShadow).toBe(undefined);
  jest.clearAllMocks();

  act(() => router.push('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.title).toBe('Another Title');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backgroundColor).toBe('#000');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.hideShadow).toBe(true);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.disableBackButtonMenu).toBe(true);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backTitle).toBe('Back123');
});

it("should set options correctly, using composition with separate components, that don't use hooks", () => {
  function CustomTitle() {
    return <Stack.Header.Title>Custom Title</Stack.Header.Title>;
  }
  function CustomIndexHeader() {
    return (
      <Stack.Header style={{ backgroundColor: '#fff' }} largeStyle={{ backgroundColor: '#f00' }}>
        <CustomTitle />
      </Stack.Header>
    );
  }
  function CustomAHeaderContent() {
    return (
      <>
        <Stack.Header.Title large>Another Title</Stack.Header.Title>
        <Stack.Header.BackButton withMenu={false}>Back123</Stack.Header.BackButton>
      </>
    );
  }
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index">
          <CustomIndexHeader />
        </Stack.Screen>
        <Stack.Screen name="a">
          <Stack.Header style={{ backgroundColor: '#000', shadowColor: 'transparent' }}>
            <CustomAHeaderContent />
          </Stack.Header>
        </Stack.Screen>
      </Stack>
    ),
    index: () => {
      return <Text testID="index">index</Text>;
    },
    a: () => <Text testID="a">a</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(1);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Custom Title');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.backgroundColor).toBe('#fff');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.largeTitleBackgroundColor).toBe('#f00');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.disableBackButtonMenu).toBe(false);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.hideShadow).toBe(undefined);
  jest.clearAllMocks();

  act(() => router.push('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.title).toBe('Another Title');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backgroundColor).toBe('#000');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.hideShadow).toBe(true);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.disableBackButtonMenu).toBe(true);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backTitle).toBe('Back123');
});

it('should throw an error when using composition with separate components, that use hooks inside', () => {
  function CustomIndexHeader() {
    const [count, setCount] = React.useState(0);
    return (
      <Stack.Header style={{ backgroundColor: '#fff' }} largeStyle={{ backgroundColor: '#f00' }} />
    );
  }
  expect(() =>
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="index">
            <CustomIndexHeader />
          </Stack.Screen>
        </Stack>
      ),
      index: () => {
        return <Text testID="index">index</Text>;
      },
    })
  ).toThrow(
    'Using hooks inside custom header components is not supported. Please avoid using hooks in components passed to Stack.Header.'
  );
});
