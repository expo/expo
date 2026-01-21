import { Children, isValidElement } from 'react';
import { Text } from 'react-native';
import {
  ScreenStackItem as _ScreenStackItem,
  SearchBar as _SearchBar,
  ScreenStackHeaderLeftView as _ScreenStackHeaderLeftView,
  ScreenStackHeaderRightView as _ScreenStackHeaderRightView,
} from 'react-native-screens';

import { router } from '../../../imperative-api';
import { act, renderRouter, screen } from '../../../testing-library';
import Stack from '../../Stack';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
    SearchBar: jest.fn((props) => <actualScreens.SearchBar {...props} />),
    ScreenStackHeaderLeftView: jest.fn((props) => (
      <actualScreens.ScreenStackHeaderLeftView {...props} />
    )),
    ScreenStackHeaderRightView: jest.fn((props) => (
      <actualScreens.ScreenStackHeaderRightView {...props} />
    )),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;
const SearchBar = _SearchBar as jest.MockedFunction<typeof _SearchBar>;
const ScreenStackHeaderLeftView = _ScreenStackHeaderLeftView as jest.MockedFunction<
  typeof _ScreenStackHeaderLeftView
>;
const ScreenStackHeaderRightView = _ScreenStackHeaderRightView as jest.MockedFunction<
  typeof _ScreenStackHeaderRightView
>;

let consoleWarnMock: jest.SpyInstance;
beforeEach(() => {
  consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleWarnMock.mockRestore();
});

describe('when using both composition API and screen options, composition API should take precedence', () => {
  describe('Stack.Screen.Title', () => {
    it('should set title from Stack.Screen.Title over options.title', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Options Title' }}>
              <Stack.Screen.Title>Composition Title</Stack.Screen.Title>
            </Stack.Screen>
          </Stack>
        ),
        index: () => {
          return <Text testID="index">index</Text>;
        },
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      expect(consoleWarnMock).not.toHaveBeenCalled();
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Composition Title');
    });

    describe.each([
      [{ fontSize: 20 }, { fontSize: 16 }],
      [{ fontWeight: '700' as const }, { fontWeight: '400' as const }],
      [{ color: 'red' }, { color: 'blue' }],
      [{ fontFamily: 'Arial' }, { fontFamily: 'Courier' }],
      [
        { fontSize: 18, fontWeight: '600' as const, color: 'green', fontFamily: 'Helvetica' },
        { fontSize: 14, fontWeight: '300' as const, color: 'black', fontFamily: 'Times New Roman' },
      ],
      [{}, {}],
      [
        { fontSize: 20, color: 'purple' },
        { color: 'orange', fontWeight: '200' as const },
      ],
    ])('should set styles %p over %p', (expectedStyles, otherStyles) => {
      const DEFAULT_FONT_FAMILY = 'System';
      const DEFAULT_FONT_WEIGHT = '600';
      const DEFAULT_COLOR = 'rgb(28, 28, 30)';

      it(`should set styles from Stack.Screen.Title over options styles`, () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen
                name="index"
                options={{ title: 'Options Title', headerTitleStyle: otherStyles }}>
                <Stack.Screen.Title style={{ ...expectedStyles }}>
                  Composition Title
                </Stack.Screen.Title>
              </Stack.Screen>
            </Stack>
          ),
          index: () => {
            return <Text testID="index">index</Text>;
          },
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(ScreenStackItem).toHaveBeenCalledTimes(1);
        expect(consoleWarnMock).not.toHaveBeenCalled();
        expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Composition Title');
        expect(ScreenStackItem.mock.calls[0][0].headerConfig.titleFontFamily).toBe(
          'fontFamily' in expectedStyles ? expectedStyles.fontFamily : DEFAULT_FONT_FAMILY
        );
        expect(ScreenStackItem.mock.calls[0][0].headerConfig.titleFontSize).toBe(
          'fontSize' in expectedStyles ? expectedStyles.fontSize : undefined
        );
        expect(ScreenStackItem.mock.calls[0][0].headerConfig.titleFontWeight).toBe(
          'fontWeight' in expectedStyles ? expectedStyles.fontWeight : DEFAULT_FONT_WEIGHT
        );
        expect(ScreenStackItem.mock.calls[0][0].headerConfig.titleColor).toBe(
          'color' in expectedStyles ? expectedStyles.color : DEFAULT_COLOR
        );
      });
    });

    it('should set screen Stack.Toolbar.Title over screenOptions title', () => {
      renderRouter({
        _layout: () => (
          <Stack screenOptions={{ title: 'ScreenOptions Title' }}>
            <Stack.Screen name="index" options={{ title: 'Options Title' }}>
              <Stack.Screen.Title>Screen Title</Stack.Screen.Title>
            </Stack.Screen>
          </Stack>
        ),
        index: () => {
          return <Text testID="index">index</Text>;
        },
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      expect(consoleWarnMock).not.toHaveBeenCalled();
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Screen Title');
    });
  });
});

