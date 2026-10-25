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

`SelectableText` wraps React Native's own `Text`. React Native still lays out, draws, and handles touches,
nested `Text`, and accessibility. The wrapper only adds selection:

| Platform | What it adds                                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | When a touch reaches a `Text`, a transparent `UITextView` with the same text layout goes under the drawn text and provides range selection and the menu items. |
| Android  | `ReactTextView` is a `TextView`, so the `Text` inside is made selectable and an `ActionMode.Callback` adds the menu items.                                     |

## Behavior

- The menu items apply to every `Text` inside the wrapper. They appear before the system items on iOS, and after
  Copy on Android.
- `start` and `end` are UTF-16 indexes into the text of the `Text`. An inline view counts as one character
  (U+FFFC).
- On iOS, a selection stays while the text changes, for example while a message streams in. On Android, a text
  change clears the selection, the same as React Native `Text`.
- On iOS, a long press on a nested `Text` with `onPress` only selects. On Android, it also presses it, the same as
  React Native `Text` with `selectable`.
- On Android, a tap outside the `Text` doesn't clear the selection, and `numberOfLines` doesn't show an ellipsis,
  the same as React Native `Text` with `selectable`.
- On iOS, if an inline view of the `Text` mounts or unmounts while a selection is shown, the selection is cleared.

## Private React Native internals

On iOS, the selection layer lines up with the drawn text through two private React Native internals:
`-[RCTParagraphTextView drawingFrame]` and `-[RCTTextLayoutManager _textStorageAndLayoutManagerWithAttributesString:paragraphAttributes:size:]`.
When a React Native version doesn't have them, the package logs a warning and uses public APIs with the same
setup. Selection keeps working, but the highlight can be slightly off for text with padding, a custom
`lineHeight`, or `adjustsFontSizeToFit`.

## Testing

- `apps/bare-expo/e2e/expo-selectable-text`: Maestro flows for the menu, a nested link, and a 500-row list.
- Native component list, Components → Selectable Text: basics, edge cases, and a chat list with a React Native
  `Text` control.
