---
id: accessibility
title: Accessibility
---

## Native App Accessibility (iOS and Android)

Both iOS and Android provide APIs for making apps accessible to people with disabilities. In addition, both platforms provide bundled assistive technologies, like the screen readers VoiceOver (iOS) and TalkBack (Android) for the visually impaired. Similarly, in React Native we have included APIs designed to provide developers with support for making apps more accessible. Take note, iOS and Android differ slightly in their approaches, and thus the React Native implementations may vary by platform.

In addition to this documentation, you might find [this blog post](https://code.facebook.com/posts/435862739941212/making-react-native-apps-accessible/) about React Native accessibility to be useful.

## Making Apps Accessible

### Accessibility properties

#### accessible (iOS, Android)

When `true`, indicates that the view is an accessibility element. When a view is an accessibility element, it groups its children into a single selectable component. By default, all touchable elements are accessible.

On Android, `accessible={true}` property for a react-native View will be translated into native `focusable={true}`.

```javascript
<View accessible={true}>
  <Text>text one</Text>
  <Text>text two</Text>
</View>
```

In the above example, we can't get accessibility focus separately on 'text one' and 'text two'. Instead we get focus on a parent view with 'accessible' property.

#### accessibilityLabel (iOS, Android)

When a view is marked as accessible, it is a good practice to set an accessibilityLabel on the view, so that people who use VoiceOver know what element they have selected. VoiceOver will read this string when a user selects the associated element.

To use, set the `accessibilityLabel` property to a custom string on your View, Text or Touchable:

```javascript
<TouchableOpacity accessible={true} accessibilityLabel="Tap me!" onPress={this._onPress}>
  <View style={styles.button}>
    <Text style={styles.buttonText}>Press me!</Text>
  </View>
</TouchableOpacity>
```

In the above example, the `accessibilityLabel` on the TouchableOpacity element would default to "Press me!". The label is constructed by concatenating all Text node children separated by spaces.

#### accessibilityHint (iOS, Android)

An accessibility hint helps users understand what will happen when they perform an action on the accessibility element when that result is not obvious from the accessibility label.

To use, set the `accessibilityHint` property to a custom string on your View, Text or Touchable:

```javascript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Go back"
  accessibilityHint="Navigates to the previous screen"
  onPress={this._onPress}>
  <View style={styles.button}>
    <Text style={styles.buttonText}>Back</Text>
  </View>
</TouchableOpacity>
```

iOS In the above example, VoiceOver will read the hint after the label, if the user has hints enabled in the device's VoiceOver settings. Read more about guidelines for accessibilityHint in the [iOS Developer Docs](https://developer.apple.com/documentation/objectivec/nsobject/1615093-accessibilityhint)

Android In the above example, Talkback will read the hint after the label. At this time, hints cannot be turned off on Android.

#### accessibilityIgnoresInvertColors(iOS)

Inverting screen colors is an Accessibility feature that makes the iPhone and iPad easier on the eyes for some people with a sensitivity to brightness, easier to distinguish for some people with color blindness, and easier to make out for some people with low vision. However, sometimes you have views such as photos that you don't want to be inverted. In this case, you can set this property to be false so that these specific views won't have their colors inverted.

#### accessibilityRole (iOS, Android)

`accessibilityRole` communicates the purpose of a component to the user of an assistive technology.

`accessibilityRole` can be one of the following:

- **none** Used when the element has no role.
- **button** Used when the element should be treated as a button.
- **link** Used when the element should be treated as a link.
- **search** Used when the text field element should also be treated as a search field.
- **image** Used when the element should be treated as an image. Can be combined with button or link, for example.
- **keyboardkey** Used when the element acts as a keyboard key.
- **text** Used when the element should be treated as static text that cannot change.
- **adjustable** Used when an element can be "adjusted" (e.g. a slider).
- **imagebutton** Used when the element should be treated as a button and is also an image.
- **header** Used when an element acts as a header for a content section (e.g. the title of a navigation bar).
- **summary** Used when an element can be used to provide a quick summary of current conditions in the app when the app first launches.
- **alert** Used when an element contains important text to be presented to the user.
- **checkbox** Used when an element represents a checkbox which can be checked, unchecked, or have mixed checked state.
- **combobox** Used when an element represents a combo box, which allows the user to select among several choices.
- **menu** Used when the component is a menu of choices.
- **menubar** Used when a component is a container of multiple menus.
- **menuitem** Used to represent an item within a menu.
- **progressbar** Used to represent a component which indicates progress of a task.
- **radio** Used to represent a radio button.
- **radiogroup** Used to represent a group of radio buttons.
- **scrollbar** Used to represent a scroll bar.
- **spinbutton** Used to represent a button which opens a list of choices.
- **switch** Used to represent a switch which can be turned on and off.
- **tab** Used to represent a tab.
- **tablist** Used to represent a list of tabs.
- **timer** Used to represent a timer.
- **toolbar** Used to represent a tool bar (a container of action buttons or components).

#### accessibilityStates (iOS, Android)

Describes the current state of a component to the user of an assistive technology.

`accessibilityStates` is an array of values, and may include any of the following:

- **selected** Used when the element is in a selected state. For example, a button is selected.
- **disabled** Used when the element is disabled and cannot be interacted with.
- **checked** Used to indicate that a checkable element is currently checked.
- **unchecked** Used to indicate that a checkable element is not currently checked.
- **busy** Used to indicate that an element is currently busy.
- **expanded** Used to indicate that an expandable element is currently expanded.
- **collapsed** Used to indicate that an expandable element is currently collapsed.

To use, set the `accessibilityStates` to an array containing the list of current states.

#### accessibilityViewIsModal (iOS)

A Boolean value indicating whether VoiceOver should ignore the elements within views that are siblings of the receiver.

For example, in a window that contains sibling views `A` and `B`, setting `accessibilityViewIsModal` to `true` on view `B` causes VoiceOver to ignore the elements in the view `A`. On the other hand, if view `B` contains a child view `C` and you set `accessibilityViewIsModal` to `true` on view `C`, VoiceOver does not ignore the elements in view `A`.

#### accessibilityElementsHidden (iOS)

A Boolean value indicating whether the accessibility elements contained within this accessibility element are hidden.

For example, in a window that contains sibling views `A` and `B`, setting `accessibilityElementsHidden` to `true` on view `B` causes VoiceOver to ignore the elements in the view `B`. This is similar to the Android property `importantForAccessibility="no-hide-descendants"`.

#### onAccessibilityTap (iOS)

Use this property to assign a custom function to be called when someone activates an accessible element by double tapping on it while it's selected.

#### onMagicTap (iOS)

Assign this property to a custom function which will be called when someone performs the "magic tap" gesture, which is a double-tap with two fingers. A magic tap function should perform the most relevant action a user could take on a component. In the Phone app on iPhone, a magic tap answers a phone call, or ends the current one. If the selected element does not have an `onMagicTap` function, the system will traverse up the view hierarchy until it finds a view that does.

#### onAccessibilityEscape (iOS)

Assign this property to a custom function which will be called when someone performs the "escape" gesture, which is a two finger Z shaped gesture. An escape function should move back hierarchically in the user interface. This can mean moving up or back in a navigation hierarchy or dismissing a modal user interface. If the selected element does not have an `onAccessibilityEscape` function, the system will attempt to traverse up the view hierarchy until it finds a view that does or bonk to indicate it was unable to find one.

#### accessibilityLiveRegion (Android)

When components dynamically change, we want TalkBack to alert the end user. This is made possible by the ‘accessibilityLiveRegion’ property. It can be set to ‘none’, ‘polite’ and ‘assertive’:

- **none** Accessibility services should not announce changes to this view.
- **polite** Accessibility services should announce changes to this view.
- **assertive** Accessibility services should interrupt ongoing speech to immediately announce changes to this view.

```javascript

<TouchableWithoutFeedback onPress={this._addOne}>
  <View style={styles.embedded}>
    <Text>Click me</Text>
  </View>
</TouchableWithoutFeedback>
<Text accessibilityLiveRegion="polite">
  Clicked {this.state.count} times
</Text>

```

In the above example method \_addOne changes the state.count variable. As soon as an end user clicks the TouchableWithoutFeedback, TalkBack reads text in the Text view because of its 'accessibilityLiveRegion=”polite”' property.

#### importantForAccessibility (Android)

In the case of two overlapping UI components with the same parent, default accessibility focus can have unpredictable behavior. The ‘importantForAccessibility’ property will resolve this by controlling if a view fires accessibility events and if it is reported to accessibility services. It can be set to ‘auto’, ‘yes’, ‘no’ and ‘no-hide-descendants’ (the last value will force accessibility services to ignore the component and all of its children).

```javascript

<View style={styles.container}>
  <View style={{position: 'absolute', left: 10, top: 10, right: 10, height: 100,
    backgroundColor: 'green'}} importantForAccessibility=”yes”>
    <Text> First layout </Text>
  </View>
  <View style={{position: 'absolute', left: 10, top: 10, right: 10, height: 100,
    backgroundColor: 'yellow'}} importantForAccessibility=”no-hide-descendants”>
    <Text> Second layout </Text>
  </View>
</View>

```

In the above example, the yellow layout and its descendants are completely invisible to TalkBack and all other accessibility services. So we can easily use overlapping views with the same parent without confusing TalkBack.

### Accessibility Actions

Accessibility actions allow an assistive technology to programmatically invoke the actions of a component. In order to support accessibility actions, a component must do two things:

- Define the list of actions it supports via the `accessibilityActions` property.
- Implement an `onAccessibilityAction` function to handle action requests.

The `accessibilityActions` property should contain a list of action objects. Each action object should contain the following fields:

| Name  | Type   | Required |
| ----- | ------ | -------- |
| name  | string | Yes      |
| label | string | No       |

Actions either represent standard actions, such as clicking a button or adjusting a slider, or custom actions specific to a given component such as deleting an email message. The `name` field is required for both standard and custom actions, but `label` is optional for standard actions.

When adding support for standard actions, `name` must be one of the following:

- `'magicTap'` - iOS only - While VoiceOver focus is on or inside the component, the user double tapped with two fingers.
- `'escape'` - iOS only - While VoiceOver focus is on or inside the component, the user performed a two finger scrub gesture (left, right, left).
- `'activate'` - Activate the component. Typically this should perform the same action as when the user touches or clicks the component when not using an assistive technology. This is generated when a screen reader user double taps the component.
- `'increment'` - Increment an adjustable component. On iOS, VoiceOver generates this action when the component has a role of `'adjustable'` and the user places focus on it and swipes upward. On Android, TalkBack generates this action when the user places accessibility focus on the component and presses the volume up button.
- `'decrement'` - Decrement an adjustable component. On iOS, VoiceOver generates this action when the component has a role of `'adjustable'` and the user places focus on it and swipes downward. On Android, TalkBack generates this action when the user places accessibility focus on the component and presses the volume down button.
- `'longpress'` - Android only - This action is generated when the user places accessibility focus on the component and double tap and holds one finger on the screen. Typically, this should perform the same action as when the user holds down one finger on the component while not using an assistive technology.

The `label` field is optional for standard actions, and is often unused by assistive technologies. For custom actions, it is a localized string containing a description of the action to be presented to the user.

To handle action requests, a component must implement an `onAccessibilityAction` function. The only argument to this function is an event containing the name of the action to perform. The below example from RNTester shows how to create a component which defines and handles several custom actions.

```javascript
<View
  accessible={true}
  accessibilityActions={[
    { name: 'cut', label: 'cut' },
    { name: 'copy', label: 'copy' },
    { name: 'paste', label: 'paste' },
  ]}
  onAccessibilityAction={event => {
    switch (event.nativeEvent.actionName) {
      case 'cut':
        Alert.alert('Alert', 'cut action success');
        break;
      case 'copy':
        Alert.alert('Alert', 'copy action success');
        break;
      case 'paste':
        Alert.alert('Alert', 'paste action success');
        break;
    }
  }}
/>
```

### Checking if a Screen Reader is Enabled

The `AccessibilityInfo` API allows you to determine whether or not a screen reader is currently active. See the [AccessibilityInfo documentation](../accessibilityinfo/) for details.

### Sending Accessibility Events (Android)

Sometimes it is useful to trigger an accessibility event on a UI component (i.e. when a custom view appears on a screen or a custom radio button has been selected). Native UIManager module exposes a method ‘sendAccessibilityEvent’ for this purpose. It takes two arguments: view tag and a type of an event.

```javascript

import { UIManager, findNodeHandle } from 'react-native';

_onPress: function() {
  const radioButton = this.state.radioButton === 'radiobutton_checked' ?
    'radiobutton_unchecked' : 'radiobutton_checked'

  this.setState({
    radioButton: radioButton
  });

  if (radioButton === 'radiobutton_checked') {
    UIManager.sendAccessibilityEvent(
      findNodeHandle(this),
      UIManager.AccessibilityEventTypes.typeViewClicked);
  }
}

<CustomRadioButton
  accessibilityComponentType={this.state.radioButton}
  onPress={this._onPress}/>

```

In the above example we've created a custom radio button that now behaves like a native one. More specifically, TalkBack now correctly announces changes to the radio button selection.

## Testing VoiceOver Support (iOS)

To enable VoiceOver, go to the Settings app on your iOS device (it's not available for simulator). Tap General, then Accessibility. There you will find many tools that people use to make their devices more usable, such as bolder text, increased contrast, and VoiceOver.

To enable VoiceOver, tap on VoiceOver under "Vision" and toggle the switch that appears at the top.

At the very bottom of the Accessibility settings, there is an "Accessibility Shortcut". You can use this to toggle VoiceOver by triple clicking the Home button.

## Testing TalkBack Support (Android)

To enable TalkBack, go to the Settings app on your Android device or emulator. Tap Accessibility, then TalkBack. Toggle the "Use service" switch to enable or disable it.

P.S. Android emulator doesn’t have TalkBack by default. To install it:

1. Download TalkBack file here: https://google-talkback.en.uptodown.com/android
2. Drag the downloaded `.apk` file into the emulator

You can use the volume key shortcut to toggle TalkBack. To turn on the volume key shortcut, go to the Settings app, then Accessibility. At the top, turn on Volume key shortcut.

To use the volume key shortcut, press both volume keys for 3 seconds to start an accessibility tool.

Additionally, if you prefer, you can toggle TalkBack via command line with:

```javascript

# disable
adb shell settings put secure enabled_accessibility_services com.android.talkback/com.google.android.marvin.talkback.TalkBackService

# enable
adb shell settings put secure enabled_accessibility_services com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService

```
