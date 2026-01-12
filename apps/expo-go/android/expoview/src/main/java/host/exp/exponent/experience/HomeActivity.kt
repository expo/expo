// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Bundle
import android.os.Debug
import android.view.View
import android.view.ViewTreeObserver
import android.view.animation.AccelerateInterpolator
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.ui.platform.ComposeView
import androidx.core.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.lifecycleScope
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import de.greenrobot.event.EventBus
import expo.modules.application.ApplicationModule
import expo.modules.asset.AssetModule
import expo.modules.blur.BlurModule
import expo.modules.camera.CameraViewModule
import expo.modules.clipboard.ClipboardModule
import expo.modules.constants.ConstantsModule
import expo.modules.constants.ConstantsService
import expo.modules.core.interfaces.Package
import expo.modules.device.DeviceModule
import expo.modules.easclient.EASClientModule
import expo.modules.filesystem.FileSystemModule
import expo.modules.filesystem.legacy.FileSystemLegacyModule
import expo.modules.font.FontLoaderModule
import expo.modules.font.FontUtilsModule
import expo.modules.haptics.HapticsModule
import expo.modules.keepawake.KeepAwakeModule
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.Service
import expo.modules.lineargradient.LinearGradientModule
import expo.modules.notifications.NotificationsPackage
import expo.modules.storereview.StoreReviewModule
import expo.modules.taskManager.TaskManagerPackage
import expo.modules.trackingtransparency.TrackingTransparencyModule
import expo.modules.webbrowser.WebBrowserModule
import host.exp.exponent.Constants
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.splashscreen.legacy.SplashScreenModule
import host.exp.exponent.experience.splashscreen.legacy.SplashScreenPackage
import host.exp.exponent.home.HomeActivityEvent
import host.exp.exponent.home.HomeAppViewModel
import host.exp.exponent.home.HomeAppViewModelFactory
import host.exp.exponent.home.RootNavigation
import host.exp.exponent.home.auth.AuthActivity
import host.exp.exponent.home.auth.AuthResult
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.ExpoViewKernel
import host.exp.exponent.kernel.Kernel.KernelStartedRunningEvent
import host.exp.exponent.utils.ExperienceActivityUtils
import host.exp.exponent.utils.ExperienceRTLManager
import host.exp.exponent.utils.currentDeviceIsAPhone
import org.json.JSONException
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.launch

open class HomeActivity : BaseExperienceActivity() {
  val homeActivityEvents = MutableSharedFlow<HomeActivityEvent>()

  val authLauncher = registerForActivityResult(AuthActivity.Contract()) { result ->
    when (result) {
      is AuthResult.Success -> {
        viewModel.onNewAuthSession(result.sessionSecret)
      }

      is AuthResult.Canceled -> {}
    }
  }

  val viewModel: HomeAppViewModel by viewModels {
    HomeAppViewModelFactory(
      kernel.exponentHistoryService,
      ExpoViewKernel.instance,
      homeActivityEvents,
      authLauncher
    )
  }

  //region Activity Lifecycle
  override fun onCreate(savedInstanceState: Bundle?) {
    usesComposeNavigation = true

    enableEdgeToEdge()

    if (currentDeviceIsAPhone(this)) {
      // Like on iOS, we lock the orientation only for phones
      @SuppressLint("SourceLockedOrientationActivity")
      requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    }

    super.onCreate(savedInstanceState)

    NativeModuleDepsProvider.instance.inject(HomeActivity::class.java, this)

    manifest = exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest
    experienceKey = try {
      ExperienceKey.fromManifest(manifest!!)
    } catch (e: JSONException) {
      ExperienceKey("")
    }

    // @sjchmiela, @lukmccall: We are consciously not overriding UI mode in Home, because it has no effect.
    // `ExpoAppearanceModule` with which `ExperienceActivityUtils#overrideUiMode` is compatible
    // is disabled in Home as of end of 2020, to fix some issues with dev menu, see:
    // https://github.com/expo/expo/blob/eb9bd274472e646a730fd535a4bcf360039cbd49/android/expoview/src/main/java/versioned/host/exp/exponent/ExponentPackage.java#L200-L207
    // ExperienceActivityUtils.overrideUiMode(mExponentManifest.getKernelManifest(), this);
    ExperienceActivityUtils.configureStatusBar(
      exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest,
      this
    )

    EventBus.getDefault().registerSticky(this)

    ExperienceRTLManager.setRTLPreferences(this, allowRTL = false, forceRTL = false)

    val contentView = ComposeView(this).apply {
      setContent {
        RootNavigation(viewModel)
      }
    }
    setContentView(contentView)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    val data = intent.data
    if (data != null && data.host == "after-delete" && data.scheme == "expauth") {
      lifecycleScope.launch {
        homeActivityEvents.emit(HomeActivityEvent.AccountDeleted)
      }
    }
  }

  override fun onResume() {
    SoLoader.init(this, OpenSourceMergedSoMapping)
    super.onResume()
  }
  //endregion Activity Lifecycle


  private fun configureSplashScreen(customSplashscreen: SplashScreen) {
    val contentView = findViewById<View>(android.R.id.content)
    val observer = contentView.viewTreeObserver
    observer.addOnPreDrawListener(object : ViewTreeObserver.OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        if (isLoading) {
          return false
        }
        contentView.viewTreeObserver.removeOnPreDrawListener(this)
        return true
      }
    })

    customSplashscreen.setOnExitAnimationListener { splashScreenViewProvider ->
      val splashScreenView = splashScreenViewProvider.view
      splashScreenView
        .animate()
        .setDuration(450)
        .alpha(0.0f)
        .setInterpolator(AccelerateInterpolator())
        .withEndAction {
          splashScreenViewProvider.remove()
        }.start()
    }
  }

  override fun onError(intent: Intent) {
    intent.putExtra(ErrorActivity.IS_HOME_KEY, true)
    kernel.setHasError()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    // Will update the navigation bar colors if the system theme has changed. This is only relevant for the three button navigation bar.
    enableEdgeToEdge()
    super.onConfigurationChanged(newConfig)
  }
}
