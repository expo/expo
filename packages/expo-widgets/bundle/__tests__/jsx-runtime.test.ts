import '../index';
import { jsx, jsxs } from '../jsx-runtime-stub';
import { Children } from '../react-stub';

jest.mock('@expo/ui/swift-ui', () => ({}));
jest.mock('@expo/ui/swift-ui/modifiers', () => ({}));

function render(tree: unknown): any {
  globalThis.__expoWidgetLayout = () => tree as Record<string, unknown>;
  return globalThis.__expoWidgetRender({}, { timestamp: 1 });
}

describe('jsx-runtime-stub', () => {
  afterEach(() => {
    delete globalThis.__expoWidgetLayout;
  });

  it('flattens nested children at render time without mutating the source tree', () => {
    const child = jsx('TextView', { text: 'a' }, 'a');
    const source = jsx('VStackView', {
      children: [[child, [jsx('TextView', { text: 'b' }, 'b')]], jsx('SpacerView', {})],
    });
    const tree = render(source);

    expect(tree).not.toBe(source);
    expect(tree.props).not.toBe(source.props);
    expect(tree.props.children.map((child: any) => child.type)).toEqual([
      'TextView',
      'TextView',
      'SpacerView',
    ]);
    expect(tree.props.children.map((child: any) => child.__expoWidgetIdentity)).toEqual([
      '["TextView","a"]',
      '["TextView","b"]',
      '["SpacerView",2]',
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

  it('keeps explicit numeric keys distinct from positional fallbacks', () => {
    const tree = render(
      jsx('VStackView', {
        children: [jsx('TextView', {}, 1), jsx('TextView', {})],
      })
    );

    expect(tree.props.children[0].__expoWidgetIdentity).toBe('["TextView","1"]');
    expect(tree.props.children[1].__expoWidgetIdentity).toBe('["TextView",1]');
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

  it('keeps recreated layout helpers stable while their props update', () => {
    globalThis.__expoWidgetLayout = ({ text }) => {
      function Row() {
        return jsx('TextView', { text });
      }
      return jsx('VStackView', { children: jsx(Row, {}, 'row') });
    };

    const first = globalThis.__expoWidgetRender({ text: 'first' }, {}) as any;
    const second = globalThis.__expoWidgetRender({ text: 'second' }, {}) as any;

    expect(first.props.children.__expoWidgetIdentity).toBe('["TextView","row"]');
    expect(second.props.children.__expoWidgetIdentity).toBe(
      first.props.children.__expoWidgetIdentity
    );
    expect(second.props.children.props.text).toBe('second');
  });

  it('treats function components as transparent wrappers for identity', () => {
    const First = () => jsx('TextView', { text: 'first' });
    const Second = () => jsx('TextView', { text: 'second' });

    expect(render(jsx(First, {})).__expoWidgetIdentity).toBe('["TextView",0]');
    expect(render(jsx(Second, {})).__expoWidgetIdentity).toBe('["TextView",0]');
  });

  it('keeps explicitly keyed children stable when a mapped list changes', () => {
    const Row = ({ text }: { text: string }) => jsx('TextView', { text });
    const makeTree = (items: string[]) =>
      jsx('VStackView', {
        children: [items.map((text) => jsx(Row, { text }, text)), jsx('SpacerView', {}, 'spacer')],
      });
    const first = render(makeTree(['a', 'b']));
    const second = render(makeTree(['b', 'a', 'c']));
    const identities = (tree: any) =>
      Object.fromEntries(
        tree.props.children.map((child: any) => [
          child.props.text ?? 'spacer',
          child.__expoWidgetIdentity,
        ])
      );

    expect(identities(second)).toMatchObject(identities(first));
  });

  it('wraps array-returning components in a fragment that retains the component key', () => {
    const Row = () => [jsx('TextView', {}, 'a'), jsx('TextView', {}, 'b')];
    const tree = render(
      jsx('VStackView', {
        children: [jsx(Row, {}, 'row'), jsx('SpacerView', {})],
      })
    );

    expect(tree.props.children[0].__expoWidgetIdentity).toBe('["react.fragment","row"]');
    expect(
      tree.props.children[0].props.children.map((child: any) => child.__expoWidgetIdentity)
    ).toEqual(['["TextView","a"]', '["TextView","b"]']);
  });

  it('assigns unkeyed identities by position without mutating reused elements', () => {
    const child = jsx('TextView', {});
    const tree = render(jsx('VStackView', { children: [null, child, child] }));

    expect(tree.props.children[1].__expoWidgetIdentity).toBe('["TextView",1]');
    expect(tree.props.children[2].__expoWidgetIdentity).toBe('["TextView",2]');
    expect(tree.props.children[1]).not.toBe(tree.props.children[2]);
    expect(child.__expoWidgetIdentity).toBeUndefined();
  });

  it('normalizes Live Activity roots using their section name as the positional fallback', () => {
    const tree = render({
      banner: jsx('TextView', { text: 'banner' }),
      compactTrailing: jsx('TextView', { text: 'trailing' }),
    });

    expect(tree.banner.__expoWidgetIdentity).toBe('["TextView","banner"]');
    expect(tree.compactTrailing.__expoWidgetIdentity).toBe('["TextView","compactTrailing"]');
  });

  it.each(['widget', 'liveActivity'])('applies explicit keys to %s roots', (kind) => {
    const renderRoot = (key: string) => {
      const root = jsx('VStackView', { children: jsx('TextView', {}) }, key);
      return kind === 'widget' ? render(root) : render({ banner: root }).banner;
    };
    const first = renderRoot('first');
    const second = renderRoot('second');

    expect(first.__expoWidgetIdentity).toBe('["VStackView","first"]');
    expect(second.__expoWidgetIdentity).toBe('["VStackView","second"]');
    expect(first.props.children.__expoWidgetIdentity).toBe(
      second.props.children.__expoWidgetIdentity
    );
  });

  it('finds and presses a button inside a mapped list', () => {
    const onPress = jest.fn(() => ({ id: 'pressed' }));
    globalThis.__expoWidgetLayout = () =>
      jsxs('HStackView', {
        children: [
          ['a', 'b'].map((label) =>
            jsx(
              'Button',
              {
                label,
                onButtonPress: label === 'b' ? onPress : () => ({}),
              },
              label
            )
          ),
          jsx('SpacerView', {}),
        ],
      });
    const tree = globalThis.__expoWidgetRender({}, {}) as any;
    const target = tree.props.children[1].props.target;

    expect(globalThis.__expoWidgetHandlePress({}, { target })).toEqual({ id: 'pressed' });
    expect(onPress).toHaveBeenCalledTimes(1);
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

  it('preserves unique keys through flattening and reordering', () => {
    const children = [[jsx('TextView', {}, 'a')], [jsx('TextView', {}, 'b')]];
    const first = render(Children.toArray(children));
    const second = render(Children.toArray(children).reverse());

    expect(first.map((child: any) => child.__expoWidgetIdentity)).toEqual([
      '["TextView","a"]',
      '["TextView","b"]',
    ]);
    expect(second.map((child: any) => child.__expoWidgetIdentity)).toEqual([
      '["TextView","b"]',
      '["TextView","a"]',
    ]);
  });
});
