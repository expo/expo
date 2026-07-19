// custom
package com.testrunner;

import android.content.Intent;

import expo.modules.devmenu.react.DevMenuAwareReactActivity;
import com.facebook.react.ReactActivityDelegate;

import expo.modules.ReactActivityDelegateWrapper;
import expo.modules.devlauncher.DevLauncherController;

public class MainActivity extends DevMenuAwareReactActivity {
  /**
  * Returns the name of the main component registered from JavaScript.
  * This is used to schedule rendering of the component.
  */
  @Override
  protected String getMainComponentName() {
    return "main";
  }

  @Override
  public void onNewIntent(Intent intent) {
    if (DevLauncherController.tryToHandleIntent(this, intent)) {
      return;
    }
    super.onNewIntent(intent);
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return DevLauncherController.wrapReactActivityDelegate(this, () -> new ReactActivityDelegateWrapper(
      this,
      new ReactActivityDelegate(
        this,
        getMainComponentName()
      )
    ));
  }
}
