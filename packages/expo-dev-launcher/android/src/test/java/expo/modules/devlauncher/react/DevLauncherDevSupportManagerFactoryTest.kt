package expo.modules.devlauncher.react

import androidx.test.core.app.ApplicationProvider
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.google.common.truth.Truth.assertThat
import io.mockk.mockk
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherDevSupportManagerFactoryTest {
  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private fun createManager(useDevSupport: Boolean) =
    DevLauncherDevSupportManagerFactory().create(
      applicationContext = ApplicationProvider.getApplicationContext(),
      reactInstanceManagerHelper = mockk(relaxed = true),
      packagerPathForJSBundleName = "index",
      enableOnCreate = false,
      redBoxHandler = null,
      devBundleDownloadListener = null,
      minNumShakes = 2,
      customPackagerCommandHandlers = null,
      surfaceDelegateFactory = null,
      devLoadingViewManager = null,
      pausedInDebuggerOverlayManager = null,
      useDevSupport = useDevSupport
    )

  @Test
  fun `create returns launcher manager when dev support enabled`() {
    assertThat(createManager(useDevSupport = true))
      .isInstanceOf(DevLauncherBridgelessDevSupportManager::class.java)
  }

  @Test
  fun `create returns release manager when dev support disabled`() {
    assertThat(createManager(useDevSupport = false))
      .isInstanceOf(ReleaseDevSupportManager::class.java)
  }
}
