import { act, type ReactElement, type ReactNode } from 'react';
import { dispatchCommand } from 'react-native/Libraries/ReactNative/RendererProxy';
import { createRoot, type TestInstance } from 'test-renderer';

import { Text } from '..';

jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => ({
  ...jest.requireActual('react-native/Libraries/ReactNative/RendererProxy'),
  dispatchCommand: jest.fn(),
}));

// The preset mocks `Text`. Parity needs React Native's real implementation.
const ReactNativeText = jest.requireActual('react-native/Libraries/Text/Text').default;
const { NativeVirtualText } = jest.requireActual('react-native/Libraries/Text/TextNativeComponent');

const TEST_TEXT = 'the text';

type HostNode = { type: string; props: Record<string, unknown>; children: HostNode[] | null };

// The text host components of React Native's renderer (`isInAParentText` in
// `ReactFabric`). The preset's mock of `Text` renders a `Text` host component.
async function render(element: ReactElement) {
  const root = createRoot({
    textComponentTypes: ['Text', 'RCTText', 'RCTVirtualText', 'RCTSelectableText'],
  });
  await act(async () => {
    root.render(element);
  });
  return (root.container.children[0] as TestInstance).toJSON() as unknown as HostNode;
}

function hostProps(node: HostNode) {
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node.props)) {
    // Refs and the menu event are not native props of `RCTText`. `onTouchStart`
    // also sends the menu items; a test below checks the user's handler still runs.
    if (key === 'ref' || key === 'onMenuAction' || key === 'onTouchStart') {
      continue;
    }
    props[key] = typeof value === 'function' ? 'function' : value;
  }
  return props;
}

// Compares host trees with each handler replaced by a placeholder, because the
// two renders create different function instances.
function normalize(children: HostNode[] | null): unknown {
  return (
    children?.map((child) =>
      typeof child === 'object'
        ? { type: child.type, props: hostProps(child), children: normalize(child.children) }
        : child
    ) ?? null
  );
}

// The renderer accepts raw strings only inside its text host components, so the
// children sit in one virtual text without props.
function unwrapChildren(node: HostNode) {
  if (node.children == null) {
    return null;
  }
  expect(node.children).toHaveLength(1);
  const [wrapper] = node.children;
  expect(wrapper!.type).toBe(NativeVirtualText);
  expect(hostProps(wrapper!)).toEqual({});
  return wrapper!.children;
}

async function expectSameHostOutputAsReactNative(
  props: Record<string, unknown>,
  children: ReactNode = TEST_TEXT
) {
  const expected = await render(<ReactNativeText {...props}>{children}</ReactNativeText>);
  const actual = await render(
    <Text {...props}>
      <Text.Menu>
        <Text.MenuAction onPress={() => {}}>Add to chat</Text.MenuAction>
      </Text.Menu>
      {children}
    </Text>
  );

  expect(expected.type).toBe('RCTText');
  expect(actual.type).toBe('ExpoSelectableText');
  expect(hostProps(actual)).toEqual(hostProps(expected));
  expect(normalize(unwrapChildren(actual))).toEqual(normalize(expected.children));
}

// The inputs of React Native's `Libraries/Text/__tests__/Text-itest.js` (0.88),
// named after its `describe` and `it` blocks.
const reactNativeTextCases: [string, Record<string, unknown>][] = [
  ['empty props', {}],
  [
    'fontVariationSettings: object',
    { style: { fontVariationSettings: { wght: 552.5, opsz: 17.25 } } },
  ],
  ['fontVariationSettings: empty object', { style: { fontVariationSettings: {} } }],
  ['adjustsFontSizeToFit: true', { adjustsFontSizeToFit: true }],
  ['allowFontScaling: true', { allowFontScaling: true }],
  ['allowFontScaling: false', { allowFontScaling: false }],
  ['ellipsizeMode: clip', { ellipsizeMode: 'clip' }],
  ['ellipsizeMode: head', { ellipsizeMode: 'head' }],
  ['ellipsizeMode: middle', { ellipsizeMode: 'middle' }],
  ['ellipsizeMode: tail', { ellipsizeMode: 'tail' }],
  ['id', { id: 'alpha' }],
  ['nativeID', { nativeID: 'alpha' }],
  ['id over nativeID', { id: 'alpha', nativeID: 'gamma' }],
  ...[-1, 0, 1, 3, 1000].map((value): [string, Record<string, unknown>] => [
    `maxFontSizeMultiplier: ${value}`,
    { maxFontSizeMultiplier: value },
  ]),
  ...[-1, 0, 3, 1000].map((value): [string, Record<string, unknown>] => [
    `numberOfLines: ${value}`,
    { numberOfLines: value },
  ]),
  ['selectable: true', { selectable: true }],
  ['selectable: false', { selectable: false }],
  ...['solid', 'double', 'dotted', 'dashed'].map(
    (textDecorationStyle): [string, Record<string, unknown>] => [
      `textDecorationStyle: ${textDecorationStyle}`,
      { style: { textDecorationLine: 'underline', textDecorationStyle } },
    ]
  ),
  ['textDecorationLine: line-through', { style: { textDecorationLine: 'line-through' } }],
  ...['rtl', 'ltr', 'auto'].map((writingDirection): [string, Record<string, unknown>] => [
    `writingDirection: ${writingDirection}`,
    { style: { writingDirection } },
  ]),
  ['accessibilityState with disabled', { disabled: true, accessibilityState: { disabled: false } }],
  ['onPress sets the link role', { onPress() {} }],
  ['onLongPress sets the link role', { onLongPress() {} }],
  ['onStartShouldSetResponder sets the link role', { onStartShouldSetResponder: () => true }],
  ['explicit accessibilityRole', { accessibilityRole: 'button', onPress() {} }],
  ['explicit role', { role: 'button', onPress() {} }],
  ['disabled with onPress', { disabled: true, onPress() {} }],
  ['verticalAlign', { style: { verticalAlign: 'middle' } }],
  ['letterSpacing', { style: { letterSpacing: 2 } }],
  ['lineHeight', { style: { lineHeight: 30 } }],
  ['fontVariant', { style: { fontVariant: ['small-caps'] } }],
  // A sample of React Native's shared accessibility, role, and testID suites.
  ['accessibilityLabel', { accessibilityLabel: 'label' }],
  ['accessibilityHint', { accessibilityHint: 'hint' }],
  ['accessible: false', { accessible: false }],
  ['aria-label', { 'aria-label': 'label' }],
  [
    'aria state',
    { 'aria-busy': true, 'aria-checked': 'mixed', 'aria-expanded': true, 'aria-selected': true },
  ],
  ['role: heading', { role: 'heading' }],
  ['testID', { testID: 'test-id' }],
  // Props that only this package's port processes.
  [
    'style processing',
    { numberOfLines: 2, style: { fontWeight: 700, color: 'red', userSelect: 'text' } },
  ],
  ['selectionColor', { selectionColor: 'blue' }],
];

