package dev.expo.payments;

import android.os.Bundle;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import org.jetbrains.annotations.Nullable;

import expo.modules.developmentclient.DevelopmentClientController;
import expo.modules.devmenu.react.DevMenuAwareReactActivity;

public class MainActivity extends DevMenuAwareReactActivity {

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
    ReactActivityDelegate delegate = new ReactActivityDelegate(this, getMainComponentName()) {
      @Override
      protected ReactRootView createRootView() {
        RNGestureHandlerEnabledRootView view = new RNGestureHandlerEnabledRootView(MainActivity.this);
        if (MainApplication.USE_DEV_CLIENT) {
          DevelopmentClientController.getInstance().setRootView(view);
        }
        return view;
      }
    };
    DevelopmentClientController.getInstance().registerReactActivityDelegate(delegate);
    return delegate;
  }

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    DevelopmentClientController.getInstance().registerActivity(this);
  }
}