it('should set options correctly, using composition without separate components', () => {
  function CustomHeaderRight() {
    return <Text>Right</Text>;
  }
  function CustomHeaderLeft() {
    return <Text>Left</Text>;
  }
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index">
          <Stack.Header
            style={{ backgroundColor: '#fff' }}
            largeStyle={{ backgroundColor: '#f00' }}
          />
          <Stack.Screen.Title>Custom Title</Stack.Screen.Title>
          <Stack.Screen.BackButton withMenu={false}>Custom back</Stack.Screen.BackButton>
          <Stack.Toolbar placement="right" asChild>
            <CustomHeaderRight />
          </Stack.Toolbar>
          <Stack.Toolbar placement="left" asChild>
            <CustomHeaderLeft />
          </Stack.Toolbar>
        </Stack.Screen>
        <Stack.Screen name="a">
          <Stack.Header style={{ backgroundColor: '#000', shadowColor: 'transparent' }} />
          <Stack.Screen.Title large>Another Title</Stack.Screen.Title>
          <Stack.Screen.BackButton withMenu={false}>Back123</Stack.Screen.BackButton>
        </Stack.Screen>
      </Stack>
    ),
    index: () => {
      return (
        <>
          <Stack.SearchBar
            placeholder="Search"
            textColor="red"
            tintColor="orange"
            placement="integrated"
            autoCapitalize="sentences"
          />
          <Text testID="index">index</Text>
        </>
      );
    },
    a: () => <Text testID="a">a</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  // 2 calls: one from layout, one from dynamic SearchBar
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(SearchBar).toHaveBeenCalledTimes(1);
  // Left/Right views render on each ScreenStackItem call
  expect(ScreenStackHeaderLeftView).toHaveBeenCalledTimes(2);
  expect(ScreenStackHeaderRightView).toHaveBeenCalledTimes(2);
  expect(consoleWarnMock).not.toHaveBeenCalled();
  // First call is from layout
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Custom Title');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.backgroundColor).toBe('#fff');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.largeTitleBackgroundColor).toBe('#f00');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.disableBackButtonMenu).toBe(true);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.backTitle).toBe('Custom back');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.hideShadow).toBe(undefined);
  // Second call adds SearchBar options
  expect(SearchBar.mock.calls[0][0]).toMatchObject({
    placeholder: 'Search',
    textColor: 'red',
    tintColor: 'orange',
    placement: 'integrated',
    autoCapitalize: 'sentences',
  });
  const leftChild = Children.toArray(ScreenStackHeaderLeftView.mock.calls[0][0].children)[0];
  const rightChild = Children.toArray(ScreenStackHeaderRightView.mock.calls[0][0].children)[0];
  expect(isValidElement(leftChild)).toBe(true);
  expect(isValidElement(rightChild)).toBe(true);
  // To satisfy TypeScript narrowing
  if (isValidElement(leftChild)) {
    expect(leftChild.type).toBe(CustomHeaderLeft);
  }
  // To satisfy TypeScript narrowing
  if (isValidElement(rightChild)) {
    expect(rightChild.type).toBe(CustomHeaderRight);
  }
  jest.clearAllMocks();

  act(() => router.push('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(SearchBar).toHaveBeenCalledTimes(1);
  expect(consoleWarnMock).not.toHaveBeenCalled();
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.title).toBe('Another Title');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backgroundColor).toBe('#000');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.hideShadow).toBe(true);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.disableBackButtonMenu).toBe(true);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backTitle).toBe('Back123');
});

