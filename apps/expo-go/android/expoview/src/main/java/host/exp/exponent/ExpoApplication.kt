// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.app.Application
import android.os.Debug
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import host.exp.exponent.analytics.EXL
import host.exp.exponent.branch.BranchManager
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.*
import host.exp.exponent.kernel.ExponentKernelModuleProvider.ExponentKernelModuleFactory
import host.exp.exponent.kernel.KernelProvider.KernelFactory
import host.exp.exponent.modules.ExponentKernelModule
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.expoview.ExpoViewBuildConfig
import host.exp.expoview.Exponent
import me.leolin.shortcutbadger.ShortcutBadger
import javax.inject.Inject

abstract class ExpoApplication : Application() {
  // Override me!
  abstract val isDebug: Boolean

  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  override fun onCreate() {
    super.onCreate()

    ExpoViewBuildConfig.DEBUG = isDebug
    ExpoViewBuildConfig.USE_EMBEDDED_KERNEL = shouldUseEmbeddedKernel()

    if (ExpoViewBuildConfig.DEBUG && Constants.WAIT_FOR_DEBUGGER) {
      Debug.waitForDebugger()
    }

    KernelConstants.MAIN_ACTIVITY_CLASS = LauncherActivity::class.java

    KernelProvider.setFactory(object : KernelFactory {
      override fun create(): KernelInterface {
        return Kernel()
      }
    })

    ExponentKernelModuleProvider.setFactory(object : ExponentKernelModuleFactory {
      override fun create(reactContext: ReactApplicationContext): ExponentKernelModuleInterface {
        return ExponentKernelModule(
          reactContext
        )
      }
    })

    Exponent.initialize(this, this)

    NativeModuleDepsProvider.instance.add(Kernel::class.java, KernelProvider.instance)
    NativeModuleDepsProvider.instance.add(DevMenuManager::class.java, DevMenuManager())
    NativeModuleDepsProvider.instance.inject(ExpoApplication::class.java, this)

    BranchManager.initialize(this)

    try {
      // Remove the badge count on weird launchers
      // TODO: doesn't work on the Xiaomi phone. bug with the library
      ShortcutBadger.removeCount(this)
    } catch (e: Throwable) {
      EXL.e(TAG, e)
    }

    if (Constants.DEBUG_COLD_START_METHOD_TRACING) {
      Debug.startMethodTracing("coldStart")
    }

    SoLoader.init(applicationContext, OpenSourceMergedSoMapping)
    ExpoGoReactNativeFeatureFlags.setup()
    // For the New Architecture, we load the native entry point for this app.
    // We should keep the code in sync with `DefaultNewArchitectureEntryPoint.load()`
    SoLoader.loadLibrary("react_newarchdefaults")

    // Add exception handler. This is used by the entire process, so only need to add it here.
    Thread.setDefaultUncaughtExceptionHandler(
      ExponentUncaughtExceptionHandler(
        applicationContext
      )
    )
  }

  // we're leaving this stub in here so that if people don't modify their MainApplication to
  // remove the override of shouldUseInternetKernel() their project will still build without errors
  private fun shouldUseEmbeddedKernel(): Boolean {
    return !isDebug
  }

  companion object {
    private val TAG = ExpoApplication::class.java.simpleName
  }
}
