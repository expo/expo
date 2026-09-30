package expo.modules

import android.content.pm.PackageManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.soloader.SoLoader
import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(application = MockApplication::class)
internal class ReactActivityDelegateWrapperLocalNetworkPermissionTest {
  private lateinit var activityController: ActivityController<MockActivity>
  private val activity: MockActivity
    get() = activityController.get()
  private val wrapper: ReactActivityDelegateWrapper
    get() = activity.reactActivityDelegate as ReactActivityDelegateWrapper

  @OptIn(ExperimentalCoroutinesApi::class)
  @Before
  fun setUp() {
    SoLoader.setInTestMode()
    mockkObject(ExpoModulesPackage.Companion)
    every { ExpoModulesPackage.Companion.packageList } returns listOf(MockPackageWithoutDelayHandler())
    ReactNativeFeatureFlagsForTests.setUp()
    mockkStatic(ReactNativeFeatureFlags::class)
    every { ReactNativeFeatureFlags.enableBridgelessArchitecture() } returns true
    Dispatchers.setMain(UnconfinedTestDispatcher())
    mockkObject(LocalNetworkPermission)
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  private fun launchActivity() {
    activityController = Robolectric.buildActivity(MockActivity::class.java)
      .also { (it.get().application as MockApplication).bindCurrentActivity(it.get()) }
      .setup()
  }

  private fun verifyLoadApp(times: Int) {
    verify(exactly = times) { wrapper.invokeDelegateMethod("loadApp", arrayOf(String::class.java), arrayOf("main")) }
  }

  @Test
  fun `requests the local network permission before loading the app`() {
    every { LocalNetworkPermission.shouldRequest(any()) } returns true

    launchActivity()

    verifyLoadApp(0)
    val request = shadowOf(activity).lastRequestedPermission
    assertThat(request.requestedPermissions.toList()).containsExactly(LocalNetworkPermission.PERMISSION)

    activity.onRequestPermissionsResult(request.requestCode, request.requestedPermissions, intArrayOf(PackageManager.PERMISSION_GRANTED))

    verifyLoadApp(1)
  }

  @Test
  fun `loads the app when the local network permission is denied`() {
    every { LocalNetworkPermission.shouldRequest(any()) } returns true

    launchActivity()
    val request = shadowOf(activity).lastRequestedPermission
    activity.onRequestPermissionsResult(request.requestCode, request.requestedPermissions, intArrayOf(PackageManager.PERMISSION_DENIED))

    verifyLoadApp(1)
  }

  @Test
  fun `loads the app immediately when the permission is not required`() {
    every { LocalNetworkPermission.shouldRequest(any()) } returns false

    launchActivity()

    assertThat(shadowOf(activity).lastRequestedPermission).isNull()
    verifyLoadApp(1)
  }
}
