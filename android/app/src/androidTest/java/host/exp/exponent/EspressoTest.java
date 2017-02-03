// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.espresso.IdlingPolicies;
import android.support.test.espresso.IdlingResource;
import android.support.test.runner.AndroidJUnit4;
import android.support.test.uiautomator.By;
import android.support.test.uiautomator.UiDevice;
import android.support.test.uiautomator.UiObject;
import android.support.test.uiautomator.UiObjectNotFoundException;
import android.support.test.uiautomator.UiSelector;
import android.support.test.uiautomator.Until;
import android.widget.Switch;

import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import java.util.concurrent.TimeUnit;

import host.exp.exponent.experience.BaseExperienceActivity;
import host.exp.exponent.utils.ElapsedTimeIdlingResource;
import host.exp.exponent.utils.LoadingScreenIdlingResource;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isEnabled;
import static host.exp.exponent.utils.ExponentMatchers.withTestId;

@RunWith(AndroidJUnit4.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class EspressoTest {

  private static final int LAUNCH_TIMEOUT = 5000;

  private static UiDevice sUiDevice;

  private IdlingResource mLoadingScreenIdlingResource;
  private ElapsedTimeIdlingResource mElapsedTimeIdlingResource;

  @BeforeClass
  public static void enableDrawOverOtherApps() {
    sUiDevice = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());

    // Start from the home screen
    sUiDevice.pressHome();

    // Wait for launcher
    final String launcherPackage = sUiDevice.getLauncherPackageName();
    sUiDevice.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), LAUNCH_TIMEOUT);

    // Enable draw over other apps if necessary
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(InstrumentationRegistry.getTargetContext())) {
      // Open settings
      Context context = InstrumentationRegistry.getContext();
      Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:host.exp.exponent"));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
      context.startActivity(intent);

      // Wait for the app to appear
      sUiDevice.wait(Until.hasObject(By.textContains("Permit drawing over other apps")), LAUNCH_TIMEOUT);

      UiObject switchObject = sUiDevice.findObject(new UiSelector().className(Switch.class.getName()));
      try {
        if (!switchObject.isChecked()) {
          switchObject.click();
        }
      } catch (UiObjectNotFoundException e) {
        e.printStackTrace();
      }
    }

    // Increase Espresso timeout
    IdlingPolicies.setMasterPolicyTimeout(3, TimeUnit.MINUTES);
    IdlingPolicies.setIdlingResourceTimeout(3, TimeUnit.MINUTES);
  }

  @Before
  public void before() {
    // Start from the home screen
    sUiDevice.pressHome();

    // Wait for launcher
    final String launcherPackage = sUiDevice.getLauncherPackageName();
    sUiDevice.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), LAUNCH_TIMEOUT);

    // Setup Espresso
    mLoadingScreenIdlingResource = new LoadingScreenIdlingResource();
    mElapsedTimeIdlingResource = new ElapsedTimeIdlingResource();
    Espresso.registerIdlingResources(mLoadingScreenIdlingResource, mElapsedTimeIdlingResource);
  }

  @After
  public void after() {
    Espresso.unregisterIdlingResources(mLoadingScreenIdlingResource, mElapsedTimeIdlingResource);
  }

  @Test
  public void nativeComponentList() {
    // Launch the app
    Context context = InstrumentationRegistry.getContext();
    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("exp://jh-cqd.jesse.native-component-list.exp.direct:80"));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    context.startActivity(intent);

    // Wait for the app to appear
    sUiDevice.wait(Until.hasObject(By.pkg("host.exp.exponent").depth(0)), LAUNCH_TIMEOUT);

    // Check to make sure we actually loaded it
    onView(withTestId("native_component_list")).check(matches(isEnabled()));
  }
}
