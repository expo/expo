package dev.expo.baresandbox;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

import expo.modules.devlauncher.DevLauncherController;
import expo.modules.devmenu.react.DevMenuAwareReactActivity;
import expo.modules.splashscreen.SplashScreenImageResizeMode;
import expo.modules.splashscreen.singletons.SplashScreen;


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
    return DevLauncherController.wrapReactActivityDelegate(this, () -> new ReactActivityDelegate(this, getMainComponentName()) {
      @Override
      protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
        // SplashScreen.show(...) has to be called after super.onCreate(...)
        // Below line is handled by '@expo/configure-splash-screen' command and it's discouraged to modify it manually
        SplashScreen.show(getPlainActivity(), SplashScreenImageResizeMode.CONTAIN, ReactRootView.class, false);
      }
    });
  }
}
