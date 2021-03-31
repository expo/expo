---
title: Configuring and Using react-native-vector-icons
---

`react-native-vector-icons` is a popular library for adding vector icons into your app.  This library bundles many SVG icon sets, such as [FontAwesome](https://fontawesome.com/), to help you get started quicker.  This guide will help you setup your project to use `react-native-vector-icons` and show you how to import icons into your react-native components.

## Setup

### iOS
iOS setup consists of two steps: 
- import `react-native-vector-icons` to your project via CocoaPods.  
- import the desired icon libraries to your project.

[CocoaPods](/guides/Using%20CocoaPods.md) is a dependency manager for Swift and Objective-C, like NPM is for node.  Check the [react-native-vector-icons docs](https://github.com/oblador/react-native-vector-icons#installation) for other approaches on setup for iOS.  

1.) Add the following line to your `./ios/Podfile`.  It should look like the following:

```Pod
platform :ios, '10.0'
 
target '<project-name>' do
  pod 'RNVectorIcons', :path => '../node_modules/react-native-vector-icons'  # add this line
```

Enter the ios directory and run pod update: 

`cd ./ios && npx pod update`  

This imports `react-native-vector-icons` to your xcode project. 


2.) Add bundled vector libraries to your `info.plist` file to tell xcode to include them with your app.  If you'll only be using one, such as FontAwesome, feel free to only include that item.  Add the following to your `./ios/<project-name>/info.plist`:
```plist
<plist version="1.0">
<dict>
  ...
  <key>UIAppFonts</key>
  <array> 
    <string>AntDesign.ttf</string> # optionally, only include icon sets you'd like to use
    <string>Entypo.ttf</string>
    <string>EvilIcons.ttf</string> 
    <string>Feather.ttf</string>
    <string>FontAwesome.ttf</string>
    <string>FontAwesome5_Brands.ttf</string>
    <string>FontAwesome5_Regular.ttf</string>
    <string>FontAwesome5_Solid.ttf</string>
    <string>Foundation.ttf</string>
    <string>Ionicons.ttf</string>
    <string>MaterialIcons.ttf</string>
    <string>MaterialCommunityIcons.ttf</string>
    <string>SimpleLineIcons.ttf</string>
    <string>Octicons.ttf</string>
    <string>Zocial.ttf</string>
    <string>Fontisto.ttf</string>
  </array>
</dict>
</plist>
```

### Android
Add the following to `android/app/build.gradle` ( NOT android/build.gradle ). Adding this to the end of the file is fine:
```gradle
...

apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```
 
This line tells android studio's `gradle` to include the vector libraries, similar to step 2 in the iOS setup.

If you'd like to only include some libraries, like FontAwesome and EvilIcons, add this as well:

```
...

project.ext.vectoricons = [
    iconFontNames: [ 'FontAwesome.ttf', 'EvilIcons.ttf' ] // Names of the font files you want to copy
]

apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```
 
## Usage
Now that you’ve added `react-native-vector-icons` and some icon sets it's time to use them inside your react-native app.  

Imports follow the following syntax: `import <SomeName> from "react-native-vector-icons/<IconLibraryName>"`.  You can only import icons from libraries you included in the setup.  Here are a few examples.

Importing FontAwesome:
```js
// App.js
import Icon from "react-native-vector-icons/FontAwesome"; // import icons from the FontAwesome library

// specify the icon you'd like with the name prop
const StarIcon = () => <Icon name="star" size={30} color="#900" />;
const RocketIcon = () => <Icon name="rocket" size={30} color="#900" />; 

const App: () => Node = () => {
  return (
    <SafeAreaView >
      <StarIcon />
      <RocketIcon />
    </SafeAreaView>
}
```

Importing EvilIcon:
```js
// App.js
import Icon from "react-native-vector-icons/EvilIcons"; // import icons from the EvilIcons library

const StarIcon = () => <Icon name="star" size={30} color="#900" />;

const App: () => Node = () => {
  return (
    <SafeAreaView >
      <StarIcon />
    </SafeAreaView>
}
```

Importing two different libraries in the same file:
```js
// App.js
import EvilIcon from "react-native-vector-icons/EvilIcons"; 
import FAIcon from "react-native-vector-icons/FontAwesome";

const StarIcon = () => <EvilIcon name="star" size={30} color="#900" />;
const RocketIcon = () => <FAIcon name="rocket" size={30} color="#900" />; 

const App: () => Node = () => {
  return (
    <SafeAreaView >
      <RocketIcon />
      <StarIcon />
    </SafeAreaView>
}
```

You can find the different icon and library names [here](https://github.com/oblador/react-native-vector-icons/tree/master/glyphmaps).  Cheers!