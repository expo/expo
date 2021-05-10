# 📦 expo-dev-menu

Expo/React Native module with the developer menu.

# ⚙️ Installation

Firstly, you need to add the `expo-dev-menu` package to your project.

<details>
<summary>yarn</summary>

```bash
yarn add expo-dev-menu
```

</details>

<details>
<summary>npm</summary>

```bash
npm install expo-dev-menu
```

</details>

Then you can start to configure the native projects using steps below.

## 🤖 Android

1.  Set up the `DevMenuManager` in the native code.

    You can do it in two ways. We recommend using the basic initialization. However, if you have the custom activity in your application, then the advanced one will be more suitable for you.

    - **Basic**

      Open the `MainActivity.java` or `MainActivity.kt` and make sure that your main activity class extends the `DevMenuAwareReactActivity`.

        <details>
        <summary>Java</summary>

      ```java
      ...
      // You need to import the `DevMenuAwareReactActivity` class
      import expo.modules.devmenu.react.DevMenuAwareReactActivity;
      ...

      // Make sure that the `MainActivity` extends the `DevMenuAwareReactActivity` class not the `ReactActivity`
      public class MainActivity extends DevMenuAwareReactActivity {
        ...
      }
      ```

        </details>
        <details>
        <summary>Kotlin</summary>

      ```kotlin
      ...
      // You need to import the `DevMenuAwareReactActivity` class
      import expo.modules.devmenu.react.DevMenuAwareReactActivity;
      ...

      // Make sure that the `MainActivity` extends the `DevMenuAwareReactActivity` class not the `ReactActivity`
      class MainActivity : DevMenuAwareReactActivity() {
        ...
      }
      ```

      </details>

      <br/>

    - **Advanced**


      I. Open the file with the main activity of your application (`MainActivity.java` or `MainActivity.kt`) and add methods that will communicate with the `DevMenuManager`.

      <details>
      <summary>Java</summary>

      ```java
      ...
      // Add those imports.
      import android.view.KeyEvent;
      import android.view.MotionEvent;

      import expo.modules.devmenu.DevMenuManager;
      ...

      public class MainActivity extends ReactActivity {
        ...
        // A function which sends the touch events to the dev menu.
        @Override
        public boolean dispatchTouchEvent(MotionEvent ev) {
          DevMenuManager.INSTANCE.onTouchEvent(ev);
          return super.dispatchTouchEvent(ev);
        }

        // A function which handles the key commands.
        @Override
        public boolean onKeyUp(int keyCode, KeyEvent event) {
          return DevMenuManager.INSTANCE.onKeyEvent(keyCode, event) || super.onKeyUp(keyCode, event);
        }
      }
      ```

      </details>

      <details>
      <summary>Kotlin</summary>

      ```kotlin
      ...
      // Add those imports.
      import android.view.KeyEvent;
      import android.view.MotionEvent;

      import expo.modules.devmenu.DevMenuManager;
      ...

      class MainActivity : ReactActivity() {
        ...
        // A function which sends the touch events to the dev menu.
        override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
          DevMenuManager.onTouchEvent(ev)
          return super.dispatchTouchEvent(ev)
        }

        // A function which handles the key commands.
        override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
          return DevMenuManager.onKeyEvent(keyCode, event) || super.onKeyUp(keyCode, event)
        }
      }
      ```

      </details>


      <br/>

      II. Open the `MainApplication` class (`MainApplication.java` or `MainApplication.kt`) and in `onCreate` method initialize `DevMenuManager`.

      <details>
      <summary>Java</summary>

      ```java
      ...
      public class MainApplication extends Application implements ReactApplication {
        ...
        @Override
        public void onCreate() {
          ...
          DevMenuManager.INSTANCE.initializeWithReactNativeHost(getReactNativeHost());
        }
      }
      ```

      </details>


      <details>
      <summary>Kotlin</summary>

      ```kotlin
      ...
      public class MainApplication : Application(), ReactApplication {
        ...
        override fun onCreate() {
          ...
          DevMenuManager.initializeWithReactNativeHost(reactNativeHost);
        }
      }
      ```

      </details>

## 🍏 iOS

1. Add `expo-dev-menu` to your Podfile.


      ```ruby
      ...
      target '<your app>' do
        ...
        pod 'EXDevMenu', path: '../node_modules/expo-dev-menu', :configurations => :debug
        ...
      end
      ```

