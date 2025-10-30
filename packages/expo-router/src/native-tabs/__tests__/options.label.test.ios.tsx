import { screen, act, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Button, View } from 'react-native';

import { HrefPreview } from '../../link/preview/HrefPreview';
import { renderRouter, within } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';
import { NativeTabsView as _NativeTabsView } from '../NativeTabsView';
import { Label, type LabelProps } from '../common/elements';
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
            <Label>Custom Title</Label>
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
            <Label>First Title</Label>
            <Label>Second Title</Label>
            <Label>Last Title</Label>
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
            <Label />
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
            <Label hidden />
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
              <Label selectedStyle={trigger} />
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

describe('Dynamic options', () => {
  it('can update title via unstable_options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_options={{ title: 'Initial Title' }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index" unstable_options={{ title: 'Updated Title' }} />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    const second = NativeTabsView.mock.calls[1][0];
    expect(first.tabs[0].options.title).toBe('Initial Title');
    expect(second.tabs[0].options.title).toBe('Updated Title');
  });

  it('can use dynamic <Label> to update title', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_options={{ title: 'Initial Title' }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <Label>Updated Title</Label>
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    expect(first.tabs[0].options.title).toBe('Initial Title');
    const second = NativeTabsView.mock.calls[1][0];
    expect(second.tabs[0].options.title).toBe('Updated Title');
  });

  it('can override <Label> from _layout with unstable_options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label>Initial Title</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger
            name="index"
            unstable_options={{
              title: 'Updated Title',
            }}
          />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    expect(first.tabs[0].options.title).toBe('Initial Title');
    const second = NativeTabsView.mock.calls[1][0];
    expect(second.tabs[0].options.title).toBe('Updated Title');
  });

  it('can override <Label> from _layout with dynamic <Label>', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label>Initial Title</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <Label>Updated Title</Label>
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    expect(first.tabs[0].options.title).toBe('Initial Title');
    const second = NativeTabsView.mock.calls[1][0];
    expect(second.tabs[0].options.title).toBe('Updated Title');
  });

  it('can dynamically update options with state update', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label>Initial Title</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: function Index() {
        const [value, setValue] = React.useState(0);
        const label = `Updated Title ${value}`;
        return (
          <View testID="index">
            <NativeTabs.Trigger name="index">
              <Label>{label}</Label>
            </NativeTabs.Trigger>
            <Button title="Update" testID="update-button" onPress={() => setValue((v) => v + 1)} />
          </View>
        );
      },
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe('Initial Title');
    expect(NativeTabsView.mock.calls[1][0].tabs[0].options.title).toBe('Updated Title 0');
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(NativeTabsView).toHaveBeenCalledTimes(3);
    expect(NativeTabsView.mock.calls[2][0].tabs[0].options.title).toBe('Updated Title 1');
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(NativeTabsView).toHaveBeenCalledTimes(4);
    expect(NativeTabsView.mock.calls[3][0].tabs[0].options.title).toBe('Updated Title 2');
  });

  it('can be used in preview', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_options={{ title: 'Initial Title' }} />
          <NativeTabs.Trigger name="second" unstable_options={{ title: 'Second' }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <HrefPreview href="/second" />
        </View>
      ),
      second: () => (
        <View testID="second">
          <NativeTabs.Trigger name="second">
            <Label>Updated Title</Label>
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    // Tab + preview
    expect(screen.getAllByTestId('second')).toHaveLength(2);
    expect(within(screen.getByTestId('index')).getByTestId('second')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    const call = NativeTabsView.mock.calls[0][0];
    expect(call.tabs[0].options.title).toBe('Initial Title');
    expect(call.tabs[1].options.title).toBe('Second');
  });

  it.each([
    {
      layout: { children: 'test', selectedStyle: { fontSize: 10 } } as LabelProps,
      dynamic: { selectedStyle: { fontSize: 20 } } as LabelProps,
      expected: { title: 'test', selectedLabelStyle: { fontSize: 20 } } as NativeTabOptions,
    },
    {
      layout: { hidden: true, selectedStyle: { fontSize: 10 } } as LabelProps,
      dynamic: { children: 'Updated Title' } as LabelProps,
      expected: {
        title: 'Updated Title',
        selectedLabelStyle: { fontSize: 10 },
      } as NativeTabOptions,
    },
    {
      layout: { children: 'test' } as LabelProps,
      dynamic: { hidden: true } as LabelProps,
      expected: { title: '', selectedLabelStyle: undefined } as NativeTabOptions,
    },
    {
      layout: { children: 'test', selectedStyle: { fontSize: 10 } } as LabelProps,
      dynamic: { children: undefined } as LabelProps,
      expected: {
        title: undefined,
        selectedLabelStyle: { fontSize: 10 },
      } as NativeTabOptions,
    },
  ])(
    'dynamic <Label> $dynamic overrides only specified configuration from <Label> in _layout $layout',
    ({ layout, dynamic, expected }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <Label {...layout} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="second">
              <Label>Second</Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => (
          <View testID="index">
            <NativeTabs.Trigger>
              <Label {...dynamic} />
            </NativeTabs.Trigger>
          </View>
        ),
        second: () => <View testID="second" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(2);
      const second = NativeTabsView.mock.calls[1][0];
      expect(second.tabs[0].options).toMatchObject(expected);
      expect(second.tabs[1].options).toMatchObject({
        title: 'Second',
        selectedLabelStyle: undefined,
      });
    }
  );

  it.each([
    {
      layout: { fontSize: 10 } as NativeTabsLabelStyle,
      dynamic: {} as NativeTabsLabelStyle,
      expected: { selectedLabelStyle: {} } as NativeTabOptions,
    },
    {
      layout: { fontSize: 10 } as NativeTabsLabelStyle,
      dynamic: { fontSize: 20 } as NativeTabsLabelStyle,
      expected: { selectedLabelStyle: { fontSize: 20 } } as NativeTabOptions,
    },
    {
      layout: { fontSize: 10 } as NativeTabsLabelStyle,
      dynamic: { fontFamily: 'Arial' } as NativeTabsLabelStyle,
      expected: { selectedLabelStyle: { fontFamily: 'Arial' } } as NativeTabOptions,
    },
  ])(
    'dynamic <Label selectedStyle=$dynamic> overrides selectedLabelStyle configuration from <NativeTabs> in _layout $layout',
    ({ layout, dynamic, expected }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs labelStyle={{ selected: layout }}>
            <NativeTabs.Trigger name="index" />
            <NativeTabs.Trigger name="second">
              <Label>Second</Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => (
          <View testID="index">
            <NativeTabs.Trigger>
              <Label selectedStyle={dynamic} />
            </NativeTabs.Trigger>
          </View>
        ),
        second: () => <View testID="second" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(2);
      const second = NativeTabsView.mock.calls[1][0];
      expect(second.tabs[0].options).toMatchObject(expected);
      expect(second.tabs[1].options).toMatchObject({
        title: 'Second',
        selectedLabelStyle: layout,
      });
    }
  );

  it.each([
    {
      layout: { fontSize: 10 } as NativeTabsLabelStyle,
      dynamic: {} as LabelProps,
      expected: { title: undefined, selectedLabelStyle: { fontSize: 10 } } as NativeTabOptions,
    },
    {
      layout: { fontSize: 10 } as NativeTabsLabelStyle,
      dynamic: { children: 'Updated Title' } as LabelProps,
      expected: {
        title: 'Updated Title',
        selectedLabelStyle: { fontSize: 10 },
      } as NativeTabOptions,
    },
  ])(
    'dynamic <Label> $dynamic does not override selectedLabelStyle configuration from <NativeTabs> in _layout $layout',
    ({ layout, dynamic, expected }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs labelStyle={{ selected: layout }}>
            <NativeTabs.Trigger name="index" />
            <NativeTabs.Trigger name="second">
              <Label>Second</Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => (
          <View testID="index">
            <NativeTabs.Trigger>
              <Label {...dynamic} />
            </NativeTabs.Trigger>
          </View>
        ),
        second: () => <View testID="second" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(2);
      const second = NativeTabsView.mock.calls[1][0];
      expect(second.tabs[0].options.title).toBe(expected.title);
      expect(second.tabs[0].options.selectedLabelStyle).toMatchObject(expected.selectedLabelStyle);
      expect(second.tabs[1].options).toMatchObject({
        title: 'Second',
        selectedLabelStyle: layout,
      });
    }
  );
});
