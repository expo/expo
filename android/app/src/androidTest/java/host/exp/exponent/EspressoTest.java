// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.espresso.IdlingPolicies;
import android.support.test.espresso.IdlingResource;
import android.support.test.runner.AndroidJUnit4;
import android.support.test.uiautomator.By;
import android.support.test.uiautomator.UiDevice;
import android.support.test.uiautomator.Until;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import java.util.concurrent.TimeUnit;

import host.exp.exponent.generated.ExponentBuildConstants;
import host.exp.exponent.kernel.KernelConfig;
import host.exp.exponent.utils.ElapsedTimeIdlingResource;
import host.exp.exponent.utils.JSTestRunnerIdlingResource;
import host.exp.exponent.utils.LoadingScreenIdlingResource;
import host.exp.exponent.utils.TestNativeModuleServer;

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
  private JSTestRunnerIdlingResource mJSTestRunnerIdlingResource;

  @BeforeClass
  public static void enableDrawOverOtherApps() {
    KernelConfig.IS_TEST = true;
    KernelConfig.FORCE_NO_KERNEL_DEBUG_MODE = true;
    KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES = true;
    KernelConfig.HIDE_NUX = true;

    sUiDevice = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    TestNativeModuleServer.getInstance().setUiDevice(sUiDevice);

    // Increase Espresso timeout
    IdlingPolicies.setMasterPolicyTimeout(3, TimeUnit.MINUTES);
    IdlingPolicies.setIdlingResourceTimeout(3, TimeUnit.MINUTES);
  }

  @Before
  public void before() {
    // Setup Espresso
    mLoadingScreenIdlingResource = new LoadingScreenIdlingResource();
    mElapsedTimeIdlingResource = new ElapsedTimeIdlingResource();
    mJSTestRunnerIdlingResource = new JSTestRunnerIdlingResource();
    Espresso.registerIdlingResources(mLoadingScreenIdlingResource, mElapsedTimeIdlingResource, mJSTestRunnerIdlingResource);

    try {
      // Add contacts
      Context context = InstrumentationRegistry.getContext();
      Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("exppreparetestsapp://blahblahblah"));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      context.startActivity(intent);
      sUiDevice.wait(Until.hasObject(By.pkg("host.exp.preparetestsapp").depth(0)), LAUNCH_TIMEOUT);
    } catch (Throwable e) {
      // Don't worry if this isn't installed. Probably means it's running on a developer's device
      // and they already have contacts.
    }

    // Press home
    sUiDevice.pressHome();
    final String launcherPackage = sUiDevice.getLauncherPackageName();
    sUiDevice.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), LAUNCH_TIMEOUT);
  }

  @After
  public void after() {
    Espresso.unregisterIdlingResources(mLoadingScreenIdlingResource, mElapsedTimeIdlingResource, mJSTestRunnerIdlingResource);
  }

  @Test
  public void testSuite() {
    // Launch the app
    Context context = InstrumentationRegistry.getContext();
    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(ExponentBuildConstants.TEST_APP_URI));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    context.startActivity(intent);

    // Wait for the app to appear
    sUiDevice.wait(Until.hasObject(By.pkg("host.exp.exponent").depth(0)), LAUNCH_TIMEOUT);

    // Need this to wait on idling resources
    onView(withTestId("test_suite_container")).check(matches(isEnabled()));

    String result = mJSTestRunnerIdlingResource.getTestResult();
    try {
      JSONObject object = new JSONObject(result);

      int numFailed = object.getInt("failed");
      if (numFailed > 0) {
        throw new AssertionError(numFailed + " JS test(s) failed");
      }
    } catch (JSONException e) {
      throw new AssertionError("JSON error " + e.toString());
    }
  }
}
