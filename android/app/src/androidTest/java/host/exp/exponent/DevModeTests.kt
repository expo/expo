package host.exp.exponent

import android.Manifest
import androidx.test.espresso.Espresso
import androidx.test.espresso.IdlingResource
import androidx.test.rule.GrantPermissionRule
import host.exp.exponent.annotations.ExpoAlwaysPassThroughFilter
import host.exp.exponent.utils.*
import org.junit.*
import org.junit.rules.RuleChain
import org.junit.runner.RunWith
import org.junit.runners.MethodSorters

@RunWith(ExpoTestRunner::class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class DevModeTests : BaseTestClass() {
  private lateinit var loadingScreenIdlingResource: IdlingResource

  @Before
  fun before() {
    // Setup Espresso
    loadingScreenIdlingResource = LoadingScreenIdlingResource()
    Espresso.registerIdlingResources(loadingScreenIdlingResource)
  }

  @After
  fun after() {
    Espresso.unregisterIdlingResources(loadingScreenIdlingResource)
  }

  @Rule
  @JvmField
  val chain: RuleChain = RuleChain.outerRule(TestReporterRule()).around(RetryTestRule(3))

  @Rule
  @JvmField
  val permissionRule: GrantPermissionRule = GrantPermissionRule.grant(Manifest.permission.SYSTEM_ALERT_WINDOW)

  @Test
  @ExpoAlwaysPassThroughFilter
  fun junitIsSillyAndWillFailIfThereIsntOneTestRunPerFile() {
  }

  companion object {
    @BeforeClass
    @JvmStatic
    fun beforeClass() {
      BaseTestClass.beforeClass()
    }
  }
}
