package host.exp.exponent.experience

import android.app.Application
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import host.exp.exponent.ExponentManifest
import host.exp.exponent.kernel.KernelConfig
import host.exp.expoview.Exponent
import versioned.host.exp.exponent.ExpoReanimatedPackage
import versioned.host.exp.exponent.ExpoTurboPackage
import versioned.host.exp.exponent.ExponentPackage

class ExpoGoReactNativeHost(
  application: Application,
  private val instanceManagerBuilderProperties: Exponent.InstanceManagerBuilderProperties,
  private val mainModuleName: String? = null
) : DefaultReactNativeHost(application) {
  override fun getUseDeveloperSupport(): Boolean {
    return true
  }

  override fun getJSMainModuleName(): String {
    return mainModuleName ?: super.getJSMainModuleName()
  }

  override fun getJSBundleFile(): String? {
    return instanceManagerBuilderProperties.jsBundlePath
  }

  override val isHermesEnabled = true

  override val isNewArchEnabled = true

  override fun getPackages(): MutableList<ReactPackage> {
    return mutableListOf(
      MainReactPackage(null),
      ExpoReanimatedPackage(),
      ExponentPackage(
        instanceManagerBuilderProperties.experienceProperties,
        instanceManagerBuilderProperties.manifest,
        // DO NOT EDIT THIS COMMENT - used by versioning scripts
        // When distributing change the following two arguments to nulls
        instanceManagerBuilderProperties.expoPackages,
        instanceManagerBuilderProperties.exponentPackageDelegate,
        instanceManagerBuilderProperties.singletonModules
      ),
      ExpoTurboPackage(
        instanceManagerBuilderProperties.experienceProperties,
        instanceManagerBuilderProperties.manifest
      )
    )
  }
}

data class KernelData(
  val initialURL: String? = null,
  val localBundlePath: String? = null
)

class KernelReactNativeHost(
  application: Application,
  private val exponentManifest: ExponentManifest,
  private val data: KernelData?
) : DefaultReactNativeHost(application) {
  val devSupportEnabled
    get() =
      !KernelConfig.FORCE_NO_KERNEL_DEBUG_MODE &&
        exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest.isDevelopmentMode()

  override fun getUseDeveloperSupport(): Boolean {
    return devSupportEnabled
  }

  override val isHermesEnabled = true

  override val isNewArchEnabled = true

  override fun getJSBundleFile(): String? {
    return data?.localBundlePath
  }

  override fun getJSMainModuleName(): String {
    return if (devSupportEnabled) {
      exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest.getMainModuleName()
    } else {
      super.getJSMainModuleName()
    }
  }

  override fun getPackages(): MutableList<ReactPackage> {
    return mutableListOf(
      MainReactPackage(null),
      ExpoReanimatedPackage(),
      ExponentPackage.kernelExponentPackage(
        application.applicationContext,
        exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest,
        HomeActivity.homeExpoPackages(),
        HomeActivity.Companion,
        data?.initialURL
      ),
      ExpoTurboPackage.kernelExpoTurboPackage(
        exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest,
        data?.initialURL
      )
    )
  }
}
