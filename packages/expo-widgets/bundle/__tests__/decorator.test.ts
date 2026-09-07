import '../index';
import { jsx, jsxs } from '../jsx-runtime-stub';
import { Children } from '../react-stub';

jest.mock('@expo/ui/swift-ui', () => ({}));
jest.mock('@expo/ui/swift-ui/modifiers', () => ({}));

describe('jsx-runtime-stub', () => {
  afterEach(() => {
    delete globalThis.__expoWidgetLayout;
  });

  it('adds button targets during render', () => {
    globalThis.__expoWidgetLayout = () =>
      jsxs('View', {
        children: [
          jsx('Button', {
            label: 'First',
            onButtonPress: () => ({ id: 'first' }),
          }),
          jsx('Button', {
            label: 'Second',
            onButtonPress: () => ({ id: 'second' }),
          }),
        ],
      });

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;

    expect(tree.props.children[0].props.target).toBe('__expo_widgets_target_0');
    expect(tree.props.children[1].props.target).toBe('__expo_widgets_target_1');
  });

  it('adds targets to material button variants during render', () => {
    globalThis.__expoWidgetLayout = () =>
      jsxs('View', {
        children: [
          jsx('FilledTonalButton', {
            label: 'First',
            onButtonPress: () => ({ id: 'first' }),
          }),
          jsx('OutlinedButton', {
            label: 'Second',
            onButtonPress: () => ({ id: 'second' }),
          }),
          jsx('ElevatedButton', {
            label: 'Third',
            onButtonPress: () => ({ id: 'third' }),
          }),
          jsx('TextButton', {
            label: 'Fourth',
            onButtonPress: () => ({ id: 'fourth' }),
          }),
        ],
      });

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;

    expect(tree.props.children[0].props.target).toBe('__expo_widgets_target_0');
    expect(tree.props.children[1].props.target).toBe('__expo_widgets_target_1');
    expect(tree.props.children[2].props.target).toBe('__expo_widgets_target_2');
    expect(tree.props.children[3].props.target).toBe('__expo_widgets_target_3');
  });

  it('uses the nearest keyed parent when generating button targets', () => {
    globalThis.__expoWidgetLayout = () =>
      jsx(
        'Row',
        {
          children: jsx('Wrapper', {
            children: jsx('Button', {
              label: 'Press',
              onButtonPress: () => ({ id: 'nested' }),
            }),
          }),
        },
        'row-1'
      );

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;

    expect(tree.props.children.props.children.props.target).toBe('__expo_widgets_target_0_row-1');
  });

  it('does not use private function-component identity when generating button targets', () => {
    function KeyedRow(props: { children: unknown }) {
      return jsx('Row', props);
    }

    globalThis.__expoWidgetLayout = () =>
      jsx(
        KeyedRow,
        {
          children: jsx('Button', {
            label: 'Press',
            onButtonPress: () => ({ id: 'nested' }),
          }),
        },
        'row-1'
      );

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;

    expect(tree.__expoWidgetIdentity).toContain('row-1');
    expect(tree.props.children.props.target).toBe('__expo_widgets_target_0');
  });

  it('preserves explicit button targets', () => {
    globalThis.__expoWidgetLayout = () =>
      jsx('Button', {
        label: 'Custom',
        target: 'custom-target',
        onButtonPress: () => ({ id: 'custom' }),
      });

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;

    expect(tree.props.target).toBe('custom-target');
  });

  it('preserves public keys for button targets after Children.toArray', () => {
    const onPress = jest.fn(() => ({ id: 'pressed' }));
    globalThis.__expoWidgetLayout = () =>
      jsx('View', {
        children: Children.toArray([
          [jsx('Row', { children: jsx('Button', { onButtonPress: onPress }) }, 'row-1')],
        ]),
      });

    const tree = globalThis.__expoWidgetRender({}, {}) as any;
    const target = tree.props.children[0].props.children.props.target;

    expect(target).toBe('__expo_widgets_target_0_row-1');
    expect(globalThis.__expoWidgetHandlePress({}, { target })).toEqual({
      id: 'pressed',
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reuses generated button targets when handling presses', () => {
    const firstPress = jest.fn(() => ({ id: 'first' }));
    const secondPress = jest.fn(() => ({ id: 'second' }));

    globalThis.__expoWidgetLayout = () =>
      jsxs('View', {
        children: [
          jsx(
            'Row',
            {
              children: jsx('Button', {
                label: 'First',
                onButtonPress: firstPress,
              }),
            },
            'row-1'
          ),
          jsx(
            'Row',
            {
              children: jsx('Button', {
                label: 'Second',
                onButtonPress: secondPress,
              }),
            },
            'row-2'
          ),
        ],
      });

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;
    const secondTarget = tree.props.children[1].props.children.props.target;

    const result = globalThis.__expoWidgetHandlePress({}, { timestamp: 1, target: secondTarget });

    expect(result).toEqual({ id: 'second' });
    expect(firstPress).not.toHaveBeenCalled();
    expect(secondPress).toHaveBeenCalledTimes(1);
  });
});
