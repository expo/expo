// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import android.app.Application
import android.content.Context
import android.content.pm.PackageManager
import de.greenrobot.event.EventBus
import host.exp.exponent.ExpoUpdatesAppLoader
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.KernelConstants.ExperienceOptions
import host.exp.expoview.ExpoViewBuildConfig
import javax.inject.Inject

class ExpoViewKernel private constructor() : KernelInterface() {
  class ExpoViewErrorEvent internal constructor(val errorMessage: String)

  @Inject
  lateinit var context: Context

  @Inject
  lateinit var applicationContext: Application

  override fun handleError(errorMessage: String) {
    if (ExpoViewBuildConfig.DEBUG) {
      EventBus.getDefault().post(ExpoViewErrorEvent(errorMessage))
    } else {
      throw RuntimeException(errorMessage)
    }
  }

  override fun handleError(exception: Exception) {
    if (ExpoViewBuildConfig.DEBUG) {
      EventBus.getDefault().post(ExpoViewErrorEvent(exception.toString()))
    } else {
      throw RuntimeException(exception)
    }
  }

  override fun openExperience(options: ExperienceOptions) {}

  override fun getAppLoaderForManifestUrl(manifestUrl: String?): ExpoUpdatesAppLoader? {
    return null
  }

  override fun reloadVisibleExperience(manifestUrl: String, forceCache: Boolean): Boolean {
    return false
  }

  val versionName: String?

  companion object {
    private val TAG = ExpoViewKernel::class.java.simpleName

    @JvmStatic val instance: ExpoViewKernel by lazy {
      ExpoViewKernel()
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(ExpoViewKernel::class.java, this)

    versionName = try {
      applicationContext.packageManager.getPackageInfo(
        context.packageName, 0
      ).versionName
    } catch (e: PackageManager.NameNotFoundException) {
      EXL.e(TAG, e)
      null
    } catch (e: Throwable) {
      EXL.e(TAG, e)
      null
    }
  }
}
