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

  it('adds targets to material button variants during render', () => {
    globalThis.__expoWidgetLayout = () =>
      jsxs('View', {
        children: [
          jsx('FilledTonalButton', { label: 'First', onButtonPress: () => ({ id: 'first' }) }),
          jsx('OutlinedButton', { label: 'Second', onButtonPress: () => ({ id: 'second' }) }),
          jsx('ElevatedButton', { label: 'Third', onButtonPress: () => ({ id: 'third' }) }),
          jsx('TextButton', { label: 'Fourth', onButtonPress: () => ({ id: 'fourth' }) }),
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

  it('adds targets to clickable modifiers without mutating the modifier', () => {
    const shared = { $type: 'clickable', indication: true, eventListener: () => ({ id: 'row' }) };
    globalThis.__expoWidgetLayout = () =>
      jsxs('Column', {
        children: [
          jsx('Button', { label: 'First', onButtonPressed: () => ({ id: 'button' }) }),
          jsx('Row', { modifiers: [{ $type: 'paddingAll', all: 8 }, shared] }),
          jsx('Row', { modifiers: [shared] }),
        ],
      });

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;

    expect(tree.props.children[1].props.modifiers[0]).toEqual({ $type: 'paddingAll', all: 8 });
    expect(tree.props.children[1].props.modifiers[1].target).toBe('__expo_widgets_target_1');
    expect(tree.props.children[2].props.modifiers[0].target).toBe('__expo_widgets_target_2');
    expect(shared).not.toHaveProperty('target');
  });

  it('calls the clickable modifier handler when handling presses', () => {
    const rowPress = jest.fn(() => ({ id: 'row' }));
    const textPress = jest.fn(() => ({ id: 'text' }));
    globalThis.__expoWidgetLayout = () =>
      jsx('Row', {
        modifiers: [{ $type: 'clickable', eventListener: rowPress }],
        children: jsx('Text', { modifiers: [{ $type: 'clickable', eventListener: textPress }] }),
      });

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;
    const target = tree.props.children.props.modifiers[0].target;

    const result = globalThis.__expoWidgetHandlePress({}, { timestamp: 1, target });

    expect(result).toEqual({ id: 'text' });
    expect(rowPress).not.toHaveBeenCalled();
    expect(textPress).toHaveBeenCalledTimes(1);
  });
});
