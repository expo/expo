package host.exp.exponent.experience.splashscreen

import android.content.Context
import android.view.View
import host.exp.exponent.experience.splashscreen.legacy.SplashScreenView
import host.exp.exponent.experience.splashscreen.legacy.SplashScreenViewProvider
import expo.modules.manifests.core.Manifest

/**
 * SplashScreenView provider that parses manifest and extracts splash configuration.
 * It allows reconfiguration of the SplashScreenImage.
 */
class ManagedAppSplashScreenViewProvider(
  private var config: ManagedAppSplashScreenConfiguration
) : SplashScreenViewProvider {
  private lateinit var splashScreenView: SplashScreenView

  override fun createSplashScreenView(context: Context): View {
    splashScreenView = SplashScreenView(context)
    configureSplashScreenView(config, null)
    return splashScreenView
  }

  fun updateSplashScreenViewWithManifest(manifest: Manifest) {
    val previousConfig = config
    config = ManagedAppSplashScreenConfiguration.parseManifest(manifest)
    configureSplashScreenView(config, previousConfig)
  }

  private fun configureSplashScreenView(
    config: ManagedAppSplashScreenConfiguration,
    previousConfig: ManagedAppSplashScreenConfiguration?
  ) {
    if (previousConfig == null ||
      config.appName != previousConfig.appName ||
      !config.imageUrl.equals(previousConfig.imageUrl)
    ) {
      splashScreenView.appName = config.appName ?: ""
      splashScreenView.imageUrl = config.imageUrl ?: ""
    }
  }
}
