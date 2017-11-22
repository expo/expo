// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.runner.AndroidJUnit4;
import android.support.test.uiautomator.By;
import android.support.test.uiautomator.Until;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.FixMethodOrder;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.RuleChain;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import host.exp.exponent.generated.ExponentBuildConstants;
import host.exp.exponent.kernel.KernelConfig;
import host.exp.exponent.utils.ElapsedTimeIdlingResource;
import host.exp.exponent.utils.JSTestRunnerIdlingResource;
import host.exp.exponent.utils.LoadingScreenIdlingResource;
import host.exp.exponent.utils.RetryTestRule;
import host.exp.exponent.utils.TestReporterRule;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isEnabled;
import static host.exp.exponent.utils.ExponentMatchers.withTestId;

@RunWith(AndroidJUnit4.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class TestSuiteTests extends BaseTestClass {

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

    KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES = false;
  }

  @After
  public void after() {
    Espresso.unregisterIdlingResources(mLoadingScreenIdlingResource, mElapsedTimeIdlingResource, mJSTestRunnerIdlingResource);

    KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES = false;
  }

  public static boolean isCurrentTestSuiteAvailable() {
    return !ExponentBuildConstants.TEST_APP_URI.equals("");
  }

  private void runTestSuiteTest(final String testSuiteUri) {
    // Launch the app
    Context context = InstrumentationRegistry.getContext();
    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(testSuiteUri));
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
      testReporterRule.logTestInfo(object.getString("results"));

      if (numFailed > 0) {
        throw new AssertionError(numFailed + " JS test(s) failed");
      }
    } catch (JSONException e) {
      throw new AssertionError("JSON error " + e.toString());
    }
  }

  private TestReporterRule testReporterRule = new TestReporterRule();

  @Rule
  public RuleChain chain = RuleChain.outerRule(testReporterRule).around(new RetryTestRule(2));

  @Test
  public void sdkUnversionedTestSuite() {
    if (!isCurrentTestSuiteAvailable()) {
      return;
    }

    KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES = true;
    runTestSuiteTest(ExponentBuildConstants.TEST_APP_URI);
  }
/*
  @Test
  public void sdk22TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-22-0-0");
  }
*/
  @Test
  public void sdk21TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-21-0-0");
  }

  @Test
  public void sdk20TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-20-0-0");
  }

  @Test
  public void sdk19TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-19-0-0");
  }

  @Test
  public void sdk18TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-18-0-0");
  }
}
