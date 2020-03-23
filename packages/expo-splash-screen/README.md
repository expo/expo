# expo-splash-screen

`expo-splash-screen` customizes the splash screen that is shown on application launch. A splash screen is what users see when the app is launched, before it has loaded. Splash screens (sometimes called launch screens) provide a user's first experience with your application.

## Content

- [📜	CHANGELOG](./CHANGELOG.md)
- [🚀 Features](#-features)
- [📚 API](#-api)
- [🗒 Examples](#-examples)
- [💻 Installation in managed Expo projects](#-installation-in-managed-expo-projects)
- [🖥 Installation in bare React Native projects](#-installation-in-bare-react-native-projects)
  - [📱 Configure iOS](#-configure-ios)
  - [🤖 Configure Android](#-configure-android)
- [👏 Contributing](#-contributing)
- [❓ Known issues](#-known-issues)
- [🏅 Hall of fame](#-hall-of-fame)

## 🚀 Features

### Built-in splash screen image resize modes

`expo-splash-screen` is shipped with built-in feature for taking care of proper displaying your splash screen image. You can use following the resize modes to obtain behavior as if using React Native `<Image>` component's `resizeMode` style.

#### `CONTAIN` resize mode

Scale the image uniformly (maintain the image's aspect ratio) so that both dimensions (width and height) of the image will be equal to or less than the corresponding dimension of the device's screen.

| Android                                                   | iOS                                                        |
|-----------------------------------------------------------|------------------------------------------------------------|
| <img src="./assets/demo-android-contain.gif" height="350" /> | <img src="./assets/demo-ios-contain.gif" height="350" />  |

#### `COVER` resize mode

Scale the image uniformly (maintain the image's aspect ratio) so that both dimensions (width and height) of the image will be equal to or larger than the corresponding dimension of the device's screen.

| Android                                                   | iOS                                                        |
|-----------------------------------------------------------|------------------------------------------------------------|
| <img src="./assets/demo-android-cover.gif" height="350" /> | <img src="./assets/demo-ios-cover.gif" height="350" />  |

#### `NATIVE` resize mode

> **Android only.**

Using this resize mode your app will be leveraging Android's ability to present a static bitmap while the application is starting up.
Android (unlike iOS) does not support stretching of the provided image during launching phase, so the application will present the given image centered on the screen at its original dimensions.

| Android                                                   |
|-----------------------------------------------------------|
| <img src="./assets/demo-android-native.gif" height="350" /> |

> Animation above present one of [known issues](#native-mode-pushes-splash-image-up-a-little-bit)

Selecting this resize mode requires some more work to be done in native configuration.
Please take a look at [`res/drawable/splashscreen.xml`](#resdrawablesplashscreenxml) section and [`res/drawable/splashscreen_background.png`](#resdrawablesplashscreen_backgroundpng) section.

## 📚 API

```tsx
import * as SplashScreen from 'expo-splash-screen';
```

The native splash screen that is controlled via this modules autohides once ReactNative-controlled view hierarchy is mounted. That means that upon the first `render` of your application returning some renderable view component native splash screen will hide. This default behavior can be prevented by calling [`SplashScreen.preventAutoHideAsync()`](#splashscreenpreventautohideasync) and later on [`SplashScreen.hideAsync()`](#splashscreenhideasync).

### `SplashScreen.preventAutoHideAsync()`

Makes the native splash screen stay visible until [`SplashScreen.hideAsync()`](#splashscreenhideasync) is called. This method must be called before any ReactNative-controlled view hierarchy is rendered (either in global scope of your main component or when component renders `null` at the beginning - see [Examples section](#-examples)).

Preventing default autohiding might come in handy if your application needs to prepare/download some resources and/or make some API calls before first `render` returning some actual view hierarchy with data can be made.

#### Returns

A `Promise` that resolves when preventing autohiding succeeded.
`Promise` rejection most likely means that native splash screen cannot be prevented from autohiding (it's already hidden at the moment of calling this method or the splash screen is already prevented from autohiding (subsequent call to this method)).

### `SplashScreen.hideAsync()`

Hides the native splash screen. Works only if native splash screen has been previously prevented from autohiding by calling [`SplashScreen.preventAutoHideAsync()`](#splashscreenpreventautohideasync) method.

#### Returns

A `Promise` that resolves once the splash screen becomes hidden.
`Promise` rejection most likely means that native splash screen is already hidden (either by previously called `hideAsync` or not calling `preventAutoHideAsync` in the first place).

## 🗒 Examples

### `SplashScreen.preventAutoHideAsync()` in global scope  

`App.tsx`
```tsx
import React from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Prevent native splash screen from autohiding before App component declaration
SplashScreen.preventAutoHideAsync()
  .then(() => console.log('SplashScreen.preventAutoHideAsync() succeeded'))
  .catch(console.warn); // it's good to explicitly catch and inspect any error 

export default class App extends React.Component {
  componentDidMount() {
    // Hides native splash screen after 2s
    setTimeout(async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e); // it's good to explicitly catch and inspect any error
      }
    }, 2000);
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>SplashScreen Demo! 👋</Text>
      </View>
    )
  } 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#aabbcc',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
};
```

### `SplashScreen.preventAutoHideAsync()` in component that initially renders `null`

`App.tsx`
```tsx
import React from 'react';
import * as SplashScreen from 'expo-splash-screen';

export default class App extends React.Component {
  state = {
    appIsReady: false,
  };

  async componentDidMount() {
    // Prevent native splash screen from autohiding
    try {
      await SplashScreen.preventAutoHideAsync();
    } catch (e) {
      console.warn(e);
    }
    this.prepareResources();
  }

  /**
   * Method that serves to load resources and make API calls
   */ 
  prepareResources = async () => {
    await performAPICalls(...);
    await downloadAssets(...);

    this.setState({ appIsReady: true }, async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    });
  }

  render() {
    if (!this.state.appIsReady) {
      return null;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.text}>SplashScreen Demo! 👋</Text>
      </View>
    )
  } 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#aabbcc',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
};
```


## 💻 Installation in managed Expo projects

[Managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects are not supported by this unimodule at this moment. In managed Expo project please fallback to `Expo.SplashScreen` module that is shipped with `expo` module.

## 🖥 Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your dependencies

```
expo install expo-splash-screen
```

### 📱 Configure iOS

Run `pod install` in the `ios` directory after installing the package.

To achieve native splash screen (in iOS ecosystem it's called `LaunchScreen`) you have to provide either `SplashScreen.storyboard` file or `SplashScreen.xib` file and configure your Xcode project accordingly.

The guide below presents how to configure your project in Xcode to use single image file as a splash screen using a `.storyboard` file (configuration for `.xib` filetype is analogous).

#### `Images.xcassets`

First you need to add the image file that would serve as a splash screen to native project's resources.

1. In your Xcode project open the `.xcassets` (often named `Images.xcassets` or `Assets.xcassets`) file.
2. In content panel add `New image set` and name it `SplashScreen`.
3. Provide splash screen image you've prepared (you have to provide it in three different scales).

<img src="./assets/configuration-ios-addImagesXcassets.png" height="350" />

#### `SplashScreen.storyboard`

This is the actual splash screen definition and would be used by the system to render your splash screen.

1. Create a `SplashScreen.storyboard` file.
2. Add a `View Controller` to the newly created `.storyboard` file:
    - open `Library` (`+` button on the top-right),
    - find `View Controller` element,
    - drag-and-drop it to the `.storyboard` file.

<img src="./assets/configuration-ios-addViewControllerToStoryboard.png" height="350" />

3. Add an `Image View` to the `View Controller`:
    - first remove other `View` element from `View Controller`,
    - open `Library` (`+` button on the top-right),
    - find `Image View` element,
    - drag-and-drop it as a `View Controller` child in view hierarchy inspector.

<img src="./assets/configuration-ios-addImageViewToStoryboard.png" height="350" />
  
4. Set `Storyboard ID` to `SplashScreenViewController`:
    - select `View Controller` in view hierarchy inspector,
    - navigate to `Identity Inspector` in the right panel,
    - and set `Storyboard ID` to `SplashScreenViewController`.

<img src="./assets/configuration-ios-addStoryboardID.png" height="350" />

5. Configure `Image View` source:
    - select `Image View` in view hierarchy inspector,
    - navigate to `Attributes Inspector` in the right panel,
    - select `SplashScreen` in `Image` parameter).

<img src="./assets/configuration-ios-configureImageView.png" height="350" />

6. Configure `Background` of the `Image View`:
    - select `Image View` in view hierarchy inspector,
    - navigate to `Attributes Inspector` in the right panel,
    - configure `Background` parameter:
        - To enter a `#RRGGBB` value you need to select `Custom` option and in the `Colors Popup` that appeared you need to navigate to the second tab and choose `RGB Sliders` from dropdown select.

<img src="./assets/configuration-ios-selectBackgroundColor.png" height="350" />

#### `ImageView`'s `ContentMode`

This is the way your image would be presented on the screen.

1. Open `SplashScreen.storyboard` and select `Image View` from `View Controller`.
2. Navigate to `Attributes Inspector` in the right panel and locate `Content Mode`.
3. Select one of the following:
    - `Aspect Fit` to obtain [CONTAIN resize mode](#contain-resize-mode),
    - `Aspect Fill` to obtain [COVER resize mode](#cover-resize-mode).
4. You can always choose other options to achieve different image positioning and scaling.

<img src="./assets/configuration-ios-selectImageViewContentMode.png" height="350" />

#### Launch Screen File

Newly created `SplashScreen.storyboard` needs to be marked as `Launch Screen File` in your Xcode project to be presented from the very beginning of your application launch.

1. Select your project in `Project Navigator`
2. Select your project name from `TARGETS` panel and navigate to `General` tab.
3. Locate `App Icons and Launch Images` section and `Launch Screen File` option.
4. Select or enter `SplashScreen` as the value for located option.

<img src="./assets/configuration-ios-selectLaunchScreen.png" height="350" />

### 🤖 Configure Android

To achieve fully-native splash screen behavior `expo-splash-screen` needs to be hooked into native view hierarchy and consume some resources that have to be placed under `/android/app/src/res` directory.

#### `SplashScreen.show(Activity activity, SplashScreenImageResizeMode mode, Class rootViewClass)`

This native method is used to hook SplashScreen into native view hierarchy that is attached to the provided activity.

You can use this method to customize how splash screen view will be presented. Pass one of `SplashScreenImageResizeMode.{CONTAIN, COVER, NATIVE}` as second argument to do so.

#### `MainActivity.{java,kt}`

Modify `MainActivity.{java,kt}` or any other activity that is marked in main `AndroidManifest.xml` as a starting activity of your application.
Ensure `SplashScreen.show(...)` method is called after `super.onCreate(...)`. (If `onCreate` method is not overwritten yet, override it including `SplashScreen.show(...)`).

```diff
+ import expo.modules.splashscreen.SplashScreen;
+ import expo.modules.splashscreen.SplashScreenImageResizeMode;

public class MainActivity extends ReactActivity {

  // other methods

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
+   // SplashScreen.show(...) has to called after super.onCreate(...)
+   SplashScreen.show(this, SplashScreenImageResizeMode.CONTAIN, ReactRootView.class);
    ...
  }

  // other methods
}
```


#### `res/drawable/splashscreen_background.png`

You have to provide splash screen image and place it under `res/drawable` directory.
This image will be loaded as soon as view Android mounts your application's native view hierarchy.

##### `NATIVE` mode adjustments

If you've selected `SplashScreenImageResizeMode.NATIVE` mode, you need to do a few additional steps.

In your application's `res` directory you might want to have a number of `drawable-X` sub-directories (where `X` is the different DPI for different devices). They store different versions of images that are picked based on the device's DPI (for more information please see [this official Android docs](https://developer.android.com/training/multiscreen/screendensities#TaskProvideAltBmp)).

To achieve proper scaling of your splash screen image on every device you should have following directories:
- `res/drawable-mdpi` - scale 1x - resources for medium-density (mdpi) screens (~160dpi). (This is the baseline density.)
- `res/drawable-hdpi` - scale 1.5x - resources for high-density (hdpi) screens (~240dpi).
- `res/drawable-xhdpi` - scale 2x - resources for extra-high-density (xhdpi) screens (~320dpi).
- `res/drawable-xxhdpi` - scale 3x - resources for extra-extra-high-density (xxhdpi) screens (~480dpi).
- `res/drawable-xxxhdpi` - scale 4x - resources for extra-extra-extra-high-density (xxxhdpi) uses (~640dpi).

Each of directories mentioned above should contain the same `splashscreen_image.png` file, but with different resolution (pay attention to scale factors).


#### `res/values/colors.xml`

File containing colors that are reused across your application on native level.
Update the file with the following content or create one if missing:

```diff
<resources>
+ <color name="splashscreen_background">#AABBCC</color> <!-- #AARRGGBB or #RRGGBB format -->
  <!-- Other colors defined for your application -->
</resources>
```


#### `res/drawable/splashscreen.xml`

File containing description how splash screen view should be drawn by the Android system.
Create the file with the following content:

```diff
+ <layer-list xmlns:android="http://schemas.android.com/apk/res/android">
+   <item android:drawable="@color/splashscreen_background"/>
+ </layer-list>
```

##### `NATIVE` mode adjustments

If you've selected `SplashScreenImageResizeMode.NATIVE` mode, you should add:

```diff
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
+ <item>
+   <bitmap android:gravity="center" android:src="@drawable/splashscreen_image"/>
+ </item>
</layer-list>
```


#### `res/values/styles.xml`

Locate your main activity theme in `/android/app/src/res/values/styles.xml` or create one if missing.

```diff
  <!-- Main activity theme. -->
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
+   <item name="android:windowBackground">@drawable/splashscreen</item> <!-- this line instructs the system to use 'splashscreen.xml' as a background of the whole application -->
    <!-- Other style properties -->
  </style>
```


#### `AndroidManifest.xml`

Adjust your application's main `AndroidManifest.xml` to contain `android:theme` property pointing to the style that contains splash screen configuration:

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.myapp">

  ...

  <application ...>

+   <!-- Ensure that 'android:theme' property is pointing to the style containing native splash screen reference - see 'styles.xml' -->
    <activity
      android:name=".MainActivity"
+     android:theme="@style/AppTheme"
      ...
    >
      ...
    </activity>
  </application>

</manifest>

```


## 👏 Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).

## ❓ Known issues

### iOS caching

Splash Screens on iOS apps can sometimes encounter a caching issue where the previous image will flash before showing the new, intended image. When this occurs, we recommend you try power cycling your device and uninstalling and re-installing the application. However, the caching sometimes can persist for a day or two so be patient if the aforementioned steps were unable to resolve the issue.

### `NATIVE` mode pushes splash image up a little bit

See [`NATIVE`](#native-resize-mode) mode preview above.
> We are aware of this issue and unfortunately haven't been able to provide a solution as of yet. This is on our immediate roadmap...

## 🏅 Hall Of Fame

This module is based on a solid work from (many thanks for that 👏):
- [react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen)
- [react-native-bootsplash](https://github.com/zoontek/react-native-bootsplash)
- [react-native-make](https://github.com/bamlab/react-native-make)
