package expo.modules.devlauncher.launcher.configurators

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.content.pm.ActivityInfo
import android.graphics.Color
import android.view.View
import android.view.Window
import android.view.WindowManager
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.ReactActivity
import com.google.common.truth.Truth
import expo.modules.devlauncher.launcher.manifest.DevLauncherNavigationBarStyle
import expo.modules.devlauncher.launcher.manifest.DevLauncherNavigationBarVisibility
import expo.modules.manifests.core.Manifest
import io.mockk.confirmVerified
import io.mockk.every
import io.mockk.excludeRecords
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.json.JSONObject
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherExpoActivityConfiguratorTest {

  private val context: Context = ApplicationProvider.getApplicationContext()

  @Config(sdk = [28])
  @Test
  fun `sets task description from manifest`() {
    val manifest = Manifest.fromManifestJson(JSONObject("{\"name\":\"test-app-name\",\"primaryColor\":\"#cccccc\",\"slug\":\"test-app-slug\",\"version\":\"1.0.0\",\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}"))
    val configurator = DevLauncherExpoActivityConfigurator(manifest, context)
    val mockActivity = mockk<Activity>(relaxed = true)
    val slot = slot<ActivityManager.TaskDescription>()

    configurator.applyTaskDescription(mockActivity)
    verify { mockActivity.setTaskDescription(capture(slot)) }
    confirmVerified(mockActivity) // no other calls were made

    Truth.assertThat(slot.captured.label).isEqualTo("test-app-name")
    Truth.assertThat(slot.captured.primaryColor).isEqualTo(Color.parseColor("#cccccc"))
  }

  @Test
  fun `does not set task description if manifest primaryColor is invalid`() {
    val manifest = Manifest.fromManifestJson(JSONObject("{\"name\":\"test-app-name\",\"primaryColor\":\"invalid\",\"slug\":\"test-app-slug\",\"version\":\"1.0.0\",\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}"))
    val configurator = DevLauncherExpoActivityConfigurator(manifest, context)
    val mockActivity = mockk<Activity>(relaxed = true)

    configurator.applyTaskDescription(mockActivity)
    confirmVerified(mockActivity) // no calls were made to mockActivity
  }

  @Test
  fun `sets orientation from manifest`() {
    verifyOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, "{\"orientation\":\"portrait\",\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    verifyOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE, "{\"orientation\":\"landscape\",\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    verifyOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED, "{\"orientation\":\"default\",\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    // orientation key missing
    verifyOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED, "{\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
  }

  private fun verifyOrientation(expectedOrientation: Int, manifestString: String) {
    val manifest = Manifest.fromManifestJson(JSONObject(manifestString))
    val configurator = DevLauncherExpoActivityConfigurator(manifest, context)
    val mockActivity = mockk<ReactActivity>(relaxed = true)

    configurator.applyOrientation(mockActivity)
    verify { mockActivity.requestedOrientation = expectedOrientation }
    confirmVerified(mockActivity) // no other calls were made
  }

  @Config(sdk = [23])
  @Test
  fun `sets status bar style from manifest`() {
    verifyStatusBar(true, Color.parseColor("#5523C1B2"), false, true, "{\"androidStatusBar\":{\"barStyle\":\"light-content\",\"backgroundColor\":\"#23C1B255\",\"translucent\":false,\"hidden\":true},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    verifyStatusBar(false, Color.parseColor("#cccccc"), true, false, "{\"androidStatusBar\":{\"barStyle\":\"dark-content\",\"backgroundColor\":\"#cccccc\",\"translucent\":true,\"hidden\":false},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    // invalid values
    verifyStatusBar(false, Color.TRANSPARENT, true, false, "{\"androidStatusBar\":{\"barStyle\":\"bad-value\",\"backgroundColor\":\"bad-color\"},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    // default values (empty object)
    verifyStatusBar(false, Color.TRANSPARENT, true, false, "{\"androidStatusBar\":{},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    // no androidStatusBar object
    verifyStatusBar(false, Color.TRANSPARENT, true, false, "{\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    // default backgroundColor for light-content
    verifyStatusBar(true, Color.parseColor("#88000000"), true, false, "{\"androidStatusBar\":{\"barStyle\":\"light-content\"},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
  }

  private fun verifyStatusBar(expectedLightStyle: Boolean, expectedColor: Int?, expectedTranslucent: Boolean, expectedHidden: Boolean, manifestString: String) {
    val mockActivity = mockk<ReactActivity>(relaxed = true)
    val mockWindow = mockk<Window>(relaxed = true)
    val mockDecorView = mockk<View>(relaxed = true)

    every { mockWindow.decorView } returns mockDecorView
    every { mockActivity.window } returns mockWindow

    val runOnUiThreadSlot = slot<Runnable>()
    every {
      mockActivity.runOnUiThread(capture(runOnUiThreadSlot))
    } answers {
      runOnUiThreadSlot.captured.run()
    }

    val manifest = Manifest.fromManifestJson(JSONObject(manifestString))
    val configurator = DevLauncherExpoActivityConfigurator(manifest, context)
    configurator.applyStatusBarConfiguration(mockActivity)

    every { mockDecorView.systemUiVisibility } returns 0
    verify { mockDecorView.systemUiVisibility = if (expectedLightStyle) 0 else 8192 }

    expectedColor?.let {
      verify { mockWindow.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS) }
      verify { mockWindow.statusBarColor = expectedColor }
    }

    verify { mockDecorView.setOnApplyWindowInsetsListener(isNull(inverse = expectedTranslucent)) }

    if (expectedHidden) {
      verify { mockWindow.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN) }
      verify { mockWindow.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN) }
    } else {
      verify { mockWindow.addFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN) }
      verify { mockWindow.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN) }
    }
  }

  @Config(sdk = [26])
  @Test
  fun `sets navigation bar style from manifest`() {
    // valid values
    verifyNavigationBar(DevLauncherNavigationBarStyle.DARK, Color.parseColor("#cccccc"), DevLauncherNavigationBarVisibility.LEANBACK, "{\"androidNavigationBar\":{\"barStyle\":\"dark-content\",\"backgroundColor\":\"#cccccc\",\"visible\":\"leanback\"},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    verifyNavigationBar(DevLauncherNavigationBarStyle.LIGHT, Color.parseColor("#000000"), DevLauncherNavigationBarVisibility.IMMERSIVE, "{\"androidNavigationBar\":{\"barStyle\":\"light-content\",\"backgroundColor\":\"#000000\",\"visible\":\"immersive\"},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
    verifyNavigationBar(DevLauncherNavigationBarStyle.LIGHT, Color.parseColor("#ABCDEF"), DevLauncherNavigationBarVisibility.STICKY_IMMERSIVE, "{\"androidNavigationBar\":{\"barStyle\":\"light-content\",\"backgroundColor\":\"#ABCDEF\",\"visible\":\"sticky-immersive\"},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")

    // invalid values
    verifyNavigationBar(null, null, "", "{\"androidNavigationBar\":{\"barStyle\":\"bad-value\",\"backgroundColor\":\"bad-color\",\"visible\":false},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")

    // no values
    verifyNavigationBar(null, null, null, "{\"androidNavigationBar\":{},\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")

    // no androidNavigationBar object
    verifyNavigationBar(null, null, null, "{\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"platforms\":[\"ios\",\"android\",\"web\"],\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F67b67696b1cab67319035d39a7379786-42.0.0-ios.js\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
  }

  private fun verifyNavigationBar(expectedStyle: String?, expectedColor: Int?, expectedVisibility: String?, manifestString: String) {
    val mockActivity = mockk<ReactActivity>(relaxed = true)
    val mockWindow = mockk<Window>(relaxed = true)
    val mockDecorView = mockk<View>(relaxed = true)

    every { mockWindow.decorView } returns mockDecorView
    every { mockActivity.window } returns mockWindow

    excludeRecords { mockWindow.decorView }
    excludeRecords { mockWindow.clearFlags(any()) }
    excludeRecords { mockWindow.addFlags(any()) }
    excludeRecords { mockDecorView.systemUiVisibility }

    val manifest = Manifest.fromManifestJson(JSONObject(manifestString))
    val configurator = DevLauncherExpoActivityConfigurator(manifest, context)
    configurator.applyNavigationBarConfiguration(mockActivity)

    every { mockDecorView.systemUiVisibility } returns 0

    expectedColor?.let {
      verify { mockWindow.navigationBarColor = expectedColor }
    }

    expectedStyle?.let {
      if (it == DevLauncherNavigationBarStyle.DARK) {
        verify { mockDecorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR }
      }
    }

    expectedVisibility?.let {
      when (it) {
        DevLauncherNavigationBarVisibility.LEANBACK ->
          verify { mockDecorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN) }
        DevLauncherNavigationBarVisibility.IMMERSIVE ->
          verify { mockDecorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_IMMERSIVE) }
        DevLauncherNavigationBarVisibility.STICKY_IMMERSIVE ->
          verify { mockDecorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY) }
        else -> verify { mockDecorView.systemUiVisibility = 0 }
      }
    }

    confirmVerified(mockWindow, mockDecorView)
  }
}