2. Run `pod install` in `ios` directory.
3. Open file with your `AppDelegate` (`AppDelegate.m` or `AppDelegate.swift`) and pass bridge to the `DevMenuManager`.

      <details>
      <summary>Objective-C</summary>

   ```objc
   ...
   // Firstly, you need to import EXDevMenu package.
   #if defined(EX_DEV_MENU_ENABLED)
   @import EXDevMenu;
   #endif
   ...

   @implementation AppDelegate
   ...
   - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
   {
     ...
     RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
     RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                      moduleName:@"devMenuDemo"
                                               initialProperties:nil];
     // Add those lines only if you aren't using the dev-launcher.
     #if defined(EX_DEV_MENU_ENABLED)
     [DevMenuManager configureWithBridge:bridge];
     #endif
   }
   @end
   ```

      </details>

      <details>
      <summary>Swift</summary>

   ```swift
   ...
   // Firstly, you need to import EXDevMenu package.
   #if EX_DEV_MENU_ENABLED
   @import EXDevMenu
   #endif
   ...

   @UIApplicationMain
   class AppDelegate: UMAppDelegateWrapper {
     override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
       ...

       if let bridge = RCTBridge(delegate: self, launchOptions: launchOptions) {
         ...
         // Add those lines.
         #if EX_DEV_MENU_ENABLED
         DevMenuManager.configure(withBridge: bridge)
         #endif
       }

       ...
     }
   }
   ```

      </details>

# 📂 Accessing the Developer Menu

You can access the developer menu by shaking your device, making a three-finger long-press gesture, or by selecting "Shake Gesture" inside the Hardware menu in the iOS simulator. You can also use keyboard shortcuts - `⌘D` on iOS, or `⌘M` on Android when you're using Mac OS and `Ctrl+M` on Windows and Linux. Alternatively for Android, you can run the command `adb shell input keyevent 82` to open the dev menu (`82` being the Menu key code).

> **Note:** if you're using the iOS simulator and keyboard shortcuts don't work, make sure you've selected `Send Keyboard Input to Device` inside the `I/O` menu in the Simulator.

# 💪 Extending the dev-menu's functionalities

One of the main purposes of this package was to provide an easy way to create extensions. We know that developing a React Native app can be painful - often, developers need to create additional tools, which for example, clear the local storage, to test or debug their applications. Some of their work can be integrated with the application itself to save time and make the development more enjoyable.

The below instructions will show you how to create simple extension that removes a key from the `NSUserDefaults`/`SharedPreferences`.

> **Note:** The tutorial was written using Kotlin and Swift. However, you can also use Java and Objective-C if you want.

  <details>
  <summary>🤖 Android</summary>

1. Create a class which extends the `ReactContextBaseJavaModule` and implements the `DevMenuExtensionInterface`.

   ```kotlin
   // CustomDevMenuExtension.kt
   package com.devmenudemo.customdevmenuextension

   import com.facebook.react.bridge.ReactApplicationContext
   import com.facebook.react.bridge.ReactContextBaseJavaModule
   import expo.interfaces.devmenu.DevMenuExtensionInterface
   import expo.interfaces.devmenu.items.DevMenuItem

   class CustomDevMenuExtension(reactContext: ReactApplicationContext)
     : ReactContextBaseJavaModule(reactContext),
       DevMenuExtensionInterface {

     override fun getName() = "CustomDevMenuExtension" // here you can provide name for your extension

     override fun devMenuItems(): List<DevMenuItem>? {
       // Firstly, create a function which will be called when the user presses the button.
       val clearSharedPreferencesOnPress: () -> Unit = {
         reactApplicationContext
           .getSharedPreferences("your.shared.preferences", MODE_PRIVATE)
           .edit()
           .apply {
             remove("key_to_remove")
             Log.i("CustomDevMenuExt", "Remove key from SharedPreferences")
             apply()
           }
       }

       // Then, create `DevMenuAction` object.
       val clearSharedPreferences = DevMenuAction(
         actionId = "clear_shared_preferences", // This string identifies your custom action. Make sure that it's unique.
         action = clearSharedPreferencesOnPress
       ).apply {
         label = { "Clear shared preferences" } // This string will be displayed in the dev menu.
         glyphName = { "delete" } // This is a icon name used to present your action. You can use any icon from the `MaterialCommunityIcons`.
         importance = DevMenuItemImportance.HIGH.value // This value tells the dev-menu in which order the actions should be rendered.
         keyCommand = KeyCommand(KeyEvent.KEYCODE_S) // You can associate key commend with your action.
       }

       // Return created object. Note: you can register multiple actions if you want.
       return listOf(clearSharedPreferences)
     }
   }
   ```

