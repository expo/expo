# expo-selectable-text

Range selection and custom selection menu items for React Native `Text`.

```tsx
import { SelectableText } from 'expo-selectable-text';
import { Text } from 'react-native';

<SelectableText
  menu={[{ id: 'add-to-chat', title: 'Add to chat' }]}
  onMenuAction={({ id, selectedText, start, end }) => addToChat(selectedText)}>
  <Text>
    Hello <Text style={{ fontWeight: 'bold' }}>world</Text>
  </Text>
</SelectableText>;
```

`SelectableText` wraps React Native's own `Text`. React Native still lays out and draws the text, and handles
nested `Text` and accessibility. The wrapper only adds selection:

| Platform | What it adds                                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | When a touch reaches a `Text`, a transparent `UITextView` with the same text layout goes under the drawn text and provides range selection and the menu items. |
| Android  | `ReactTextView` is a `TextView`, so the `Text` inside is made selectable and an `ActionMode.Callback` adds the menu items.                                     |

## Behavior

- The menu items apply to every `Text` inside the wrapper. They appear before the system items on iOS, and after
  Copy on Android.
- `start` and `end` are UTF-16 indexes into the text of the `Text`. An inline view counts as one character
  (U+FFFC).
- Selecting text takes the focus, so a focused `TextInput` blurs and the keyboard closes.
- On iOS, while text is selected, touches on that `Text` go to the selection, so a nested `Text` with `onPress`
  is not pressed. A long press on it only selects. On Android, the long press also presses it, the same as React
  Native `Text` with `selectable`.
- On iOS, a selection stays while the text changes, for example while a message streams in. If an inline view of
  the `Text` mounts or unmounts, React Native's mounting clears the selection. On Android, a text change clears
  the selection, the same as React Native `Text`.
- With `numberOfLines`, iOS can select and copy the text that the ellipsis hides. On Android, `numberOfLines`
  doesn't show an ellipsis, the same as React Native `Text` with `selectable`.
- On Android, a tap outside the `Text` doesn't clear the selection, the same as React Native `Text` with
  `selectable`.
- On Android, a `Text` that is added later inside a nested view becomes selectable on its first touch, so its
  first long press may not start a selection.
- On Android, React Native's `enablePreparedTextLayout` feature flag renders `Text` with a view that isn't a
  `TextView`. That `Text` can't be selected, and the package logs a warning.

## Private React Native internals

On iOS, the selection layer lines up with the drawn text through two private React Native internals:
`-[RCTParagraphTextView drawingFrame]` and `-[RCTTextLayoutManager _textStorageAndLayoutManagerWithAttributesString:paragraphAttributes:size:]`.
When a React Native version doesn't have them, the package logs a warning and uses public APIs with the same
setup. Selection keeps working for plain text. Text with padding or a custom `lineHeight` can be a few points
off, and text with `adjustsFontSizeToFit` can select the wrong range, because the public setup doesn't scale
the font or apply React Native's baseline offset.

## Testing

- `apps/bare-expo/e2e/expo-selectable-text`: Maestro flows for the menu, a nested link, a 500-row list, and two
  `Text` in one wrapper.
- Native component list, Components → Selectable Text: basics, edge cases, and a chat list with a React Native
  `Text` control.
