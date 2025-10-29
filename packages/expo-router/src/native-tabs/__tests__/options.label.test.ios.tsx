import { screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';
import { NativeTabsView as _NativeTabsView } from '../NativeTabsView';
import type { NativeTabOptions, NativeTabsLabelStyle } from '../types';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    BottomTabs: jest.fn(({ children }) => <View testID="BottomTabs">{children}</View>),
    BottomTabsScreen: jest.fn(({ children }) => <View testID="BottomTabsScreen">{children}</View>),
  };
});

jest.mock('../NativeTabsView', () => {
  const actual = jest.requireActual('../NativeTabsView') as typeof import('../NativeTabsView');
  return {
    ...actual,
    NativeTabsView: jest.fn((props) => <actual.NativeTabsView {...props} />),
  };
});

const NativeTabsView = _NativeTabsView as jest.MockedFunction<typeof _NativeTabsView>;

describe('Label', () => {
  it('passes title via Label element', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Custom Title</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe('Custom Title');
  });

  it('uses last Label value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>First Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Label>Second Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Label>Last Title</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
      title: 'Last Title',
    } as NativeTabOptions);
  });

  it('when Label is not used, the title is undefined in options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="one" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      one: () => <View testID="one" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('one')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe(undefined);
    expect(NativeTabsView.mock.calls[0][0].tabs[1].options.title).toBe(undefined);
  });

  it('when empty Label is used, the title is undefined in options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe(undefined); // Route name is added in the rendering component. Options has undefined title
  });

  it('when Label with hidden is used, passes empty string to title', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label hidden />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe(''); // Empty string when Label is hidden
  });

  it.each([
    {},
    { fontSize: 24 },
    { fontFamily: 'Arial' },
    { fontWeight: '400' },
    { color: 'red' },
    { fontStyle: 'italic' },
    { fontSize: 20, color: 'blue' },
    { fontSize: 18, fontFamily: 'Courier', fontWeight: '700', color: 'green', fontStyle: 'normal' },
  ] as NativeTabsLabelStyle[])(
    'when selectedLabelStyle %p is provided, it is passed to screen',
    (style) => {
      renderRouter({
        _layout: () => (
          <NativeTabs labelStyle={{ selected: { ...style } }}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(1);
      expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
        selectedLabelStyle: style,
      } as NativeTabOptions);
    }
  );

  it.each([
    // Same styles in NativeTabs and Trigger
    { container: { fontSize: 10 }, trigger: { fontSize: 20 } },
    { container: { color: 'red' }, trigger: { color: 'blue' } },
    { container: { fontWeight: '400' }, trigger: { fontWeight: '700' } },
    { container: { fontFamily: 'Arial' }, trigger: { fontFamily: 'Courier' } },
    { container: { fontStyle: 'normal' }, trigger: { fontStyle: 'italic' } },
    // More style in container. All should be overridden by Trigger
    { container: { fontSize: 15, color: 'green' }, trigger: { fontSize: 25 } },
    {
      container: { fontWeight: '300', fontFamily: 'Helvetica' },
      trigger: { fontFamily: 'Times New Roman' },
    },
    { container: { fontWeight: '300', fontFamily: 'Helvetica' }, trigger: { color: 'blue' } },
    // More style in Trigger. All should be applied
    { container: { fontSize: 12 }, trigger: { fontSize: 22, color: 'purple' } },
    {
      container: { color: 'orange' },
      trigger: { fontWeight: '600', fontFamily: 'Verdana', fontStyle: 'italic' },
    },
  ] as const)(
    'when selectedLabelStyle is provided in NativeTabs ($container) and Trigger ($trigger), the tab should use the Trigger style',
    ({ trigger, container }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs labelStyle={{ selected: { ...container } }}>
            <NativeTabs.Trigger name="index">
              <NativeTabs.Trigger.Label selectedStyle={trigger} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="one" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        one: () => <View testID="one" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(1);
      const call = NativeTabsView.mock.calls[0][0];
      // Index tab uses Trigger style
      expect(call.tabs[0].options).toMatchObject({
        selectedLabelStyle: trigger,
      } as NativeTabOptions);
      // One tab uses container style, as it has no Label
      expect(call.tabs[1].options).toMatchObject({
        selectedLabelStyle: container,
      } as NativeTabOptions);
    }
  );

  describe.each([
    {},
    { fontSize: 24 },
    { fontFamily: 'Arial' },
    { fontWeight: '400' },
    { color: 'red' },
    { fontStyle: 'italic' },
    { fontSize: 20, color: 'blue' },
    { fontSize: 18, fontFamily: 'Courier', fontWeight: '700', color: 'green', fontStyle: 'normal' },
  ] as NativeTabsLabelStyle[])(
    'when labelStyle %p is set on NativeTabs, it is passed to screen',
    (style) => {
      it('when passed as default property of object', () => {
        renderRouter({
          _layout: () => (
            <NativeTabs labelStyle={{ default: { ...style } }}>
              <NativeTabs.Trigger name="index" />
            </NativeTabs>
          ),
          index: () => <View testID="index" />,
        });
        expect(screen.getByTestId('index')).toBeVisible();
        expect(NativeTabsView).toHaveBeenCalledTimes(1);
        expect(NativeTabsView.mock.calls[0][0].tabs[0].options.labelStyle).toMatchObject(style);
      });

      it('when passed directly to labelStyle prop', () => {
        renderRouter({
          _layout: () => (
            <NativeTabs labelStyle={{ ...style }}>
              <NativeTabs.Trigger name="index" />
            </NativeTabs>
          ),
          index: () => <View testID="index" />,
        });
        expect(screen.getByTestId('index')).toBeVisible();
        expect(NativeTabsView).toHaveBeenCalledTimes(1);
        expect(NativeTabsView.mock.calls[0][0].tabs[0].options.labelStyle).toMatchObject(style);
      });
    }
  );
});
