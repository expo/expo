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

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
   * you can specify the renderer you wish to use - the new renderer (Fabric) or the old renderer
   * (Paper).
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return DevLauncherController.wrapReactActivityDelegate(this, () -> new MainActivityDelegate(this, getMainComponentName()));
  }

  public static class MainActivityDelegate extends ReactActivityDelegate {
    public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
      super(activity, mainComponentName);
    }

    @Override
    protected ReactRootView createRootView() {
      ReactRootView reactRootView = new ReactRootView(getContext());
      // If you opted-in for the New Architecture, we enable the Fabric Renderer.
      reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
      return reactRootView;
    }

    @Override
    protected boolean isConcurrentRootEnabled() {
      // If you opted-in for the New Architecture, we enable Concurrent Root (i.e. React 18).
      // More on this on https://reactjs.org/blog/2022/03/29/react-v18.html
      return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    }
  }
}
