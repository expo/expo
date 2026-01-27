import type { NativeStackHeaderItem } from '@react-navigation/native-stack/lib/typescript/src';
import { isValidElement } from 'react';
import { Text } from 'react-native';
import { ScreenStackItem as _ScreenStackItem } from 'react-native-screens';

import { renderRouter, screen } from '../../../testing-library';
import Stack from '../../Stack';
import { StackToolbar, appendStackToolbarPropsToOptions } from '../toolbar';

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

it('should convert toolbar items children correctly to options', () => {
  function CustomElement() {
    return <Text>Custom Element</Text>;
  }

  const leftResult = appendStackToolbarPropsToOptions(
    {},
    {
      placement: 'left',
      children: [
        <StackToolbar.Button key="1" separateBackground>
          1LB
        </StackToolbar.Button>,
        <StackToolbar.Button
          key="2"
          selected
          style={{
            fontWeight: 500,
            fontSize: 10,
            color: '#f0f',
          }}>
          <StackToolbar.Label>2LB</StackToolbar.Label>
          <StackToolbar.Icon sf="star" />
          <StackToolbar.Badge>33</StackToolbar.Badge>
        </StackToolbar.Button>,
        <StackToolbar.View key="3">
          <CustomElement />
        </StackToolbar.View>,
      ],
    }
  );

  const rightResult = appendStackToolbarPropsToOptions(
    {},
    {
      placement: 'right',
      children: [
        <StackToolbar.Menu
          key="1"
          style={{
            color: '#00f',
            fontFamily: 'Arial',
          }}>
          <StackToolbar.Label>Menu</StackToolbar.Label>
          <StackToolbar.Icon sf="ellipsis.circle" />
          <StackToolbar.Badge
            style={{
              backgroundColor: '#eee',
              fontFamily: 'Courier New',
              fontWeight: 100,
            }}>
            99
          </StackToolbar.Badge>
          <StackToolbar.MenuAction>
            <StackToolbar.Label>Action 1</StackToolbar.Label>
            <StackToolbar.Icon sf="star" />
          </StackToolbar.MenuAction>
          <StackToolbar.Menu inline>
            <StackToolbar.Label>Submenu</StackToolbar.Label>
            <StackToolbar.MenuAction isOn>Sub Action</StackToolbar.MenuAction>
          </StackToolbar.Menu>
          <StackToolbar.Menu palette destructive title="right-palette-menu">
            <StackToolbar.MenuAction isOn icon="0.circle.ar" />
            <StackToolbar.MenuAction icon="1.brakesignal" />
          </StackToolbar.Menu>
        </StackToolbar.Menu>,
        <StackToolbar.Menu key="2" title="right-menu">
          <StackToolbar.Label>Second</StackToolbar.Label>
        </StackToolbar.Menu>,
        <StackToolbar.Button key="3" style={{ color: 'green' }}>
          Right
        </StackToolbar.Button>,
      ],
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
        multiselectable: true,
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
            multiselectable: true,
            inline: true,
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
            multiselectable: true,
            layout: 'palette',
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
        multiselectable: true,
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

  expect(typeof leftResult.unstable_headerLeftItems).toBe('function');
  const leftHeaderItems = leftResult.unstable_headerLeftItems({});
  expect(leftHeaderItems).toStrictEqual(expectedLeftItems);
  expect(leftHeaderItems[2].type).toBe('custom');
  // To satisfy TypeScript
  if (leftHeaderItems[2].type !== 'custom') throw new Error('Type is not custom');
  expect(isValidElement(leftHeaderItems[2].element)).toBe(true);
  // To satisfy TypeScript
  if (!isValidElement(leftHeaderItems[2].element)) throw new Error('Element is not valid');
  expect(leftHeaderItems[2].element.type).toBe(CustomElement);

  expect(typeof rightResult.unstable_headerRightItems).toBe('function');
  expect(rightResult.unstable_headerRightItems({})).toStrictEqual(expectedRightItems);
});

it('omits hidden Stack.Toolbar.Menu from header items', () => {
  const result = appendStackToolbarPropsToOptions(
    {},
    {
      placement: 'right',
      children: [
        <StackToolbar.Menu key="1" hidden title="Hidden Menu">
          <StackToolbar.MenuAction>Should be hidden</StackToolbar.MenuAction>
        </StackToolbar.Menu>,
        <StackToolbar.Menu key="2" title="Visible Menu">
          <StackToolbar.MenuAction>Visible action</StackToolbar.MenuAction>
        </StackToolbar.Menu>,
      ],
    }
  );

  expect(typeof result.unstable_headerRightItems).toBe('function');
  const rightItems = result.unstable_headerRightItems({});
  expect(rightItems).toHaveLength(1);
  expect(rightItems[0].type).toBe('menu');
  if (rightItems[0].type !== 'menu') throw new Error('Type is not menu');
  expect(rightItems[0].menu?.title).toBe('Visible Menu');
});

it('omits hidden Stack.Toolbar.Button from header items', () => {
  const result = appendStackToolbarPropsToOptions(
    {},
    {
      placement: 'right',
      children: [
        <StackToolbar.Button key="1" hidden>
          Should be hidden
        </StackToolbar.Button>,
        <StackToolbar.Button key="2">Visible Button</StackToolbar.Button>,
      ],
    }
  );

  expect(typeof result.unstable_headerRightItems).toBe('function');
  const rightItems = result.unstable_headerRightItems({});
  expect(rightItems).toHaveLength(1);
  expect(rightItems[0].type).toBe('button');
  if (rightItems[0].type !== 'button') throw new Error('Type is not button');
  expect(rightItems[0].label).toBe('Visible Button');
});

it('omits hidden Stack.Toolbar.Spacer from header items', () => {
  const result = appendStackToolbarPropsToOptions(
    {},
    {
      placement: 'right',
      children: [
        <StackToolbar.Spacer key="1" hidden width={8} />,
        <StackToolbar.Spacer key="2" width={20} />,
      ],
    }
  );

  expect(typeof result.unstable_headerRightItems).toBe('function');
  const rightItems = result.unstable_headerRightItems({});
  expect(rightItems).toHaveLength(1);
  expect(rightItems[0].type).toBe('spacing');
  expect((rightItems[0] as any).spacing).toBe(20);
});

it('omits hidden Stack.Toolbar.View from header items', () => {
  const result = appendStackToolbarPropsToOptions(
    {},
    {
      placement: 'right',
      children: [
        <StackToolbar.View key="1" hidden>
          <Text testID="hidden-view">Hidden</Text>
        </StackToolbar.View>,
        <StackToolbar.View key="2">
          <Text testID="visible-view">Visible</Text>
        </StackToolbar.View>,
      ],
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

it('Changes options dynamically when Stack.Toolbar placement="left", placement="right" and Stack.Header are used together', () => {
  function TestScreen() {
    return (
      <>
        <Stack.Header blurEffect="light" />
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button>Left Button</Stack.Toolbar.Button>
        </Stack.Toolbar>
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Menu>
            <Stack.Toolbar.Label>Dynamic Menu</Stack.Toolbar.Label>
            <Stack.Toolbar.MenuAction>Action 1</Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
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
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.blurEffect).toBeUndefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerLeftBarButtonItems).toBeUndefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig.headerRightBarButtonItems).toBeUndefined();

  expect(ScreenStackItem.mock.calls[1][0].headerConfig).toBeDefined();
  expect(ScreenStackItem.mock.calls[1][0].headerConfig.blurEffect).toBe('light');
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
        displayAsPalette: false,
        items: [
          {
            onPress: expect.any(Function),
            state: 'off',
            subtitle: undefined,
            title: 'Action 1',
            type: 'action',
          },
        ],
        multiselectable: true,
        singleSelection: false,
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

it('Changes options dynamically when Stack.Toolbar placement="left" is used in screen component', () => {
  function TestScreen() {
    return (
      <>
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button>Left Button</Stack.Toolbar.Button>
        </Stack.Toolbar>
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

it('Changes options dynamically when Stack.Toolbar placement="right" is used in screen component', () => {
  function TestScreen() {
    return (
      <>
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Menu>
            <Stack.Toolbar.Label>Dynamic Menu</Stack.Toolbar.Label>
            <Stack.Toolbar.MenuAction>Action 1</Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
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
        displayAsPalette: false,
        items: [
          {
            onPress: expect.any(Function),
            state: 'off',
            subtitle: undefined,
            title: 'Action 1',
            type: 'action',
          },
        ],
        multiselectable: true,
        singleSelection: false,
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

it('Changes options dynamically when Stack.Toolbar placement="left" and placement="right" are used together', () => {
  function TestScreen() {
    return (
      <>
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button>Left Button</Stack.Toolbar.Button>
        </Stack.Toolbar>
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Menu>
            <Stack.Toolbar.Label>Dynamic Menu</Stack.Toolbar.Label>
            <Stack.Toolbar.MenuAction>Action 1</Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
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
        displayAsPalette: false,
        items: [
          {
            onPress: expect.any(Function),
            state: 'off',
            title: 'Action 1',
            subtitle: undefined,
            type: 'action',
          },
        ],
        multiselectable: true,
        singleSelection: false,
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
