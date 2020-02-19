// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.test.InstrumentationRegistry;
import androidx.test.espresso.Espresso;
import androidx.test.rule.GrantPermissionRule;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.Until;

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

import static androidx.test.InstrumentationRegistry.getTargetContext;
import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isEnabled;
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
      if (object.has("results")) {
        testReporterRule.logTestInfo(object.getString("results"));
      }
      if (object.has("failures")) {
        testReporterRule.logTestInfo(object.getString("failures"));
      }

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
  public GrantPermissionRule permissionRule = GrantPermissionRule.grant(
      Manifest.permission.SYSTEM_ALERT_WINDOW, Manifest.permission.READ_CONTACTS,
      Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE,
      Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR
  );

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

  @Test
  @ExpoAlwaysPassThroughFilter
  public void junitIsSillyAndWillFailIfThereIsntOneTestRunPerFile() {
  }
}
