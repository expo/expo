---
id: text
title: Text
---

A React component for displaying text.

`Text` supports nesting, styling, and touch handling.

In the following example, the nested title and body text will inherit the `fontFamily` from `styles.baseText`, but the title provides its own additional styles. The title and body will stack on top of each other on account of the literal newlines:

```js
import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';

const TextInANest = () => {
  const [titleText, setTitleText] = useState("Bird's Nest");
  const bodyText = useState('This is not really a bird nest.');

  const onPressTitle = () => {
    setTitleText("Bird's Nest [pressed]");
  };

  return (
    <Text style={styles.baseText}>
      <Text style={styles.titleText} onPress={onPressTitle}>
        {titleText}
        {'\n'}
        {'\n'}
      </Text>
      <Text numberOfLines={5}>{bodyText}</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  baseText: {
    fontFamily: 'Cochin',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default TextInANest;
```

## Nested text

Both Android and iOS allow you to display formatted text by annotating ranges of a string with specific formatting like bold or colored text (`NSAttributedString` on iOS, `SpannableString` on Android). In practice, this is very tedious. For React Native, we decided to use web paradigm for this where you can nest text to achieve the same effect.

```js
import React from 'react';
import { Text, StyleSheet } from 'react-native';

const BoldAndBeautiful = () => {
  return (
    <Text style={styles.baseText}>
      I am bold
      <Text style={styles.innerText}> and red</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  baseText: {
    fontWeight: 'bold',
  },
  innerText: {
    color: 'red',
  },
});

export default BoldAndBeautiful;
```

Behind the scenes, React Native converts this to a flat `NSAttributedString` or `SpannableString` that contains the following information:

```js
"I am bold and red"
0-9: bold
9-17: bold, red
```

## Containers

The `<Text>` element is unique relative to layout: everything inside is no longer using the Flexbox layout but using text layout. This means that elements inside of a `<Text>` are no longer rectangles, but wrap when they see the end of the line.

```js
<Text>
  <Text>First part and </Text>
  <Text>second part</Text>
</Text>
// Text container: the text will be inline if the space allowed it
// |First part and second part|

// otherwise, the text will flow as if it was one
// |First part |
// |and second |
// |part       |

<View>
  <Text>First part and </Text>
  <Text>second part</Text>
</View>
// View container: each text is its own block
// |First part and|
// |second part   |

// otherwise, the text will flow in its own block
// |First part |
// |and        |
// |second part|
```

## Limited Style Inheritance

On the web, the usual way to set a font family and size for the entire document is to take advantage of inherited CSS properties like so:

```css
html {
  font-family: 'lucida grande', tahoma, verdana, arial, sans-serif;
  font-size: 11px;
  color: #141823;
}
```

All elements in the document will inherit this font unless they or one of their parents specifies a new rule.

In React Native, we are more strict about it: **you must wrap all the text nodes inside of a `<Text>` component**. You cannot have a text node directly under a `<View>`.

```js
// BAD: will raise exception, can't have a text node as child of a <View>
<View>
  Some text
</View>

// GOOD
<View>
  <Text>
    Some text
  </Text>
</View>
```

You also lose the ability to set up a default font for an entire subtree. Meanwhile, `fontFamily` only accepts a single font name, which is different from `font-family` in CSS. The recommended way to use consistent fonts and sizes across your application is to create a component `MyAppText` that includes them and use this component across your app. You can also use this component to make more specific components like `MyAppHeaderText` for other kinds of text.

```js
<View>
  <MyAppText>Text styled with the default font for the entire application</MyAppText>
  <MyAppHeaderText>Text styled as a header</MyAppHeaderText>
</View>
```

Assuming that `MyAppText` is a component that only renders out its children into a `Text` component with styling, then `MyAppHeaderText` can be defined as follows:

```js
class MyAppHeaderText extends Component {
  render() {
    return (
      <MyAppText>
        <Text style={{ fontSize: 20 }}>{this.props.children}</Text>
      </MyAppText>
    );
  }
}
```

Composing `MyAppText` in this way ensures that we get the styles from a top-level component, but leaves us the ability to add / override them in specific use cases.

React Native still has the concept of style inheritance, but limited to text subtrees. In this case, the second part will be both bold and red.

```js
<Text style={{ fontWeight: 'bold' }}>
  I am bold
  <Text style={{ color: 'red' }}>and red</Text>
</Text>
```

We believe that this more constrained way to style text will yield better apps:

- (Developer) React components are designed with strong isolation in mind: You should be able to drop a component anywhere in your application, trusting that as long as the props are the same, it will look and behave the same way. Text properties that could inherit from outside of the props would break this isolation.

- (Implementor) The implementation of React Native is also simplified. We do not need to have a `fontFamily` field on every single element, and we do not need to potentially traverse the tree up to the root every time we display a text node. The style inheritance is only encoded inside of the native Text component and doesn't leak to other components or the system itself.

---

# Reference

## Props

### `accessibilityHint`

An accessibility hint helps users understand what will happen when they perform an action on the accessibility element when that result is not clear from the accessibility label.

