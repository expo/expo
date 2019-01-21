// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.rule.GrantPermissionRule;
import android.support.test.uiautomator.By;
import android.support.test.uiautomator.Until;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.FixMethodOrder;
import org.junit.Ignore;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.RuleChain;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import host.exp.exponent.annotations.ExpoAlwaysPassThroughFilter;
import host.exp.exponent.annotations.ExpoSdkVersionTest;
import host.exp.exponent.annotations.ExpoTestSuiteTest;
import host.exp.exponent.generated.ExponentBuildConstants;
import host.exp.exponent.kernel.KernelConfig;
import host.exp.exponent.utils.ElapsedTimeIdlingResource;
import host.exp.exponent.utils.ExpoTestRunner;
import host.exp.exponent.utils.JSTestRunnerIdlingResource;
import host.exp.exponent.utils.LoadingScreenIdlingResource;
import host.exp.exponent.utils.RetryTestRule;
import host.exp.exponent.utils.TestConfig;
import host.exp.exponent.utils.TestContacts;
import host.exp.exponent.utils.TestReporterRule;

import static android.support.test.InstrumentationRegistry.getTargetContext;
import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isEnabled;
import static host.exp.exponent.utils.ExponentMatchers.withTestId;

@RunWith(ExpoTestRunner.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class TestSuiteTests extends BaseTestClass {

  private boolean mHaveContactsBeenAdded = false;

  private void ensureContactsAdded() {
    if (mHaveContactsBeenAdded) {
      return;
    }
    mHaveContactsBeenAdded = true;
    TestContacts.add(getTargetContext());
  }

  @BeforeClass
  public static void beforeClass() {
    BaseTestClass.beforeClass();

    // Press home
    sUiDevice.pressHome();
    final String launcherPackage = sUiDevice.getLauncherPackageName();
    sUiDevice.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), LAUNCH_TIMEOUT);
  }

  @Before
  public void before() {
    // Setup Espresso
    mLoadingScreenIdlingResource = new LoadingScreenIdlingResource();
    mElapsedTimeIdlingResource = new ElapsedTimeIdlingResource();
    mJSTestRunnerIdlingResource = new JSTestRunnerIdlingResource();
    Espresso.registerIdlingResources(mLoadingScreenIdlingResource, mElapsedTimeIdlingResource, mJSTestRunnerIdlingResource);

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

  private void runTestSuiteTest(String testSuiteUriString, boolean shouldAddDeepLink) {
    Uri testSuiteUri = Uri.parse(testSuiteUriString);

    ensureContactsAdded();

    if (shouldAddDeepLink) {
      String deepLink = TestConfig.get().toString();
      testSuiteUri = Uri.withAppendedPath(testSuiteUri, "/--/" + deepLink);
    }

    // Launch the app
    Context context = InstrumentationRegistry.getContext();
    Intent intent = new Intent(Intent.ACTION_VIEW, testSuiteUri);
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

  @Rule
  public GrantPermissionRule permissionRule = GrantPermissionRule.grant(Manifest.permission.SYSTEM_ALERT_WINDOW, Manifest.permission.READ_CONTACTS, Manifest.permission.ACCESS_COARSE_LOCATION
      , Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.WRITE_CONTACTS);

  @Test
  @ExpoTestSuiteTest
  @ExpoSdkVersionTest("UNVERSIONED")
  public void sdkUnversionedTestSuite() {
    if (!isCurrentTestSuiteAvailable()) {
      return;
    }

    KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES = true;
    runTestSuiteTest(ExponentBuildConstants.TEST_APP_URI, true);
  }

  @Ignore
  @Test
  @ExpoTestSuiteTest
  @ExpoSdkVersionTest("32.0.0")
  public void sdk32TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-32-0-0", false);
  }

  @Ignore
  @Test
  @ExpoTestSuiteTest
  @ExpoSdkVersionTest("31.0.0")
  public void sdk31TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-31-0-0", false);
  }

  @Ignore
  @Test
  @ExpoTestSuiteTest
  @ExpoSdkVersionTest("30.0.0")
  public void sdk30TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-30-0-0", false);
  }

  @Ignore
  @Test
  @ExpoTestSuiteTest
  @ExpoSdkVersionTest("28.0.0")
  public void sdk28TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-28-0-0", false);
  }

  @Ignore
  @Test
  @ExpoTestSuiteTest
  @ExpoSdkVersionTest("27.0.0")
  public void sdk27TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-27-0-0", false);
  }

  @Ignore
  @Test
  @ExpoTestSuiteTest
  @ExpoSdkVersionTest("26.0.0")
  public void sdk26TestSuite() {
    runTestSuiteTest("exp://exp.host/@exponent_ci_bot/test-suite-sdk-26-0-0", false);
  }

  @Test
  @ExpoAlwaysPassThroughFilter
  public void junitIsSillyAndWillFailIfThereIsntOneTestRunPerFile() {}
}
