import '../index';
import { jsx, jsxs } from '../jsx-runtime-stub';

jest.mock('@expo/ui/swift-ui', () => ({}));
jest.mock('@expo/ui/swift-ui/modifiers', () => ({}));

describe('jsx-runtime-stub children flattening', () => {
  afterEach(() => {
    delete globalThis.__expoWidgetLayout;
  });

  it('flattens a .map() array mixed with sibling elements into a flat children list', () => {
    const items = ['Hello', 'World'];
    const tree = jsxs('HStackView', {
      children: [
        items.map((item) => jsx('TextView', { text: item }, item)),
        jsx('SpacerView', {}),
      ],
    });

    expect(tree.props.children).toHaveLength(3);
    expect(tree.props.children.map((child: any) => child.type)).toEqual([
      'TextView',
      'TextView',
      'SpacerView',
    ]);
    expect(tree.props.children[0].props.text).toBe('Hello');
    expect(tree.props.children[1].props.text).toBe('World');
  });

  it('flattens deeply nested children arrays while preserving order', () => {
    const tree = jsxs('VStackView', {
      children: [
        jsx('TextView', { text: 'first' }),
        [
          jsx('TextView', { text: 'second' }),
          [jsx('TextView', { text: 'third' }), jsx('TextView', { text: 'fourth' })],
        ],
        jsx('SpacerView', {}),
      ],
    });

    expect(tree.props.children.map((child: any) => child.props.text ?? null)).toEqual([
      'first',
      'second',
      'third',
      'fourth',
      null,
    ]);
  });

  it('leaves a single non-array child untouched', () => {
    const tree = jsx('HStackView', {
      children: jsx('TextView', { text: 'only' }),
    });

    expect(Array.isArray(tree.props.children)).toBe(false);
    expect(tree.props.children.props.text).toBe('only');
  });

  it('preserves text and conditional children in mixed arrays', () => {
    const tree = jsxs('TextView', {
      children: ['count: ', 5, false],
    });

    expect(tree.props.children).toEqual(['count: ', 5, false]);
  });

  it('finds and presses a button rendered inside a .map() mixed with siblings', () => {
    const onPress = jest.fn(() => ({ id: 'pressed' }));

    globalThis.__expoWidgetLayout = () =>
      jsxs('HStackView', {
        children: [
          ['a', 'b'].map((label) =>
            jsx('Button', { label, onButtonPress: label === 'b' ? onPress : () => ({}) }, label)
          ),
          jsx('SpacerView', {}),
        ],
      });

    const tree = globalThis.__expoWidgetRender({}, { timestamp: 1 }) as any;
    const target = tree.props.children[1].props.target;

    const result = globalThis.__expoWidgetHandlePress({}, { timestamp: 1, target });

    expect(result).toEqual({ id: 'pressed' });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
