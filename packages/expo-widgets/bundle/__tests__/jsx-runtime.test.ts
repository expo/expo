import '../index';
import { jsx } from '../jsx-runtime-stub';
import { Children } from '../react-stub';

jest.mock('@expo/ui/swift-ui', () => ({}));
jest.mock('@expo/ui/swift-ui/modifiers', () => ({}));

function render(tree: unknown): any {
  globalThis.__expoWidgetLayout = () => tree as Record<string, unknown>;
  return globalThis.__expoWidgetRender({}, { timestamp: 1 });
}

describe('widget rendering', () => {
  afterEach(() => {
    delete globalThis.__expoWidgetLayout;
  });

  it('flattens children and assigns keyed or positional identities without mutating JSX', () => {
    const child = jsx('TextView', {});
    const source = jsx('VStackView', {
      children: [[jsx('TextView', {}, 1), [child, child]], jsx('SpacerView', {})],
    });
    const tree = render(source);

    expect(tree.props.children.map((child: any) => child.__expoWidgetIdentity)).toEqual([
      '["TextView","1"]',
      '["TextView",1]',
      '["TextView",2]',
      '["SpacerView",3]',
    ]);
    expect(Array.isArray(source.props.children[0])).toBe(true);
    expect(child.__expoWidgetIdentity).toBeUndefined();
  });

  it('preserves single children, text and conditional placeholders', () => {
    const tree = render(
      jsx('VStackView', {
        children: jsx('TextView', { children: ['count: ', [5, false, null]] }),
      })
    );

    expect(Array.isArray(tree.props.children)).toBe(false);
    expect(tree.props.children.__expoWidgetIdentity).toBe('["TextView",0]');
    expect(tree.props.children.props.children).toEqual(['count: ', 5, false, null]);
  });

  it('uses native type and key for identity, not props', () => {
    const first = render(jsx('TextView', { text: 'first' }, 'label'));
    const updated = render(jsx('TextView', { text: 'second' }, 'label'));

    expect(first.__expoWidgetIdentity).toBe('["TextView","label"]');
    expect(updated.__expoWidgetIdentity).toBe(first.__expoWidgetIdentity);
    expect(render(jsx('TextView', {}, 'other')).__expoWidgetIdentity).not.toBe(
      first.__expoWidgetIdentity
    );
    expect(render(jsx('ImageView', {}, 'label')).__expoWidgetIdentity).not.toBe(
      first.__expoWidgetIdentity
    );
  });

  it('preserves the outer component key without changing the host key or source element', () => {
    const host = jsx('TextView', {}, 'inner');
    const Inner = () => host;
    const Outer = jest.fn(() => jsx(Inner, {}));
    const source = jsx(Outer, {}, 'outer');

    expect(source.type).toBe(Outer);
    expect(Outer).not.toHaveBeenCalled();

    const tree = render(source);
    expect(Outer).toHaveBeenCalledTimes(1);
    expect(tree.__expoWidgetIdentity).toBe('["TextView","outer"]');
    expect(tree.key).toBe('inner');
    expect(host.__expoWidgetIdentity).toBeUndefined();
  });

  it('lets parents inspect unresolved child component types', () => {
    function Text(props: { children: unknown }) {
      const nestedText = Children.toArray(props.children).filter(
        (child: any) => child?.type === Text
      );
      return jsx('TextView', { children: nestedText });
    }
    const tree = render(
      jsx(Text, {
        children: jsx(Text, { children: 'nested' }, 'nested'),
      })
    );

    expect(tree.props.children).toHaveLength(1);
    expect(tree.props.children[0].__expoWidgetIdentity).toBe('["TextView","nested"]');
  });

  it('keeps keyed rows stable across reordering, prop updates and recreated components', () => {
    const renderRows = (items: string[], suffix: string) => {
      const Row = ({ text }: { text: string }) => jsx('TextView', { text: text + suffix });
      return render(jsx('VStackView', { children: items.map((text) => jsx(Row, { text }, text)) }));
    };
    const first = renderRows(['a', 'b'], '1').props.children;
    const second = renderRows(['b', 'a', 'c'], '2').props.children;

    expect(second.map((child: any) => child.__expoWidgetIdentity)).toEqual([
      first[1].__expoWidgetIdentity,
      first[0].__expoWidgetIdentity,
      '["TextView","c"]',
    ]);
    expect(second.map((child: any) => child.props.text)).toEqual(['b2', 'a2', 'c2']);
  });

  it('wraps array-returning components in a fragment that retains the component key', () => {
    const Row = () => [jsx('TextView', {}, 'a'), jsx('TextView', {}, 'b')];
    const tree = render(jsx(Row, {}, 'row'));

    expect(tree.__expoWidgetIdentity).toBe('["react.fragment","row"]');
    expect(tree.props.children.map((child: any) => child.__expoWidgetIdentity)).toEqual([
      '["TextView","a"]',
      '["TextView","b"]',
    ]);
  });

  it('normalizes Live Activity roots using their key or section name', () => {
    const tree = render({
      banner: jsx('TextView', { text: 'banner' }),
      compactTrailing: jsx('TextView', { text: 'trailing' }),
      compactLeading: jsx('TextView', {}, 'custom'),
    });

    expect(tree.banner.__expoWidgetIdentity).toBe('["TextView","banner"]');
    expect(tree.compactTrailing.__expoWidgetIdentity).toBe('["TextView","compactTrailing"]');
    expect(tree.compactLeading.__expoWidgetIdentity).toBe('["TextView","custom"]');
  });

  it('finds and presses a button inside a mapped list', () => {
    globalThis.__expoWidgetLayout = () =>
      jsx('HStackView', {
        children: [
          ['a', 'b'].map((label) => jsx('Button', { onButtonPress: () => ({ id: label }) }, label)),
          jsx('SpacerView', {}),
        ],
      });
    const tree = globalThis.__expoWidgetRender({}, {}) as any;
    const target = tree.props.children[1].props.target;

    expect(globalThis.__expoWidgetHandlePress({}, { target })).toEqual({ id: 'b' });
  });
});

describe('React.Children stub', () => {
  it('flattens and filters children without rewriting keys or mutating the source', () => {
    const child = jsx('TextView', {}, 'label');
    const children = [null, false, ['text', [child]], undefined];

    expect(Children.toArray(children)).toEqual(['text', child]);
    expect(Children.toArray(child)).toEqual([child]);
    expect(Children.toArray(null)).toEqual([]);
    expect(child.key).toBe('label');
    expect(children).toEqual([null, false, ['text', [child]], undefined]);
  });
});
