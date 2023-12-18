// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.Manifest
import android.content.Intent
import android.net.Uri
import androidx.test.InstrumentationRegistry
import androidx.test.espresso.Espresso
import androidx.test.espresso.IdlingResource
import androidx.test.espresso.assertion.ViewAssertions
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.rule.GrantPermissionRule
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import host.exp.exponent.annotations.ExpoAlwaysPassThroughFilter
import host.exp.exponent.annotations.ExpoSdkVersionTest
import host.exp.exponent.annotations.ExpoTestSuiteTest
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.exponent.kernel.KernelConfig
import host.exp.exponent.utils.*
import org.json.JSONException
import org.json.JSONObject
import org.junit.*
import org.junit.rules.RuleChain
import org.junit.runner.RunWith
import org.junit.runners.MethodSorters

@RunWith(ExpoTestRunner::class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class TestSuiteTests : BaseTestClass() {
  private lateinit var loadingScreenIdlingResource: IdlingResource
  private lateinit var elapsedTimeIdlingResource: ElapsedTimeIdlingResource
  private lateinit var jsTestRunnerIdlingResource: JSTestRunnerIdlingResource

  @Before
  fun before() {
    loadingScreenIdlingResource = LoadingScreenIdlingResource()
    elapsedTimeIdlingResource = ElapsedTimeIdlingResource()
    jsTestRunnerIdlingResource = JSTestRunnerIdlingResource()
    Espresso.registerIdlingResources(
      loadingScreenIdlingResource,
      elapsedTimeIdlingResource,
      jsTestRunnerIdlingResource
    )
    KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES = false
  }

  @After
  fun after() {
    Espresso.unregisterIdlingResources(
      loadingScreenIdlingResource,
      elapsedTimeIdlingResource,
      jsTestRunnerIdlingResource
    )
    KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES = false
  }

  private var haveContactsBeenAdded = false
  private fun ensureContactsAdded() {
    if (haveContactsBeenAdded) {
      return
    }
    haveContactsBeenAdded = true
    TestContacts.add(InstrumentationRegistry.getTargetContext())
  }

  private fun runTestSuiteTest(testSuiteUriString: String, shouldAddDeepLink: Boolean) {
    var testSuiteUri = Uri.parse(testSuiteUriString)
    ensureContactsAdded()
    if (shouldAddDeepLink) {
      val deepLink = TestConfig.get().toString()
      testSuiteUri = Uri.withAppendedPath(testSuiteUri, "/--/$deepLink")
    }

    // Launch the app
    val context = InstrumentationRegistry.getContext()
    val intent = Intent(Intent.ACTION_VIEW, testSuiteUri)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)

    // Wait for the app to appear
    uiDevice.wait(Until.hasObject(By.pkg("host.exp.exponent").depth(0)), LAUNCH_TIMEOUT.toLong())

    // Need this to wait on idling resources
    Espresso.onView(ExponentMatchers.withTestId("test_suite_container"))
      .check(ViewAssertions.matches(ViewMatchers.isEnabled()))
    val result = jsTestRunnerIdlingResource.testResult
    try {
      val jsonObject = JSONObject(result)
      val numFailed = jsonObject.getInt("failed")
      if (jsonObject.has("results")) {
        testReporterRule.logTestInfo(jsonObject.getString("results"))
      }
      if (jsonObject.has("failures")) {
        testReporterRule.logTestInfo(jsonObject.getString("failures"))
      }
      if (numFailed > 0) {
        throw AssertionError("$numFailed JS test(s) failed")
      }
    } catch (e: JSONException) {
      throw AssertionError("JSON error $e")
    }
  }

  private val testReporterRule = TestReporterRule()

  @Rule
  @JvmField
  val chain: RuleChain = RuleChain.outerRule(testReporterRule).around(RetryTestRule(2))

  @Rule
  @JvmField
  val permissionRule: GrantPermissionRule = GrantPermissionRule.grant(
    Manifest.permission.SYSTEM_ALERT_WINDOW,
    Manifest.permission.READ_CONTACTS,
    Manifest.permission.ACCESS_COARSE_LOCATION,
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.READ_EXTERNAL_STORAGE,
    Manifest.permission.WRITE_EXTERNAL_STORAGE,
    Manifest.permission.READ_CALENDAR,
    Manifest.permission.WRITE_CALENDAR
  )

  @Test
  @ExpoTestSuiteTest
  @ExpoSdkVersionTest("UNVERSIONED")
  fun sdkUnversionedTestSuite() {
    if (!isCurrentTestSuiteAvailable) {
      return
    }
    KernelConfig.FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES = true
    runTestSuiteTest(ExponentBuildConstants.TEST_APP_URI, true)
  }

  @Test
  @ExpoAlwaysPassThroughFilter
  fun junitIsSillyAndWillFailIfThereIsntOneTestRunPerFile() {
  }

  companion object {
    @BeforeClass
    @JvmStatic
    fun beforeClass() {
      BaseTestClass.beforeClass()

      // Press home
      uiDevice.pressHome()
      val launcherPackage = uiDevice.launcherPackageName
      uiDevice.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), LAUNCH_TIMEOUT.toLong())
    }

    val isCurrentTestSuiteAvailable: Boolean
      get() = ExponentBuildConstants.TEST_APP_URI != ""
  }
}
