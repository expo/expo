# expo-selectable-text

React Native `Text` with range selection and custom items in the selection menu.

```tsx
import { Text } from 'expo-selectable-text';

<Text selectable>
  <Text.Menu>
    <Text.MenuAction onPress={({ selectedText, start, end }) => addToChat(selectedText)}>
      Add to chat
    </Text.MenuAction>
  </Text.Menu>
  Hello <Text style={{ fontWeight: 'bold' }}>world</Text>
</Text>;
```

Without a `Text.Menu` child, `Text` renders React Native's `Text`. With one, the outermost `Text` renders a
paragraph that reuses React Native's own text code:

| Layer      | React Native code that it uses                                                | What this package adds                                                                |
| ---------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| JavaScript | The root path of `Libraries/Text/Text.js`, ported line by line                | `Text.Menu` and `Text.MenuAction`                                                     |
| C++        | `ParagraphShadowNode`, under the name `ExpoSelectableText`                    | Nothing else                                                                          |
| iOS        | `RCTParagraphComponentView`, which still lays out, draws, and handles touches | A `UITextView` under the drawn text that provides range selection, and the menu items |
| Android    | `ReactTextViewManager` and `ReactTextView`                                    | An `ActionMode.Callback` that adds the menu items                                     |

## Behavior

- `start` and `end` are UTF-16 indexes into the text of the paragraph. An inline view counts as one character
  (U+FFFC), the same as in the attributed string that React Native builds.
- The menu items appear before the system items on iOS, and after Copy on Android.
- On iOS, a selection stays while the text changes, for example while a message streams in. The selection keeps
  its indexes. On Android, a text change clears the selection, the same as React Native `Text`.
- On Android, a long press on a nested `Text` with `onPress` also presses it, the same as React Native `Text`.
  On iOS it only selects.
- `selectionColor` works on Android only, the same as React Native `Text`.
- When a React Native upgrade removes a private method that the iOS selection layer uses, the paragraph logs a
  warning and keeps the React Native copy menu.

## Differences from React Native `Text`

- The outermost host component is `ExpoSelectableText`, not `RCTText`.
- The children of the paragraph sit in one `RCTVirtualText` without props. The React Native renderer accepts raw
  strings only inside the text host components that it knows. This adds one level to the attributed string and to
  `ref.childNodes`, and it does not change text attributes or drawing.

## Testing

`src/__tests__/Text-test.native.tsx` renders React Native's real `Text` and this `Text` with the inputs of React
Native's `Libraries/Text/__tests__/Text-itest.js` and compares the host output.
