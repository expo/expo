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

1.  Add the `dev-menu` to the android project.

    I. Open `settings.gradle` and add the following lines:

    ```gradle
    include(":expo-dev-menu")
    project(":expo-dev-menu").projectDir = new File("../node_modules/expo-dev-menu/android")

    include(":expo-dev-menu-interface")
    project(":expo-dev-menu-interface").projectDir = new File("../node_modules/expo-dev-menu-interface/android")
    ```

    II. Go to the `build.gradle` of your application and add `expo-dev-menu` as a dependency:

    ```gradle
    dependencies {
      ...
      implementation project(":expo-dev-menu-interface")
      implementation project(":expo-dev-menu")
      ...
    }
    ```

    > _Note_: You don't have to use `implementationDebug` to add `expo-dev-menu` only to the debug builds. This package will be removed from the release build automatically.

2.  Set up the `DevMenuManager` in the native code.

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
        // A function which sends the touch events to the dev menu.
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
        pod 'EXDevMenuInterface', path: '../node_modules/expo-dev-menu-interface'
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
   #if __has_include(<EXDevMenu/EXDevMenu-umbrella.h>)
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
     // Add those lines.
     #if __has_include(<EXDevMenu/EXDevMenu-umbrella.h>)
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
   #if canImport(EXDevMenu)
   import EXDevMenu
   #endif
   ...

   @UIApplicationMain
   class AppDelegate: UMAppDelegateWrapper {
     override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
       ...

       if let bridge = RCTBridge(delegate: self, launchOptions: launchOptions) {
         ...
         // Add those lines.
         #if canImport(EXDevMenu)
         DevMenuManager.configure(withBridge: bridge)
         #endif
       }

       ...
     }
   }
   ```

      </details>

# 👏 Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
