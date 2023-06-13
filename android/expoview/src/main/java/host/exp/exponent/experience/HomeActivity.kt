// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Debug
import android.view.View
import androidx.core.content.ContextCompat
import com.facebook.react.ReactRootView
import com.facebook.soloader.SoLoader
import com.squareup.leakcanary.LeakCanary
import de.greenrobot.event.EventBus
import expo.modules.barcodescanner.BarCodeScannerPackage
import expo.modules.constants.ConstantsPackage
import expo.modules.core.interfaces.Package
import expo.modules.facedetector.FaceDetectorPackage
import expo.modules.filesystem.FileSystemPackage
import expo.modules.font.FontLoaderPackage
import expo.modules.keepawake.KeepAwakePackage
import expo.modules.notifications.NotificationsPackage
import expo.modules.permissions.PermissionsPackage
import expo.modules.splashscreen.SplashScreenImageResizeMode
import expo.modules.splashscreen.SplashScreenPackage
import expo.modules.splashscreen.singletons.SplashScreen
import expo.modules.taskManager.TaskManagerPackage
import host.exp.exponent.Constants
import host.exp.exponent.ExponentManifest
import host.exp.exponent.RNObject
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.Kernel.KernelStartedRunningEvent
import host.exp.exponent.utils.ExperienceActivityUtils
import host.exp.exponent.utils.ExperienceRTLManager
import host.exp.expoview.BuildConfig
import org.json.JSONException
import javax.inject.Inject

open class HomeActivity : BaseExperienceActivity() {
  @Inject
  lateinit var exponentManifest: ExponentManifest

  //region Activity Lifecycle
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    NativeModuleDepsProvider.instance.inject(HomeActivity::class.java, this)

    sdkVersion = RNObject.UNVERSIONED
    manifest = exponentManifest.getKernelManifest()
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
    ExperienceActivityUtils.configureStatusBar(exponentManifest.getKernelManifest(), this)

    EventBus.getDefault().registerSticky(this)
    kernel.startJSKernel(this)

    ExperienceRTLManager.setSupportsRTL(this, false)

    SplashScreen.show(this, SplashScreenImageResizeMode.NATIVE, ReactRootView::class.java, true)

    tryInstallLeakCanary(true)
  }

  override fun shouldCreateLoadingView(): Boolean {
    // Home app shouldn't show LoadingView as it indicates state when the app's manifest is being
    // downloaded and Splash info is not yet available and this is not the case for Home app
    // (Splash info is known from the start).
    return false
  }

  override fun onResume() {
    super.onResume()
    SoLoader.init(this, false)
  }
  //endregion Activity Lifecycle
  /**
   * This method has been split out from onDestroy lifecycle method to [ReactNativeActivity.destroyReactInstanceManager]
   * and overridden here as we want to prevent destroying react instance manager when HomeActivity gets destroyed.
   * It needs to continue to live since it is needed for DevMenu to work as expected (it relies on ExponentKernelModule from that react context).
   */
  override fun destroyReactInstanceManager() {}

  private fun tryInstallLeakCanary(shouldAskForPermissions: Boolean) {
    if (BuildConfig.DEBUG && Constants.ENABLE_LEAK_CANARY) {
      // Leak canary needs WRITE_EXTERNAL_STORAGE permission
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (shouldAskForPermissions && ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
          ) != PackageManager.PERMISSION_GRANTED
        ) {
          requestPermissions(arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE), 1248919246)
        } else {
          LeakCanary.install(application)
        }
      } else {
        LeakCanary.install(application)
      }
    }
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    tryInstallLeakCanary(false)
  }

  fun onEventMainThread(event: KernelStartedRunningEvent?) {
    reactInstanceManager.assign(kernel.reactInstanceManager)
    reactRootView.assign(kernel.reactRootView)
    reactInstanceManager.onHostResume(this, this)
    setReactRootView((reactRootView.get() as View))
    finishLoading()

    if (Constants.DEBUG_COLD_START_METHOD_TRACING) {
      Debug.stopMethodTracing()
    }
  }

  override fun onError(intent: Intent) {
    intent.putExtra(ErrorActivity.IS_HOME_KEY, true)
    kernel.setHasError()
  }

  companion object {
    fun homeExpoPackages(): List<Package> {
      return listOf(
        ConstantsPackage(),
        PermissionsPackage(),
        FileSystemPackage(),
        FontLoaderPackage(),
        BarCodeScannerPackage(),
        KeepAwakePackage(),
        FaceDetectorPackage(),
        NotificationsPackage(), // home doesn't use notifications, but we want the singleton modules created
        TaskManagerPackage(), // load expo-task-manager to restore tasks once the client is opened
        SplashScreenPackage()
      )
    }
  }
}
