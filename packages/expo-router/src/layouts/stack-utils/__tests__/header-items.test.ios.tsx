import type { NativeStackHeaderItem } from '@react-navigation/native-stack/lib/typescript/src';
import { isValidElement } from 'react';
import { Text, View } from 'react-native';
import {
  ScreenStackItem as _ScreenStackItem,
  SearchBar as _SearchBar,
  ScreenStackHeaderConfig as _ScreenStackHeaderConfig,
} from 'react-native-screens';

import { StackHeader, appendScreenStackPropsToOptions } from '../';
import { renderRouter, screen } from '../../../testing-library';
import Stack from '../../Stack';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;

it('should convert header items children, correctly to options', () => {
  function CustomHeaderElement() {
    return <Text>Custom Element</Text>;
  }
  const result = appendScreenStackPropsToOptions(
    {},
    {
      children: (
        <StackHeader>
          <StackHeader.Left>
            <StackHeader.Button separateBackground>1LB</StackHeader.Button>
            <StackHeader.Button
              selected
              style={{
                fontWeight: 500,
                fontSize: 10,
                color: '#f0f',
              }}>
              <StackHeader.Label>2LB</StackHeader.Label>
              <StackHeader.Icon sf="star" />
              <StackHeader.Badge>33</StackHeader.Badge>
            </StackHeader.Button>
            <StackHeader.View>
              <CustomHeaderElement />
            </StackHeader.View>
          </StackHeader.Left>
          <StackHeader.Right>
            <StackHeader.Menu
              style={{
                color: '#00f',
                fontFamily: 'Arial',
              }}>
              <StackHeader.Label>Menu</StackHeader.Label>
              <StackHeader.Icon sf="ellipsis.circle" />
              <StackHeader.Badge
                style={{
                  backgroundColor: '#eee',
                  fontFamily: 'Courier New',
                  fontWeight: 100,
                }}>
                99
              </StackHeader.Badge>
              <StackHeader.MenuAction>
                <StackHeader.Label>Action 1</StackHeader.Label>
                <StackHeader.Icon sf="star" />
              </StackHeader.MenuAction>
              <StackHeader.Menu inline>
                <StackHeader.Label>Submenu</StackHeader.Label>
                <StackHeader.MenuAction isOn>Sub Action</StackHeader.MenuAction>
              </StackHeader.Menu>
              <StackHeader.Menu palette destructive title="right-palette-menu">
                <StackHeader.MenuAction isOn icon="0.circle.ar" />
                <StackHeader.MenuAction icon="1.brakesignal" />
              </StackHeader.Menu>
            </StackHeader.Menu>
            <StackHeader.Menu title="right-menu">
              <StackHeader.Label>Second</StackHeader.Label>
            </StackHeader.Menu>
            <StackHeader.Button style={{ color: 'green' }}>Right</StackHeader.Button>
          </StackHeader.Right>
        </StackHeader>
      ),
    }
  );

  const expectedLeftItems: NativeStackHeaderItem[] = [
    {
      type: 'button',
      label: '1LB',
      onPress: expect.any(Function),
      sharesBackground: false,
      selected: false,
    },
    {
      type: 'button',
      label: '2LB',
      sharesBackground: true,
      icon: {
        type: 'sfSymbol',
        name: 'star',
      },
      onPress: expect.any(Function),
      labelStyle: {
        fontSize: 10,
        color: '#f0f',
        fontWeight: '500',
      },
      selected: true,
      badge: {
        value: '33',
      },
    },
    {
      type: 'custom',
      element: expect.any(Object),
      hidesSharedBackground: undefined,
    },
  ];

  const expectedRightItems: NativeStackHeaderItem[] = [
    {
      type: 'menu',
      label: 'Menu',
      sharesBackground: true,
      labelStyle: {
        color: '#00f',
        fontFamily: 'Arial',
      },
      icon: {
        type: 'sfSymbol',
        name: 'ellipsis.circle',
      },
      badge: {
        value: '99',
        style: {
          backgroundColor: '#eee',
          fontFamily: 'Courier New',
          fontWeight: '100',
        },
      },
      menu: {
        items: [
          {
            type: 'action',
            label: 'Action 1',
            icon: {
              type: 'sfSymbol',
              name: 'star',
            },
            state: 'off',
            onPress: expect.any(Function),
          },
          {
            type: 'submenu',
            label: 'Submenu',
            displayInline: true,
            items: [
              {
                type: 'action',
                label: 'Sub Action',
                state: 'on',
                onPress: expect.any(Function),
              },
            ],
          },
          {
            type: 'submenu',
            label: 'right-palette-menu',
            displayAsPalette: true,
            destructive: true,
            items: [
              {
                type: 'action',
                label: '',
                icon: {
                  type: 'sfSymbol',
                  name: '0.circle.ar',
                },
                state: 'on',
                onPress: expect.any(Function),
              },
              {
                type: 'action',
                label: '',
                icon: {
                  type: 'sfSymbol',
                  name: '1.brakesignal',
                },
                state: 'off',
                onPress: expect.any(Function),
              },
            ],
          },
        ],
      },
    },
    {
      type: 'menu',
      label: 'Second',
      sharesBackground: true,
      menu: {
        items: [],
        title: 'right-menu',
      },
    },
    {
      type: 'button',
      label: 'Right',
      onPress: expect.any(Function),
      sharesBackground: true,
      selected: false,
      labelStyle: {
        color: 'green',
      },
    },
  ];

  expect(typeof result.unstable_headerLeftItems).toBe('function');
  const leftHeaderItems = result.unstable_headerLeftItems({});
  expect(leftHeaderItems).toStrictEqual(expectedLeftItems);
  expect(leftHeaderItems[2].type).toBe('custom');
  // To satisfy TypeScript
  if (leftHeaderItems[2].type !== 'custom') throw new Error('Type is not custom');
  expect(isValidElement(leftHeaderItems[2].element)).toBe(true);
  // To satisfy TypeScript
  if (!isValidElement(leftHeaderItems[2].element)) throw new Error('Element is not valid');
  expect(leftHeaderItems[2].element.type).toBe(CustomHeaderElement);

  expect(typeof result.unstable_headerRightItems).toBe('function');
  expect(result.unstable_headerRightItems({})).toStrictEqual(expectedRightItems);
});

