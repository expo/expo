// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.ui.platform.ComposeView
import androidx.core.view.WindowCompat
import androidx.lifecycle.lifecycleScope
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import de.greenrobot.event.EventBus
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.ReactNativeActivity.ExperienceDoneLoadingEvent
import host.exp.exponent.home.HomeActivityEvent
import host.exp.exponent.home.HomeAppViewModel
import host.exp.exponent.home.HomeAppViewModelFactory
import host.exp.exponent.home.RootNavigation
import host.exp.exponent.home.auth.AuthActivity
import host.exp.exponent.home.auth.AuthResult
import host.exp.exponent.kernel.ExpoViewKernel
import host.exp.exponent.kernel.Kernel
import host.exp.exponent.services.ThemeSetting
import host.exp.exponent.utils.ExperienceRTLManager
import host.exp.exponent.utils.currentDeviceIsAPhone
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

open class HomeActivity : AppCompatActivity() {
  @Inject
  protected lateinit var kernel: Kernel

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
    NativeModuleDepsProvider.instance.inject(HomeActivity::class.java, this)

    enableEdgeToEdge()

    if (currentDeviceIsAPhone(this)) {
      // Like on iOS, we lock the orientation only for phones
      @SuppressLint("SourceLockedOrientationActivity")
      requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    }

    super.onCreate(savedInstanceState)

    updateStatusBarForTheme(viewModel.selectedTheme.value)

    ExperienceRTLManager.setRTLPreferences(this, allowRTL = false, forceRTL = false)

    val contentView = ComposeView(this).apply {
      setContent {
        RootNavigation(viewModel)
      }
    }
    setContentView(contentView)

    // Observe theme changes and update status bar accordingly
    lifecycleScope.launch {
      viewModel.selectedTheme.collect { themeSetting ->
        updateStatusBarForTheme(themeSetting)
      }
    }
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
    updateStatusBarForTheme(viewModel.selectedTheme.value)
  }
  //endregion Activity Lifecycle

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    enableEdgeToEdge()
    updateStatusBarForTheme(viewModel.selectedTheme.value)
  }

  private fun updateStatusBarForTheme(themeSetting: ThemeSetting) {
    val isDarkTheme = when (themeSetting) {
      ThemeSetting.Automatic ->
        (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

      ThemeSetting.Dark -> true
      ThemeSetting.Light -> false
    }

    WindowCompat.getInsetsController(window, window.decorView).apply {
      isAppearanceLightStatusBars = !isDarkTheme
    }
  }
}
