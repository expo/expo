import { vol } from 'memfs';

import { ResizeMode } from '../../constants';
import configureMainActivity from '../MainActivity';
import reactNativeProject from './fixtures/react-native-project-structure';

jest.mock('fs');

describe('MainActivity', () => {
  describe('configureMainActivity', () => {
    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
    });
    afterEach(() => {
      vol.reset();
    });

    describe('MainActivity.java', () => {
      const projectRootPath = '/app';
      const filePath = '/app/android/app/src/main/java/com/reactnativeproject/MainActivity.java';

      it('inserts onCreate() with SplashScreen registration', async () => {
        await configureMainActivity(projectRootPath, ResizeMode.CONTAIN);
        const actual = vol.readFileSync(filePath, 'utf-8');
        const expected = `package com.reactnativeproject;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactRootView;

import expo.modules.splashscreen.SplashScreen;
import expo.modules.splashscreen.SplashScreenImageResizeMode;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // SplashScreen.show(...) has to be called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.CONTAIN, ReactRootView.class);
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "react-native-project";
  }
}
`;
        expect(actual).toEqual(expected);
      });

      it('adds SplashScreen registration to onCreate()', async () => {
        vol.writeFileSync(
          filePath,
          `package com.reactnativeproject;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactRootView;

public class MainActivity extends ReactActivity {
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "react-native-project";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
  }
}
`
        );
        await configureMainActivity(projectRootPath, ResizeMode.CONTAIN);
        const actual = vol.readFileSync(filePath, 'utf-8');
        const expected = `package com.reactnativeproject;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactRootView;

import expo.modules.splashscreen.SplashScreen;
import expo.modules.splashscreen.SplashScreenImageResizeMode;

public class MainActivity extends ReactActivity {
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "react-native-project";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // SplashScreen.show(...) has to be called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.CONTAIN, ReactRootView.class);
  }
}
`;
        expect(actual).toEqual(expected);
      });

      describe('reconfigures SplashScreen mode', () => {
        it('NATIVE', async () => {
          vol.writeFileSync(
            filePath,
            `package com.reactnativeproject;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactRootView;

import expo.modules.splashscreen.SplashScreen;
import expo.modules.splashscreen.SplashScreenImageResizeMode;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // SplashScreen.show(...) has to called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.CONTAIN, ReactRootView.class);
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "react-native-project";
  }
}
`
          );
          await configureMainActivity(projectRootPath, ResizeMode.NATIVE);
          const actual = vol.readFileSync(filePath, 'utf-8');
          const expected = `package com.reactnativeproject;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactRootView;

import expo.modules.splashscreen.SplashScreen;
import expo.modules.splashscreen.SplashScreenImageResizeMode;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // SplashScreen.show(...) has to called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.NATIVE, ReactRootView.class);
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "react-native-project";
  }
}
`;
          expect(actual).toEqual(expected);
        });
      });
    });

    describe('MainActivity.kt', () => {
      const projectRootPath = '/app';
      const filePathJava =
        '/app/android/app/src/main/java/com/reactnativeproject/MainActivity.java';
      const filePath = '/app/android/app/src/main/java/com/reactnativeproject/MainActivity.kt';

      beforeEach(() => {
        vol.unlinkSync(filePathJava);
        vol.writeFileSync(
          filePath,
          `package com.reactnativeproject

import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String {
    return "react-native-project"
  }
}
`
        );
      });

      it('inserts onCreate() with SplashScreen registration', async () => {
        await configureMainActivity(projectRootPath, ResizeMode.CONTAIN);
        const actual = vol.readFileSync(filePath, 'utf-8');
        const expected = `package com.reactnativeproject

import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactRootView

import expo.modules.splashscreen.SplashScreen
import expo.modules.splashscreen.SplashScreenImageResizeMode

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // SplashScreen.show(...) has to be called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.CONTAIN, ReactRootView::class.java)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String {
    return "react-native-project"
  }
}
`;
        expect(actual).toEqual(expected);
      });

      it('adds SplashScreen registration to onCreate()', async () => {
        vol.writeFileSync(
          filePath,
          `package com.reactnativeproject

import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactRootView

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String {
    return "react-native-project"
  }
}
`
        );
        await configureMainActivity(projectRootPath, ResizeMode.CONTAIN);
        const actual = vol.readFileSync(filePath, 'utf-8');
        const expected = `package com.reactnativeproject

import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactRootView

import expo.modules.splashscreen.SplashScreen
import expo.modules.splashscreen.SplashScreenImageResizeMode

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // SplashScreen.show(...) has to be called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.CONTAIN, ReactRootView::class.java)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String {
    return "react-native-project"
  }
}
`;
        expect(actual).toEqual(expected);
      });

      describe('reconfigures SplashScreen mode', () => {
        it('NATIVE', async () => {
          vol.writeFileSync(
            filePath,
            `package com.reactnativeproject

import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactRootView

import expo.modules.splashscreen.SplashScreen
import expo.modules.splashscreen.SplashScreenImageResizeMode

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // SplashScreen.show(...) has to be called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.CONTAIN, ReactRootView::class.java)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String {
    return "react-native-project"
  }
}
`
          );
          await configureMainActivity(projectRootPath, ResizeMode.NATIVE);
          const actual = vol.readFileSync(filePath, 'utf-8');
          const expected = `package com.reactnativeproject

import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactRootView

import expo.modules.splashscreen.SplashScreen
import expo.modules.splashscreen.SplashScreenImageResizeMode

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // SplashScreen.show(...) has to be called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.NATIVE, ReactRootView::class.java)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String {
    return "react-native-project"
  }
}
`;
          expect(actual).toEqual(expected);
        });
      });
    });
  });
});
