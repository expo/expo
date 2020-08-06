package dev.expo.payments;

import android.os.Bundle;
import android.view.KeyEvent;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import java.util.UUID;

import expo.modules.devmenu.managers.DevMenuManager;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "BareExpo";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName()) {
      @Override
      protected ReactRootView createRootView() {
        return new RNGestureHandlerEnabledRootView(MainActivity.this);
      }

      protected Bundle getLaunchOptions() {
        Bundle bundle = new Bundle();
        bundle.putBoolean("enableDevelopmentTools", true);
        bundle.putBoolean("showOnboardingView", false);
        bundle.putParcelableArray("devMenuItems", new Bundle[0]);
        bundle.putString("uuid", UUID.randomUUID().toString());
        return bundle;
      }
    };
  }

  @Override
  protected void onResume() {
    super.onResume();
  }

  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
    switch (keyCode) {
      case KeyEvent.KEYCODE_T:
        DevMenuManager.INSTANCE.openMenu(this);
        return true;
    }
    return super.onKeyDown(keyCode, event);
  }
}