| Type   |
| ------ |
| string |

---

### `accessibilityLabel`

Overrides the text that's read by the screen reader when the user interacts with the element. By default, the label is constructed by traversing all the children and accumulating all the `Text` nodes separated by space.

| Type   |
| ------ |
| string |

---

### `accessibilityRole`

Tells the screen reader to treat the currently focused on element as having a specific role.

On iOS, these roles map to corresponding Accessibility Traits. Image button has the same functionality as if the trait was set to both 'image' and 'button'. See the [Accessibility guide](https://reactnative.dev/docs/0.64/accessibility#accessibilitytraits-ios) for more information.

On Android, these roles have similar functionality on TalkBack as adding Accessibility Traits does on Voiceover in iOS

| Type                                                                                   |
| -------------------------------------------------------------------------------------- |
| [AccessibilityRole](https://reactnative.dev/docs/0.64/accessibility#accessibilityrole) |

---

### `accessibilityState`

Tells the screen reader to treat the currently focused on element as being in a specific state.

You can provide one state, no state, or multiple states. The states must be passed in through an object. Ex: `{selected: true, disabled: true}`.

| Type                                                                                     |
| ---------------------------------------------------------------------------------------- |
| [AccessibilityState](https://reactnative.dev/docs/0.64/accessibility#accessibilitystate) |

---

### `accessible`

When set to `true`, indicates that the view is an accessibility element.

See the [Accessibility guide](https://reactnative.dev/docs/0.64/accessibility#accessible-ios-android) for more information.

| Type    | Default |
| ------- | ------- |
| boolean | `true`  |

---

### `adjustsFontSizeToFit`

Specifies whether fonts should be scaled down automatically to fit given style constraints.

| Type    | Default |
| ------- | ------- |
| boolean | `false` |

---

### `allowFontScaling`

Specifies whether fonts should scale to respect Text Size accessibility settings.

| Type    | Default |
| ------- | ------- |
| boolean | `true`  |

---

### `android_hyphenationFrequency` **(Android)**

Sets the frequency of automatic hyphenation to use when determining word breaks on Android API Level 23+.

| Type                                             | Default  |
| ------------------------------------------------ | -------- |
| enum(`'none'`, `'full'`, `'balanced'`, `'high'`) | `'none'` |

---

### `dataDetectorType` **(Android)**

Determines the types of data converted to clickable URLs in the text element. By default no data types are detected.

You can provide only one type.

| Type                                                          | Default  |
| ------------------------------------------------------------- | -------- |
| enum(`'phoneNumber'`, `'link'`, `'email'`, `'none'`, `'all'`) | `'none'` |

---

### `disabled` **(Android)**

Specifies the disabled state of the text view for testing purposes.

| Type | Default |
| ---- | ------- |
| bool | `false` |

---

### `ellipsizeMode`

When `numberOfLines` is set, this prop defines how text will be truncated. `numberOfLines` must be set in conjunction with this prop.

This can be one of the following values:

- `head` - The line is displayed so that the end fits in the container and the missing text at the beginning of the line is indicated by an ellipsis glyph. e.g., "...wxyz"
- `middle` - The line is displayed so that the beginning and end fit in the container and the missing text in the middle is indicated by an ellipsis glyph. "ab...yz"
- `tail` - The line is displayed so that the beginning fits in the container and the missing text at the end of the line is indicated by an ellipsis glyph. e.g., "abcd..."
- `clip` - Lines are not drawn past the edge of the text container.

> On Android, when `numberOfLines` is set to value higher then `1`, only `tail` value will work correctly.

| Type                                           | Default |
| ---------------------------------------------- | ------- |
| enum(`'head'`, `'middle'`, `'tail'`, `'clip'`) | `tail`  |

---

### `maxFontSizeMultiplier`

Specifies largest possible scale a font can reach when `allowFontScaling` is enabled. Possible values:

- `null/undefined`: inherit from the parent node or the global default (0)
- `0`: no max, ignore parent/global default
- `>= 1`: sets the `maxFontSizeMultiplier` of this node to this value

| Type   | Default     |
| ------ | ----------- |
| number | `undefined` |

---

### `minimumFontScale` **(iOS)**

Specifies smallest possible scale a font can reach when `adjustsFontSizeToFit` is enabled. (values 0.01-1.0).

| Type   |
| ------ |
| number |

---

### `nativeID`

Used to locate this view from native code.

| Type   |
| ------ |
| string |

---

### `numberOfLines`

Used to truncate the text with an ellipsis after computing the text layout, including line wrapping, such that the total number of lines does not exceed this number. Setting this property to `0` will result in unsetting this value, which means that no lines restriction will be applied.

This prop is commonly used with `ellipsizeMode`.

| Type   | Default |
| ------ | ------- |
| number | `0`     |

---

### `onLayout`

Invoked on mount and on layout changes.

| Type                                    |
| --------------------------------------- |
| ([LayoutEvent](layoutevent.md)) => void |

---

### `onLongPress`

This function is called on long press.

| Type                                  |
| ------------------------------------- |
| ([PressEvent](pressevent.md)) => void |

---

### `onMoveShouldSetResponder`

Does this view want to "claim" touch responsiveness? This is called for every touch move on the `View` when it is not the responder.

| Type                                     |
| ---------------------------------------- |
| ([PressEvent](pressevent.md)) => boolean |

---

### `onPress`

This function is called on press.

| Type                                  |
| ------------------------------------- |
| ([PressEvent](pressevent.md)) => void |

---

### `onResponderGrant`

The View is now responding for touch events. This is the time to highlight and show the user what is happening.

| Type                                  |
| ------------------------------------- |
| ([PressEvent](pressevent.md)) => void |

---

### `onResponderMove`

The user is moving their finger.

| Type                                  |
| ------------------------------------- |
| ([PressEvent](pressevent.md)) => void |

---

### `onResponderRelease`

Fired at the end of the touch.

| Type                                  |
| ------------------------------------- |
| ([PressEvent](pressevent.md)) => void |

---

### `onResponderTerminate`

The responder has been taken from the `View`. Might be taken by other views after a call to `onResponderTerminationRequest`, or might be taken by the OS without asking (e.g., happens with control center/ notification center on iOS)

| Type                                  |
| ------------------------------------- |
| ([PressEvent](pressevent.md)) => void |

---

### `onResponderTerminationRequest`

Some other `View` wants to become responder and is asking this `View` to release its responder. Returning `true` allows its release.

| Type                                     |
| ---------------------------------------- |
| ([PressEvent](pressevent.md)) => boolean |

---

### `onStartShouldSetResponderCapture`

If a parent `View` wants to prevent a child `View` from becoming responder on a touch start, it should have this handler which returns `true`.

| Type                                     |
| ---------------------------------------- |
| ([PressEvent](pressevent.md)) => boolean |

---

### `onTextLayout`

Invoked on Text layout change.

| Type                                             |
| ------------------------------------------------ |
| ([`TextLayoutEvent`](#textlayoutevent)) => mixed |

---

### `pressRetentionOffset`

When the scroll view is disabled, this defines how far your touch may move off of the button, before deactivating the button. Once deactivated, try moving it back and you'll see that the button is once again reactivated! Move it back and forth several times while the scroll view is disabled. Ensure you pass in a constant to reduce memory allocations.

| Type                    |
| ----------------------- |
| [Rect](rect.md), number |

---

### `selectable`

Lets the user select text, to use the native copy and paste functionality.

| Type    | Default |
| ------- | ------- |
| boolean | `false` |

---

### `selectionColor` **(Android)**

The highlight color of the text.

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |

---

### `style`

| Type                                                                       |
| -------------------------------------------------------------------------- |
| [Text Style](text-style-props.md), [View Style Props](view-style-props.md) |

---

### `suppressHighlighting` **(iOS)**

When `true`, no visual change is made when text is pressed down. By default, a gray oval highlights the text on press down.

| Type    | Default |
| ------- | ------- |
| boolean | `false` |

---

### `testID`

Used to locate this view in end-to-end tests.

| Type   |
| ------ |
| string |

---

### `textBreakStrategy` **(Android)**

Set text break strategy on Android API Level 23+, possible values are `simple`, `highQuality`, `balanced`.

| Type                                            | Default       |
| ----------------------------------------------- | ------------- |
| enum(`'simple'`, `'highQuality'`, `'balanced'`) | `highQuality` |

## Type Definitions

### TextLayout

`TextLayout` object is a part of [`TextLayoutEvent`](#textlayoutevent) callback and contains the measurement data for `Text` line.

#### Example

```js
{
  capHeight: 10.496,
  ascender: 14.624,
  descender: 4,
  width: 28.224,
  height: 18.624,
  xHeight: 6.048,
  x: 0,
  y: 0
}
```

#### Properties

| Name      | Type   | Optional | Description                                                         |
| --------- | ------ | -------- | ------------------------------------------------------------------- |
| ascender  | number | No       | The line ascender height after the text layout changes.             |
| capHeight | number | No       | Height of capital letter above the baseline.                        |
| descender | number | No       | The line descender height after the text layout changes.            |
| height    | number | No       | Height of the line after the text layout changes.                   |
| width     | number | No       | Width of the line after the text layout changes.                    |
| x         | number | No       | Line X coordinate inside the Text component.                        |
| xHeight   | number | No       | Distance between the baseline and median of the line (corpus size). |
| y         | number | No       | Line Y coordinate inside the Text component.                        |

### TextLayoutEvent

`TextLayoutEvent` object is returned in the callback as a result of component layout change. It contains a key called `lines` with a value which is an array containing [`TextLayout`](#textlayout) object corresponded to every rendered text line.

#### Example

```js
{
  lines: [
    TextLayout,
    TextLayout,
    // ...
  ];
  target: 1127;
}
```

#### Properties

| Name   | Type                                | Optional | Description                                           |
| ------ | ----------------------------------- | -------- | ----------------------------------------------------- |
| lines  | array of [TextLayout](#textlayout)s | No       | Provides the TextLayout data for every rendered line. |
| target | number                              | No       | The node id of the element.                           |