2. Create a react native package class for the extension.

   ```kotlin
   // CustomDevMenuExtensionPackage.kt
   package com.devmenudemo.customdevmenuextension

   import android.view.View
   import com.facebook.react.ReactPackage
   import com.facebook.react.bridge.ReactApplicationContext
   import com.facebook.react.uimanager.ReactShadowNode
   import com.facebook.react.uimanager.ViewManager

   class CustomDevMenuExtensionPackage : ReactPackage {
       override fun createNativeModules(reactContext: ReactApplicationContext) = listOf(
           CustomDevMenuExtension(reactContext) // here you need to export your custom extension
       )

       override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> = listOf()

   }
   ```

3. Go to `MainApplication` (`MainApplication.java` or `MainApplication.kt`) and register created package.

   ```java
   // MainApplication.java

   // You need to import your custom package.
   import com.devmenudemo.customdevmenuextension.CustomDevMenuExtensionPackage; // the package can be different in your case

   ...
   public class MainApplication extends Application implements ReactApplication {
     ...

     @Override
     protected List<ReactPackage> getPackages() {
       List<ReactPackage> packages = new PackageList(this).getPackages();

       // Add this line.
       packages.add(new CustomDevMenuExtensionPackage());

       return packages;
     }
   }
   ```

  </details>

  <details>
  <summary>🍏 iOS</summary>

1. Create a Swift class which implements `DevMenuExtensionProtocol` for your extension.

   ```swift
   // CustomDevMenuExtension.swift
   import EXDevMenuInterface

   @objc(CustomDevMenuExtension)
   open class CustomDevMenuExtension: NSObject, RCTBridgeModule, DevMenuExtensionProtocol {
     public static func moduleName() -> String! {
       return "CustomDevMenuExtension" // here you can provide name for your extension
     }

     @objc
     open func devMenuItems() -> [DevMenuItem]? {
       // Firstly, create a function which will be called when the user presses the button.
       let clearNSUserDefaultsOnPress = {
         let prefs = UserDefaults.standard
         prefs.removeObject(forKey: "key_to_remove")
       }

       let clearNSUserDefaults = DevMenuAction(
         withId: "clear_nsusersdefaults", // This string identifies your custom action. Make sure that it's unique.
         action: clearNSUserDefaultsOnPress
       )

       clearNSUserDefaults.label = { "Clear NSUserDefaults" } // This string will be displayed in the dev menu.
       clearNSUserDefaults.glyphName = { "delete" } // This is a icon name used to present your action. You can use any icon from the `MaterialCommunityIcons`.
       clearNSUserDefaults.importance = DevMenuItem.ImportanceHigh // This value tells the dev-menu in which order the actions should be rendered.
       clearNSUserDefaults.registerKeyCommand(input: "p", modifiers: .command) // You can associate key commend with your action.

       // Return created object. Note: you can register multiple actions if you want.
       return [clearNSUserDefaults]
     }
   }
   ```

   > **Note:** if you don't use Swift in your project earlier, you need to create bridging header. For more information, checks [importing objective-c into swift](https://developer.apple.com/documentation/swift/imported_c_and_objective-c_apis/importing_objective-c_into_swift).

2. Create a `.m` file to integrate Swift class with react native and add the following lines.

   ```objc
   // CustomDevMenuExtension.m

   #import <React/RCTBridgeModule.h>

   @interface RCT_EXTERN_REMAP_MODULE(CustomDevMenuExtensionObjc, CustomDevMenuExtension, NSObject)
   @end
   ```

3. Add the following line into the bridging header.

   ```objc
   #import <React/RCTBridgeModule.h>
   ```

  </details>

After all those steps you should see something like this:

![Final result](custom_dev_menu_extension_example.png)

# 📚 API

```js
import * as DevMenu from 'expo-dev-menu';
```

For now, the `DevMenu` module exports only one method - [`openMenu`](#openmenu).

### openMenu()

Opens the dev menu.

#### Example

Using this method you can open the dev menu from your JS code whenever you want. It does nothing when the dev menu is not available (i.e. in release mode).

Below you can find an example of opening the dev menu on button press:

```js
import * as DevMenu from 'expo-dev-menu';
import { Button } from 'react-native';

export const DevMenuButton = () => (
  <Button
    onPress={() => {
      DevMenu.openMenu();
    }}
    title="Press to open the dev menu 🚀"
    color="#841584"
  />
);
```

# 👏 Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