it('omits hidden Stack.Header.Menu from header items', () => {
  const result = appendScreenStackPropsToOptions(
    {},
    {
      children: (
        <StackHeader>
          <StackHeader.Right>
            <StackHeader.Menu hidden title="Hidden Menu">
              <StackHeader.MenuAction>Should be hidden</StackHeader.MenuAction>
            </StackHeader.Menu>
            <StackHeader.Menu title="Visible Menu">
              <StackHeader.MenuAction>Visible action</StackHeader.MenuAction>
            </StackHeader.Menu>
          </StackHeader.Right>
        </StackHeader>
      ),
    }
  );

  expect(typeof result.unstable_headerRightItems).toBe('function');
  const rightItems = result.unstable_headerRightItems({});
  expect(rightItems).toHaveLength(1);
  expect(rightItems[0].type).toBe('menu');
  if (rightItems[0].type !== 'menu') throw new Error('Type is not menu');
  expect(rightItems[0].menu?.title).toBe('Visible Menu');
});

it('omits hidden Stack.Header.Button from header items', () => {
  const result = appendScreenStackPropsToOptions(
    {},
    {
      children: (
        <StackHeader>
          <StackHeader.Right>
            <StackHeader.Button hidden>Should be hidden</StackHeader.Button>
            <StackHeader.Button>Visible Button</StackHeader.Button>
          </StackHeader.Right>
        </StackHeader>
      ),
    }
  );

  expect(typeof result.unstable_headerRightItems).toBe('function');
  const rightItems = result.unstable_headerRightItems({});
  expect(rightItems).toHaveLength(1);
  expect(rightItems[0].type).toBe('button');
  if (rightItems[0].type !== 'button') throw new Error('Type is not button');
  expect(rightItems[0].label).toBe('Visible Button');
});

it('omits hidden Stack.Header.Spacer from header items', () => {
  const result = appendScreenStackPropsToOptions(
    {},
    {
      children: (
        <StackHeader>
          <StackHeader.Right>
            <StackHeader.Spacer hidden width={8} />
            <StackHeader.Spacer width={20} />
          </StackHeader.Right>
        </StackHeader>
      ),
    }
  );

  expect(typeof result.unstable_headerRightItems).toBe('function');
  const rightItems = result.unstable_headerRightItems({});
  expect(rightItems).toHaveLength(1);
  expect(rightItems[0].type).toBe('spacing');
  expect((rightItems[0] as any).spacing).toBe(20);
});

it('omits hidden Stack.Header.View from header items', () => {
  const result = appendScreenStackPropsToOptions(
    {},
    {
      children: (
        <StackHeader>
          <StackHeader.Right>
            <StackHeader.View hidden>
              <Text testID="hidden-view">Hidden</Text>
            </StackHeader.View>
            <StackHeader.View>
              <Text testID="visible-view">Visible</Text>
            </StackHeader.View>
          </StackHeader.Right>
        </StackHeader>
      ),
    }
  );

  expect(typeof result.unstable_headerRightItems).toBe('function');
  const rightItems = result.unstable_headerRightItems({});
  expect(rightItems).toHaveLength(1);
  expect(rightItems[0].type).toBe('custom');
  // Ensure the rendered element contains our visible child
  const element = (rightItems[0] as any).element;
  expect(isValidElement(element)).toBe(true);
  expect(element.props.testID).toBe('visible-view');
});

