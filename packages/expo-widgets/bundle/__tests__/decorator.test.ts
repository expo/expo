import '../index';
import { jsx, jsxs } from '../jsx-runtime-stub';

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
          jsx('Button', { label: 'First', onButtonPress: () => ({ id: 'first' }) }),
          jsx('Button', { label: 'Second', onButtonPress: () => ({ id: 'second' }) }),
        ],
      });

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;

    expect(tree.props.children[0].props.target).toBe('__expo_widgets_target_0');
    expect(tree.props.children[1].props.target).toBe('__expo_widgets_target_1');
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

  it('reuses generated button targets when handling presses', () => {
    const firstPress = jest.fn(() => ({ id: 'first' }));
    const secondPress = jest.fn(() => ({ id: 'second' }));

    globalThis.__expoWidgetLayout = () =>
      jsxs('View', {
        children: [
          jsx(
            'Row',
            { children: jsx('Button', { label: 'First', onButtonPress: firstPress }) },
            'row-1'
          ),
          jsx(
            'Row',
            { children: jsx('Button', { label: 'Second', onButtonPress: secondPress }) },
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
