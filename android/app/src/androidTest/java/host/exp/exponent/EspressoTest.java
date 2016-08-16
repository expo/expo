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
import android.test.suitebuilder.annotation.LargeTest;
import android.widget.Switch;

import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import java.util.concurrent.TimeUnit;

import host.exp.exponent.generated.TestBuildConstants;
import host.exp.exponent.utils.ElapsedTimeIdlingResource;
import host.exp.exponent.utils.LoadingScreenIdlingResource;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.action.ViewActions.click;
import static android.support.test.espresso.action.ViewActions.typeText;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isEnabled;
import static host.exp.exponent.utils.ExponentMatchers.withTestId;
import static host.exp.exponent.utils.ExponentScrollToAction.exponentScrollTo;

@RunWith(AndroidJUnit4.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
@LargeTest
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
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
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

    // Launch the app
    Context context = InstrumentationRegistry.getContext();
    final Intent intent = context.getPackageManager().getLaunchIntentForPackage("host.exp.exponent");
    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
    context.startActivity(intent);

    // Wait for the app to appear
    sUiDevice.wait(Until.hasObject(By.pkg("host.exp.exponent").depth(0)), LAUNCH_TIMEOUT);

    // Setup Espresso
    mLoadingScreenIdlingResource = new LoadingScreenIdlingResource();
    mElapsedTimeIdlingResource = new ElapsedTimeIdlingResource();
    Espresso.registerIdlingResources(mLoadingScreenIdlingResource, mElapsedTimeIdlingResource);
  }

  @After
  public void after() {
    Espresso.unregisterIdlingResources(mLoadingScreenIdlingResource, mElapsedTimeIdlingResource);
  }

  // This test needs to run first to clear the nux so prefix with "aaa". Gross but easiest way to handle this without
  // injecting JS code.
  @Test
  public void aaa_nux() {
    onView(withTestId("first_nux_experience")).perform(click());
    mElapsedTimeIdlingResource.sleep(3000);
    onView(withTestId("nux_no_thanks")).perform(click());
  }

  @Test
  public void movies() {
    onView(withTestId("url_bar")).check(matches(isEnabled())).perform(exponentScrollTo(), typeText("exp://exp.host/@reactnative/movies"));
    onView(withTestId("go_button")).perform(click());
  }

  @Test
  public void showcase() {
    if (TestBuildConstants.SHOWCASE_URL == null) {
      return;
    }

    onView(withTestId("url_bar")).perform(exponentScrollTo(), typeText(TestBuildConstants.SHOWCASE_URL));
    onView(withTestId("go_button")).perform(click());

    // Check to make sure we actually loaded it
    onView(withTestId("exponent_showcase")).check(matches(isEnabled()));
  }

  @Test
  public void template() {
    if (TestBuildConstants.TEMPLATE_PROJECT_URL == null) {
      return;
    }

    onView(withTestId("url_bar")).perform(exponentScrollTo(), typeText(TestBuildConstants.TEMPLATE_PROJECT_URL));
    onView(withTestId("go_button")).perform(click());

    // TODO: Check to make sure we actually loaded it
    // onView(withTestId("exponent_showcase")).check(matches(isEnabled()));
  }

  @Test
  public void publishedTemplate() {
    if (TestBuildConstants.TEMPLATE_PROJECT_PUBLISHED_URL == null) {
      return;
    }

    onView(withTestId("url_bar")).perform(exponentScrollTo(), typeText(TestBuildConstants.TEMPLATE_PROJECT_PUBLISHED_URL));
    onView(withTestId("go_button")).perform(click());

    // TODO: Check to make sure we actually loaded it
    // onView(withTestId("exponent_showcase")).check(matches(isEnabled()));
  }
}
