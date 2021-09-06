package com.testrunner;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.matcher.ViewMatchers.isRoot;
import static androidx.test.platform.app.InstrumentationRegistry.getInstrumentation;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.view.View;
import android.view.ViewGroup;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import expo.modules.devlauncher.DevLauncherController;
import expo.modules.devlauncher.launcher.DevLauncherActivity;
import expo.modules.devmenu.DevMenuManager;

// We need this class to pass dev launcher host to detox.
// Otherwise it won't detect that the app has been started.
class ReactNativeHolder extends ContextWrapper implements ReactApplication {
  public ReactNativeHolder(Context base) {
    super(base);
  }

  @Override
  public ReactNativeHost getReactNativeHost() {
    return DevLauncherController.getInstance().getDevClientHost();
  }
}

class DevClientDetoxHelper {
  public static Activity getCurrentActivity() {
    final Activity[] activity = new Activity[1];

    onView(isRoot()).check((view, noViewFoundException) -> {

      View checkedView = view;

      while (checkedView instanceof ViewGroup && ((ViewGroup) checkedView).getChildCount() > 0) {

        checkedView = ((ViewGroup) checkedView).getChildAt(0);

        if (checkedView.getContext() instanceof Activity) {
          activity[0] = (Activity) checkedView.getContext();
          return;
        }
      }
    });
    return activity[0];
  }

  public static void openMenu() throws InterruptedException {
    getInstrumentation().waitForIdleSync();
    Activity activity = getCurrentActivity();
    int counter = 10;
    while (counter-- > 0 && activity == null) {
      Thread.sleep(100);
      activity = getCurrentActivity();
    }

    DevMenuManager.INSTANCE.openMenu(activity, null);
  }
}

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
  @Rule
  public ActivityTestRule<DevLauncherActivity> mActivityRule = new ActivityTestRule<>(DevLauncherActivity.class, false, false);

  @Test
  public void runDetoxTests() {
    DetoxConfig detoxConfig = new DetoxConfig();
    detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
    detoxConfig.rnContextLoadTimeoutSec = 180;

    ReactNativeHolder reactNativeHolder = new ReactNativeHolder(getInstrumentation().getTargetContext().getApplicationContext());
    Detox.runTests(mActivityRule, reactNativeHolder, detoxConfig);
  }
}
