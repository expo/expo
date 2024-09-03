package host.exp.exponent.experience

import android.app.Application
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.shell.MainReactPackage
import com.swmansion.reanimated.ReanimatedPackage
import host.exp.exponent.ExponentManifest
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
        return true
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

class KernelReactNativeHost(
    application: Application,
    private val exponentManifest: ExponentManifest,
    private val initialURL: String?,
    private val localBundlePath: String?,
) : DefaultReactNativeHost(application) {
    override fun getUseDeveloperSupport(): Boolean {
        return exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest.isDevelopmentMode()
    }

    override val isHermesEnabled = true

    override val isNewArchEnabled = true

    override fun getJSBundleFile(): String? {
        return localBundlePath
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
                initialURL
            ),
            ExpoTurboPackage.kernelExpoTurboPackage(
                exponentManifest.getKernelManifestAndAssetRequestHeaders().manifest,
                initialURL
            )
        )
    }
}
