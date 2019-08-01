---
id: safeareaview
title: SafeAreaView
---

The purpose of `SafeAreaView` is to render content within the safe area boundaries of a device. It is currently only applicable to iOS devices with iOS version 11 or later.

`SafeAreaView` renders nested content and automatically applies paddings to reflect the portion of the view that is not covered by navigation bars, tab bars, toolbars, and other ancestor views. Moreover, and most importantly, Safe Area's paddings reflect the physical limitation of the screen, such as rounded corners or camera notches (i.e. the sensor housing area on iPhone X).

### Usage Example

Simply wrap your top level view with a `SafeAreaView` with a `flex: 1` style applied to it. You may also want to use a background color that matches your application's design.

```javascript
<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
  <View style={{ flex: 1 }}>
    <Text>Hello World!</Text>
  </View>
</SafeAreaView>
```

### Props

- [View props...](../view/#props)