it('Changes options dynamically when Stack.Header is used without wrapper', () => {
  function TestScreen() {
    return (
      <>
        <Stack.Header>
          <Stack.Header.Left>
            <Stack.Header.Button>Left Button</Stack.Header.Button>
          </Stack.Header.Left>
          <Stack.Header.Right>
            <Stack.Header.Menu>
              <Stack.Header.Label>Dynamic Menu</Stack.Header.Label>
              <Stack.Header.MenuAction>Action 1</Stack.Header.MenuAction>
            </Stack.Header.Menu>
          </Stack.Header.Right>
        </Stack.Header>
        <Text testID="content">Content</Text>
      </>
    );
  }

  renderRouter({
    _layout: () => <Stack />,
    index: TestScreen,
  });

  expect(screen.getByTestId('content')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig).toBeDefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems).toBeUndefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems).toBeUndefined();

  expect(ScreenStackItem.mock.calls[1][0].headerConfig).toBeDefined();
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.headerLeftBarButtonItems).toEqual([
    {
      icon: undefined,
      index: 0,
      onPress: expect.any(Function),
      selected: false,
      sharesBackground: true,
      title: 'Left Button',
      titleStyle: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      type: 'button',
    },
  ]);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.headerRightBarButtonItems).toEqual([
    {
      icon: undefined,
      index: 0,
      menu: {
        items: [
          {
            onPress: expect.any(Function),
            state: 'off',
            title: 'Action 1',
            type: 'action',
          },
        ],
      },
      sharesBackground: true,
      title: 'Dynamic Menu',
      titleStyle: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      type: 'menu',
    },
  ]);
});

it('Changes options dynamically when Stack.Header.Left is used without wrapper', () => {
  function TestScreen() {
    return (
      <>
        <Stack.Header.Left>
          <Stack.Header.Button>Left Button</Stack.Header.Button>
        </Stack.Header.Left>
        <Text testID="content">Content</Text>
      </>
    );
  }

  renderRouter({
    _layout: () => <Stack />,
    index: TestScreen,
  });

  expect(screen.getByTestId('content')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig).toBeDefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems).toBeUndefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems).toBeUndefined();

  expect(ScreenStackItem.mock.calls[1][0].headerConfig).toBeDefined();
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.headerLeftBarButtonItems).toEqual([
    {
      icon: undefined,
      index: 0,
      onPress: expect.any(Function),
      selected: false,
      sharesBackground: true,
      title: 'Left Button',
      titleStyle: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      type: 'button',
    },
  ]);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.headerRightBarButtonItems).toBeUndefined();
});

it('Changes options dynamically when Stack.Header.Left and Stack.Header.Right are used without wrapper', () => {
  function TestScreen() {
    return (
      <>
        <Stack.Header.Right>
          <Stack.Header.Menu>
            <Stack.Header.Label>Dynamic Menu</Stack.Header.Label>
            <Stack.Header.MenuAction>Action 1</Stack.Header.MenuAction>
          </Stack.Header.Menu>
        </Stack.Header.Right>
        <Text testID="content">Content</Text>
      </>
    );
  }

  renderRouter({
    _layout: () => <Stack />,
    index: TestScreen,
  });

  expect(screen.getByTestId('content')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig).toBeDefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems).toBeUndefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems).toBeUndefined();

  expect(ScreenStackItem.mock.calls[1][0].headerConfig).toBeDefined();
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.headerLeftBarButtonItems).toBeUndefined();
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.headerRightBarButtonItems).toEqual([
    {
      icon: undefined,
      index: 0,
      menu: {
        items: [
          {
            onPress: expect.any(Function),
            state: 'off',
            title: 'Action 1',
            type: 'action',
          },
        ],
      },
      sharesBackground: true,
      title: 'Dynamic Menu',
      titleStyle: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      type: 'menu',
    },
  ]);
});

it('Changes options dynamically when Stack.Header.Left and Stack.Header.Right are used without wrapper', () => {
  function TestScreen() {
    return (
      <>
        <Stack.Header.Left>
          <Stack.Header.Button>Left Button</Stack.Header.Button>
        </Stack.Header.Left>
        <Stack.Header.Right>
          <Stack.Header.Menu>
            <Stack.Header.Label>Dynamic Menu</Stack.Header.Label>
            <Stack.Header.MenuAction>Action 1</Stack.Header.MenuAction>
          </Stack.Header.Menu>
        </Stack.Header.Right>
        <Text testID="content">Content</Text>
      </>
    );
  }

  renderRouter({
    _layout: () => <Stack />,
    index: TestScreen,
  });

  expect(screen.getByTestId('content')).toBeVisible();
  expect(ScreenStackItem).toHaveBeenCalledTimes(2);
  expect(ScreenStackItem.mock.calls[0][0].headerConfig).toBeDefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems).toBeUndefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems).toBeUndefined();

  expect(ScreenStackItem.mock.calls[1][0].headerConfig).toBeDefined();
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.headerLeftBarButtonItems).toEqual([
    {
      icon: undefined,
      index: 0,
      onPress: expect.any(Function),
      selected: false,
      sharesBackground: true,
      title: 'Left Button',
      titleStyle: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      type: 'button',
    },
  ]);
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.headerRightBarButtonItems).toEqual([
    {
      icon: undefined,
      index: 0,
      menu: {
        items: [
          {
            onPress: expect.any(Function),
            state: 'off',
            title: 'Action 1',
            type: 'action',
          },
        ],
      },
      sharesBackground: true,
      title: 'Dynamic Menu',
      titleStyle: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      type: 'menu',
    },
  ]);
});
