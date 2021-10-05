package dev.expo.baresandbox;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import expo.modules.devlauncher.DevLauncherController;
import expo.modules.devmenu.react.DevMenuAwareReactActivity;
import expo.modules.splashscreen.SplashScreenImageResizeMode;
import expo.modules.splashscreen.singletons.SplashScreen;
import expo.modules.ReactActivityDelegateWrapper;


public class MainActivity extends DevMenuAwareReactActivity {

  @Override
  public void onNewIntent(Intent intent) {
    if (DevLauncherController.tryToHandleIntent(this, intent)) {
      return;
    }
    super.onNewIntent(intent);
  }

  // Added automatically by Expo Config
  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    Intent intent = new Intent("onConfigurationChanged");
    intent.putExtra("newConfig", newConfig);
    sendBroadcast(intent);
  }

  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "main";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    Activity activity = this;
    ReactActivityDelegate delegate = new ReactActivityDelegateWrapper(this,
      new ReactActivityDelegate(this, getMainComponentName()) {
      @Override
      protected ReactRootView createRootView() {
        return new RNGestureHandlerEnabledRootView(MainActivity.this);
      }

      @Override
      protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
      }
    });

    if (MainApplication.USE_DEV_CLIENT) {
      return DevLauncherController.wrapReactActivityDelegate(this, () -> delegate);
    }

    return delegate;
  }
  
}
