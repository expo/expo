// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

import android.content.Intent
import android.os.Bundle
import android.os.Debug
import com.facebook.react.runtime.ReactSurfaceView
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import de.greenrobot.event.EventBus
import expo.modules.application.ApplicationModule
import expo.modules.asset.AssetModule
import expo.modules.blur.BlurModule
import expo.modules.camera.CameraViewModule
import expo.modules.clipboard.ClipboardModule
import expo.modules.constants.ConstantsModule
import expo.modules.constants.ConstantsPackage
import expo.modules.core.interfaces.Package
import expo.modules.device.DeviceModule
import expo.modules.easclient.EASClientModule
import expo.modules.facedetector.FaceDetectorPackage
import expo.modules.filesystem.FileSystemModule
import expo.modules.filesystem.FileSystemPackage
import expo.modules.font.FontLoaderModule
import expo.modules.haptics.HapticsModule
import expo.modules.keepawake.KeepAwakeModule
import expo.modules.keepawake.KeepAwakePackage
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.lineargradient.LinearGradientModule
import expo.modules.notifications.NotificationsPackage
import expo.modules.splashscreen.SplashScreenImageResizeMode
import expo.modules.splashscreen.SplashScreenModule
import expo.modules.splashscreen.SplashScreenPackage
import expo.modules.splashscreen.singletons.SplashScreen
import expo.modules.storereview.StoreReviewModule
import expo.modules.taskManager.TaskManagerPackage
import expo.modules.trackingtransparency.TrackingTransparencyModule
import expo.modules.webbrowser.WebBrowserModule
import host.exp.exponent.Constants
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.Kernel.KernelStartedRunningEvent
import host.exp.exponent.utils.ExperienceActivityUtils
import host.exp.exponent.utils.ExperienceRTLManager
import org.json.JSONException

open class HomeActivity : BaseExperienceActivity() {

  //region Activity Lifecycle
  override fun onCreate(savedInstanceState: Bundle?) {
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
    ExperienceActivityUtils.configureStatusBar(exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest, this)

    EventBus.getDefault().registerSticky(this)
    kernel.startJSKernel(this)

    ExperienceRTLManager.setRTLPreferences(this, allowRTL = false, forceRTL = false)

    SplashScreen.show(this, SplashScreenImageResizeMode.NATIVE, ReactSurfaceView::class.java, true)
  }

  override fun shouldCreateLoadingView(): Boolean {
    // Home app shouldn't show LoadingView as it indicates state when the app's manifest is being
    // downloaded and Splash info is not yet available and this is not the case for Home app
    // (Splash info is known from the start).
    return false
  }

  override fun onResume() {
    SoLoader.init(this, OpenSourceMergedSoMapping)
    super.onResume()
  }
  //endregion Activity Lifecycle
  /**
   * This method has been split out from onDestroy lifecycle method to [ReactNativeActivity.destroyReactHost]
   * and overridden here as we want to prevent destroying react instance manager when HomeActivity gets destroyed.
   * It needs to continue to live since it is needed for DevMenu to work as expected (it relies on ExponentKernelModule from that react context).
   */
  override fun destroyReactHost() {}

  fun onEventMainThread(event: KernelStartedRunningEvent?) {
    reactHost = kernel.reactHost
    reactNativeHost = kernel.reactNativeHost
    reactSurface = kernel.surface

    reactHost?.onHostResume(this, this)
    reactSurface?.view?.let {
      setReactRootView(it)
    }
    finishLoading()

    if (Constants.DEBUG_COLD_START_METHOD_TRACING) {
      Debug.stopMethodTracing()
    }
  }

  override fun onError(intent: Intent) {
    intent.putExtra(ErrorActivity.IS_HOME_KEY, true)
    kernel.setHasError()
  }

  companion object : ModulesProvider {
    fun homeExpoPackages(): List<Package> {
      return listOf(
        ConstantsPackage(),
        FileSystemPackage(),
        KeepAwakePackage(),
        FaceDetectorPackage(),
        NotificationsPackage(), // home doesn't use notifications, but we want the singleton modules created
        TaskManagerPackage(), // load expo-task-manager to restore tasks once the client is opened
        SplashScreenPackage()
      )
    }

    override fun getModulesList(): List<Class<out Module>> {
      return listOf(
        AssetModule::class.java,
        BlurModule::class.java,
        CameraViewModule::class.java,
        ClipboardModule::class.java,
        ConstantsModule::class.java,
        DeviceModule::class.java,
        EASClientModule::class.java,
        FileSystemModule::class.java,
        FontLoaderModule::class.java,
        HapticsModule::class.java,
        KeepAwakeModule::class.java,
        LinearGradientModule::class.java,
        SplashScreenModule::class.java,
        TrackingTransparencyModule::class.java,
        StoreReviewModule::class.java,
        WebBrowserModule::class.java,
        ApplicationModule::class.java
      )
    }
  }
}
