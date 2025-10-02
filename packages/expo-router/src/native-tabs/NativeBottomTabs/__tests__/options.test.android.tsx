import { screen } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';
import { BottomTabsScreen as _BottomTabsScreen } from 'react-native-screens';

import { renderRouter } from '../../../testing-library';
import { Icon, VectorIcon, type IconProps } from '../../common/elements';
import { appendIconOptions } from '../NativeTabTrigger';
import { NativeTabs } from '../NativeTabs';
import type { NativeTabOptions } from '../types';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    BottomTabs: jest.fn(({ children }) => <View testID="BottomTabs">{children}</View>),
    BottomTabsScreen: jest.fn(({ children }) => <View testID="BottomTabsScreen">{children}</View>),
  };
});

const BottomTabsScreen = _BottomTabsScreen as jest.MockedFunction<typeof _BottomTabsScreen>;

describe('Icons', () => {
  it('passes iconResourceName when using Icon.Drawable on Android', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon drawable="stairs" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      iconResourceName: 'stairs',
    } as NativeTabOptions);
  });

  it('uses last Icon.Drawable value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon drawable="first" />
            <Icon drawable="second" />
            <Icon drawable="last" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      iconResourceName: 'last',
    } as NativeTabOptions);
  });

  it('does not pass iconResourceName when Icon.Drawable is not used', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0].iconResourceName).toBeUndefined();
  });

  // Currently not needed. Screens does not forbid this, as Icon does not work on Android yet.
  //   it('throws an error when mixing Icon.Drawable and Icon', () => {
  //     expect(() =>
  //       renderRouter({
  //         _layout: () => (
  //           <NativeTabs>
  //             <NativeTabs.Trigger name="index">
  //               <Icon src={require('../../../../assets/file.png')} />
  //               <Icon.Drawable name="stairs" />
  //             </NativeTabs.Trigger>
  //           </NativeTabs>
  //         ),
  //         index: () => <View testID="index" />,
  //       })
  //     ).toThrow('You can only use one type of icon (Icon or Icon.Drawable) for a single tab');
  //   });

  it('does not set icon or selectedIcon when using sf with string on Android', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf="star" drawable="stairs" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0].icon).toBeUndefined();
    expect(BottomTabsScreen.mock.calls[0][0].selectedIcon).toBeUndefined();
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      iconResourceName: 'stairs',
    } as NativeTabOptions);
  });

  it('does not set icon or selectedIcon when using sf with object on Android', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ default: 'star', selected: 'star.fill' }} drawable="stairs" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0].icon).toBeUndefined();
    expect(BottomTabsScreen.mock.calls[0][0].selectedIcon).toBeUndefined();
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      iconResourceName: 'stairs',
    } as NativeTabOptions);
  });
});

describe(appendIconOptions, () => {
  const ICON_FAMILY = {
    getImageSource: (name: 'a' | 'b' | 'c') => Promise.resolve({ uri: name }),
  };
  it.each([
    [{}, {}],
    [{ sf: '0.circle' }, { icon: undefined, selectedIcon: undefined }],
    [
      { src: { uri: 'xxx', scale: 2 } },
      { icon: { src: { uri: 'xxx', scale: 2 } }, selectedIcon: undefined },
    ],
    [
      { src: { default: 'xxx', selected: 'yyy' } },
      { icon: { src: 'xxx' }, selectedIcon: { src: 'yyy' } },
    ],
    [
      {
        sf: '0.circle',
        androidSrc: { uri: 'xxx' },
      },
      { icon: { src: { uri: 'xxx' } }, selectedIcon: undefined },
    ],
    [
      { androidSrc: { selected: 'yyy', default: 'xxx' } },
      { icon: { src: 'xxx' }, selectedIcon: { src: 'yyy' } },
    ],
  ] as [IconProps, NativeTabOptions][])(
    'should append icon props %p to options correctly',
    (props, expected) => {
      const options: NativeTabOptions = {};
      appendIconOptions(options, props);
      expect(options).toEqual(expected);
    }
  );
  it('when vector icon is used, promise is set', () => {
    const options: NativeTabOptions = {};
    const props: IconProps = {
      src: {
        default: <VectorIcon family={ICON_FAMILY} name="a" />,
        selected: { uri: 'yyy' },
      },
    };
    appendIconOptions(options, props);
    expect(options).toEqual({
      icon: { src: expect.any(Promise) },
      selectedIcon: {
        src: { uri: 'yyy' },
      },
    });
  });
});
