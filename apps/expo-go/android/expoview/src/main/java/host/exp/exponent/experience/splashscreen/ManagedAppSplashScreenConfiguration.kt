package host.exp.exponent.experience.splashscreen

import expo.modules.manifests.core.Manifest

class ManagedAppSplashScreenConfiguration private constructor() {

  var imageUrl: String? = null
    private set
  var appName: String? = null
    private set

  companion object {
    @JvmStatic
    fun parseManifest(manifest: Manifest): ManagedAppSplashScreenConfiguration {
      val config = ManagedAppSplashScreenConfiguration()

      manifest.getIconUrl()?.let { config.imageUrl = it }
      manifest.getName()?.let { config.appName = it }

      return config
    }
  }
}
