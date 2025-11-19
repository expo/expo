import type { NativeStackHeaderItem } from '@react-navigation/native-stack/lib/typescript/src';
import { isValidElement } from 'react';
import { Text } from 'react-native';

import { StackHeader, appendScreenStackPropsToOptions } from '../';

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
            <StackHeader.Item>
              <CustomHeaderElement />
            </StackHeader.Item>
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
              <StackHeader.Menu>
                <StackHeader.Label>Submenu</StackHeader.Label>
                <StackHeader.MenuAction isOn>Sub Action</StackHeader.MenuAction>
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
      hidesSharedBackground: false,
      selected: false,
    },
    {
      type: 'button',
      label: '2LB',
      sharesBackground: true,
      hidesSharedBackground: false,
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
    },
  ];

  const expectedRightItems: NativeStackHeaderItem[] = [
    {
      type: 'menu',
      label: 'Menu',
      hidesSharedBackground: false,
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
            items: [
              {
                type: 'action',
                label: 'Sub Action',
                state: 'on',
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
      hidesSharedBackground: false,
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
      hidesSharedBackground: false,
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
