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
  describe('Stack.Header.Title', () => {
    it('should set title from Stack.Header.Title over options.title', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Options Title' }}>
              <Stack.Header>
                <Stack.Header.Title>Composition Title</Stack.Header.Title>
              </Stack.Header>
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

      it(`should set styles from Stack.Header.Title over options styles`, () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Screen
                name="index"
                options={{ title: 'Options Title', headerTitleStyle: otherStyles }}>
                <Stack.Header>
                  <Stack.Header.Title style={{ ...expectedStyles }}>
                    Composition Title
                  </Stack.Header.Title>
                </Stack.Header>
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

      it(`should set styles from options over Stack.Header.Title used at root level`, () => {
        renderRouter({
          _layout: () => (
            <Stack>
              <Stack.Header>
                <Stack.Header.Title style={{ ...otherStyles }}>Root Title</Stack.Header.Title>
              </Stack.Header>
              <Stack.Screen
                name="index"
                options={{ title: 'Options Title', headerTitleStyle: expectedStyles }}
              />
            </Stack>
          ),
          index: () => {
            return <Text testID="index">index</Text>;
          },
        });

        expect(screen.getByTestId('index')).toBeVisible();
        expect(ScreenStackItem).toHaveBeenCalledTimes(1);
        expect(consoleWarnMock).not.toHaveBeenCalled();
        expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Options Title');
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

      it(`should set styles from Stack.Header.Title over screen options`, () => {
        renderRouter({
          _layout: () => (
            <Stack screenOptions={{ title: 'Title', headerTitleStyle: otherStyles }}>
              <Stack.Header>
                <Stack.Header.Title style={{ ...expectedStyles }}>
                  Composition Title
                </Stack.Header.Title>
              </Stack.Header>
              <Stack.Screen name="index" />
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

    it('should set options.title over Stack.Header.Title declared in root scope', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Header>
              <Stack.Header.Title>Root Title</Stack.Header.Title>
            </Stack.Header>
            <Stack.Screen name="index" options={{ title: 'Options Title' }} />
          </Stack>
        ),
        index: () => {
          return <Text testID="index">index</Text>;
        },
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      expect(consoleWarnMock).not.toHaveBeenCalled();
      expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Options Title');
    });

    it('should set screen Stack.Header.Title over Stack.Header.Title declared in root scope', () => {
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Header>
              <Stack.Header.Title>Root Title</Stack.Header.Title>
            </Stack.Header>
            <Stack.Screen name="index" options={{ title: 'Options Title' }}>
              <Stack.Header>
                <Stack.Header.Title>Screen Title</Stack.Header.Title>
              </Stack.Header>
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

    it('should set screen Stack.Header.Title over screenOptions title', () => {
      renderRouter({
        _layout: () => (
          <Stack screenOptions={{ title: 'ScreenOptions Title' }}>
            <Stack.Screen name="index" options={{ title: 'Options Title' }}>
              <Stack.Header>
                <Stack.Header.Title>Screen Title</Stack.Header.Title>
              </Stack.Header>
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
            largeStyle={{ backgroundColor: '#f00' }}>
            <Stack.Header.Title>Custom Title</Stack.Header.Title>
            <Stack.Header.BackButton withMenu={false}>Custom back</Stack.Header.BackButton>
            <Stack.Header.Right asChild>
              <CustomHeaderRight />
            </Stack.Header.Right>
            <Stack.Header.Left asChild>
              <CustomHeaderLeft />
            </Stack.Header.Left>
            <Stack.SearchBar
              placeholder="Search"
              textColor="red"
              tintColor="orange"
              placement="integrated"
              autoCapitalize="sentences"
            />
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
  expect(SearchBar).toHaveBeenCalledTimes(1);
  expect(ScreenStackHeaderLeftView).toHaveBeenCalledTimes(1);
  expect(ScreenStackHeaderRightView).toHaveBeenCalledTimes(1);
  expect(consoleWarnMock).not.toHaveBeenCalled();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('Custom Title');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.backgroundColor).toBe('#fff');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.largeTitleBackgroundColor).toBe('#f00');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.disableBackButtonMenu).toBe(true);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.backTitle).toBe('Custom back');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.hideShadow).toBe(undefined);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.hideShadow).toBe(undefined);
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

it('should console warn, when custom component is used within <Stack.Header> or <Stack.Screen>', () => {
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
  expect(consoleWarnMock).toHaveBeenCalledTimes(2);
  expect(consoleWarnMock.mock.calls[0][0]).toBe(
    'Warning: Unknown child element passed to Stack.Screen: CustomIndexHeader'
  );
  expect(consoleWarnMock.mock.calls[1][0]).toBe(
    'Warning: Unknown child element passed to Stack.Header: CustomAHeaderContent'
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
              largeStyle={{ backgroundColor: '#f00' }}>
              <Stack.Header.Title>Custom Title</Stack.Header.Title>
              <Stack.Header.BackButton withMenu={false}>Custom back</Stack.Header.BackButton>
              <Stack.Header.Right asChild>
                <CustomHeaderRight />
              </Stack.Header.Right>
              <Stack.Header.Left asChild>
                <CustomHeaderLeft />
              </Stack.Header.Left>
              <Stack.SearchBar
                placeholder="Search"
                textColor="red"
                tintColor="orange"
                placement="integrated"
                autoCapitalize="sentences"
              />
            </Stack.Header>
          </Stack.Screen>
          <Text testID="index">index</Text>;
        </>
      );
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(SearchBar).toHaveBeenCalledTimes(1);
  expect(ScreenStackHeaderLeftView).toHaveBeenCalledTimes(1);
  expect(ScreenStackHeaderRightView).toHaveBeenCalledTimes(1);
  expect(consoleWarnMock).not.toHaveBeenCalled();

  expect(ScreenStackItem.mock.calls[0][0].headerConfig.title).toBe('index');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.backgroundColor).toBe('#000');
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.largeTitleBackgroundColor).toBe('#aaa');

  expect(ScreenStackItem.mock.calls[1][0].headerConfig.title).toBe('Custom Title');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backgroundColor).toBe('#fff');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.largeTitleBackgroundColor).toBe('#f00');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.disableBackButtonMenu).toBe(true);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.backTitle).toBe('Custom back');
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.hideShadow).toBe(undefined);
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
