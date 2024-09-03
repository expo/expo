package host.exp.exponent.experience

import android.app.Application
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import com.swmansion.reanimated.ReanimatedPackage
import host.exp.exponent.ExponentManifest
import host.exp.exponent.kernel.KernelConfig
import host.exp.expoview.Exponent
import versioned.host.exp.exponent.ExpoTurboPackage
import versioned.host.exp.exponent.ExponentPackage


class ExpoGoReactNativeHost(
    application: Application,
    private val exponentManifest: ExponentManifest,
    private val instanceManagerBuilderProperties: Exponent.InstanceManagerBuilderProperties,
    private val localBundlePath: String?,
) : DefaultReactNativeHost(application) {
    override fun getUseDeveloperSupport(): Boolean {
        return exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest.isDevelopmentMode()
    }

    override fun getJSBundleFile(): String? {
        return localBundlePath
    }

    override val isHermesEnabled = true

    override val isNewArchEnabled = true

    override fun getPackages(): MutableList<ReactPackage> {
        return mutableListOf(
            MainReactPackage(null),
            ReanimatedPackage(),
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
    val localBundlePath: String? = null,
    val mainModuleName: String? = null
)

class KernelReactNativeHost(
    application: Application,
    private val exponentManifest: ExponentManifest,
    private val data: KernelData?,
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
      return if(devSupportEnabled) {
           data?.mainModuleName ?: "main"
       } else {
           super.getJSMainModuleName()
       }
    }

    override fun getPackages(): MutableList<ReactPackage> {
        return mutableListOf(
            MainReactPackage(null),
            ReanimatedPackage(),
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