describe('Text', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.mocked(dispatchCommand).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('renders the same host output as React Native Text', () => {
    it.each(reactNativeTextCases)('%s', async (_, props) => {
      await expectSameHostOutputAsReactNative(props);
    });

    it('aria-hidden without children', async () => {
      await expectSameHostOutputAsReactNative({ 'aria-hidden': true }, null);
    });

    it('nested Text', async () => {
      await expectSameHostOutputAsReactNative(
        {},
        <>
          Some text <ReactNativeText style={{ fontWeight: 'bold' }}>also in bold</ReactNativeText>
        </>
      );
    });

    it('nested Text with onPress', async () => {
      await expectSameHostOutputAsReactNative(
        {},
        <>
          Parent Text
          <ReactNativeText onPress={() => {}}>Nested Clickable Link</ReactNativeText>
        </>
      );
    });
  });

  it('does not mutate accessibilityState when disabled overrides it', async () => {
    const accessibilityState = { disabled: false };
    await render(
      <Text disabled accessibilityState={accessibilityState}>
        <Text.Menu />
        {TEST_TEXT}
      </Text>
    );
    expect(accessibilityState).toEqual({ disabled: false });
  });

  it('has the display name of React Native Text', () => {
    expect(Text.displayName).toBe(ReactNativeText.displayName);
  });

  it('renders React Native Text when there is no menu', async () => {
    const tree = await render(<Text selectable>Hello</Text>);
    expect(tree.type).not.toBe('ExpoSelectableText');
  });

  it('does not send the menu items before a touch', async () => {
    await render(
      <Text selectable>
        <Text.Menu>
          <Text.MenuAction onPress={() => {}}>Add to chat</Text.MenuAction>
        </Text.Menu>
        Hello
      </Text>
    );

    expect(dispatchCommand).not.toHaveBeenCalled();
  });

  it('sends the menu items to the native view when a touch starts', async () => {
    const onTouchStart = jest.fn();
    const tree = await render(
      // React Native's Text types leave out `onTouchStart`, but Text passes it on.
      <Text selectable {...({ onTouchStart } as object)}>
        <Text.Menu>
          <Text.MenuAction onPress={() => {}}>Add to chat</Text.MenuAction>
          <Text.MenuAction onPress={() => {}}>Quote</Text.MenuAction>
        </Text.Menu>
        Hello
      </Text>
    );
    const touchEvent = { nativeEvent: {} };
    await act(async () => {
      (tree.props.onTouchStart as (event: unknown) => void)(touchEvent);
    });

    expect(onTouchStart).toHaveBeenCalledWith(touchEvent);
    expect(dispatchCommand).toHaveBeenLastCalledWith(expect.anything(), 'setMenuItems', [
      [
        { id: '0', title: 'Add to chat' },
        { id: '1', title: 'Quote' },
      ],
    ]);
  });

  it('calls the pressed menu action with the selection', async () => {
    const addToChat = jest.fn();
    const quote = jest.fn();
    const tree = await render(
      <Text selectable>
        <Text.Menu>
          <Text.MenuAction onPress={addToChat}>Add to chat</Text.MenuAction>
          <Text.MenuAction onPress={quote}>Quote</Text.MenuAction>
        </Text.Menu>
        Hello world
      </Text>
    );

    const event = { id: '1', selectedText: 'world', start: 6, end: 11 };
    (tree.props.onMenuAction as (event: { nativeEvent: unknown }) => void)({ nativeEvent: event });

    expect(quote).toHaveBeenCalledWith(event);
    expect(addToChat).not.toHaveBeenCalled();
  });
});