it('custom components used within composition API should not render', () => {
  const customIndexRenderedSpy = jest.fn();
  function CustomIndexHeader() {
    customIndexRenderedSpy();
    return (
      <Stack.Header style={{ backgroundColor: '#fff' }} largeStyle={{ backgroundColor: '#f00' }} />
    );
  }

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
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(1);
  expect(customIndexRenderedSpy).not.toHaveBeenCalled();
});

it('should console warn, when custom component is used within <Stack.Screen>', () => {
  function CustomTitle() {
    return <Stack.Screen.Title>Custom Title</Stack.Screen.Title>;
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
        <Stack.Screen.Title large>Another Title</Stack.Screen.Title>
        <Stack.Screen.BackButton withMenu={false}>Back123</Stack.Screen.BackButton>
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
  expect(consoleWarnMock).toHaveBeenCalledTimes(2);
  expect(consoleWarnMock.mock.calls[0][0]).toBe(
    'Unknown child element passed to Stack.Screen: CustomIndexHeader'
  );
  expect(consoleWarnMock.mock.calls[1][0]).toBe(
    "To render a custom header, set the 'asChild' prop to true on Stack.Header."
  );
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('index');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.largeTitleBackgroundColor).toBe(undefined);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.hideShadow).toBe(undefined);
  jest.clearAllMocks();

  act(() => router.push('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.title).toBe('a');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backgroundColor).toBe('#000');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.hideShadow).toBe(true);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.disableBackButtonMenu).toBe(false);
});

it('should set options correctly, when used inside page', () => {
  function CustomHeaderRight() {
    return <Text>Right</Text>;
  }
  function CustomHeaderLeft() {
    return <Text>Left</Text>;
  }
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index">
          <Stack.Header
            style={{ backgroundColor: '#000' }}
            largeStyle={{ backgroundColor: '#aaa' }}
          />
        </Stack.Screen>
      </Stack>
    ),
    index: () => {
      return (
        <>
          <Stack.Screen>
            <Stack.Header
              style={{ backgroundColor: '#fff' }}
              largeStyle={{ backgroundColor: '#f00' }}
            />
            <Stack.Screen.Title>Custom Title</Stack.Screen.Title>
            <Stack.Screen.BackButton withMenu={false}>Custom back</Stack.Screen.BackButton>
            <Stack.Toolbar placement="right" asChild>
              <CustomHeaderRight />
            </Stack.Toolbar>
            <Stack.Toolbar placement="left" asChild>
              <CustomHeaderLeft />
            </Stack.Toolbar>
          </Stack.Screen>
          <Stack.SearchBar
            placeholder="Search"
            textColor="red"
            tintColor="orange"
            placement="integrated"
            autoCapitalize="sentences"
          />
          <Text testID="index">index</Text>;
        </>
      );
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  // React batches the Stack.Screen and SearchBar updates
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(SearchBar).toHaveBeenCalledTimes(1);
  expect(ScreenStackHeaderLeftView).toHaveBeenCalledTimes(1);
  expect(ScreenStackHeaderRightView).toHaveBeenCalledTimes(1);
  expect(consoleWarnMock).not.toHaveBeenCalled();

  expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('index');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.backgroundColor).toBe('#000');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.largeTitleBackgroundColor).toBe('#aaa');

  // Second call has the dynamic page options merged
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.title).toBe('Custom Title');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backgroundColor).toBe('#fff');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.largeTitleBackgroundColor).toBe('#f00');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.disableBackButtonMenu).toBe(true);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backTitle).toBe('Custom back');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.hideShadow).toBe(undefined);
  expect(SearchBar.mock.calls[0][0]).toMatchObject({
    placeholder: 'Search',
    textColor: 'red',
    tintColor: 'orange',
    placement: 'integrated',
    autoCapitalize: 'sentences',
  });
  const leftChild = Children.toArray(ScreenStackHeaderLeftView.mock.calls[0][0].children)[0];
  const rightChild = Children.toArray(ScreenStackHeaderRightView.mock.calls[0][0].children)[0];
  expect(isValidElement(leftChild)).toBe(true);
  expect(isValidElement(rightChild)).toBe(true);
  // To satisfy TypeScript narrowing
  if (isValidElement(leftChild)) {
    expect(leftChild.type).toBe(CustomHeaderLeft);
  }
  // To satisfy TypeScript narrowing
  if (isValidElement(rightChild)) {
    expect(rightChild.type).toBe(CustomHeaderRight);
  }
});
