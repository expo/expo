package host.exp.exponent.experience.splashscreen

import android.content.Context
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AlphaAnimation
import com.squareup.picasso.Callback
import com.squareup.picasso.Picasso
import expo.modules.splashscreen.SplashScreenView
import expo.modules.splashscreen.SplashScreenViewProvider
import expo.modules.manifests.core.Manifest
import host.exp.exponent.analytics.EXL

/**
 * SplashScreenView provider that parses manifest and extracts splash configuration.
 * It allows reconfiguration of the SplashScreenImage.
 */
class ManagedAppSplashScreenViewProvider(
  private var config: ManagedAppSplashScreenConfiguration
) : SplashScreenViewProvider {
  private lateinit var splashScreenView: SplashScreenView

  companion object {
    private const val TAG: String = "ExperienceSplashScreenManifestBasedResourceProvider"
  }
  override fun createSplashScreenView(context: Context): View {
    splashScreenView = SplashScreenView(context)
    configureSplashScreenView(context, config, null)
    return splashScreenView
  }

  fun updateSplashScreenViewWithManifest(context: Context, manifest: Manifest) {
    val previousConfig = config
    config = ManagedAppSplashScreenConfiguration.parseManifest(manifest)
    configureSplashScreenView(context, config, previousConfig)
  }

  private fun configureSplashScreenView(
    context: Context,
    config: ManagedAppSplashScreenConfiguration,
    previousConfig: ManagedAppSplashScreenConfiguration?
  ) {
    splashScreenView.setBackgroundColor(config.backgroundColor)
    // Only re-create the image view when the imageUrl or resizeMode changes
    if (previousConfig == null ||
      config.resizeMode != previousConfig.resizeMode ||
      !config.imageUrl.equals(previousConfig.imageUrl)
    ) {
      splashScreenView.configureImageViewResizeMode(config.resizeMode)
      configureSplashScreenImageView(context, config)
    }
  }

  private fun configureSplashScreenImageView(context: Context, config: ManagedAppSplashScreenConfiguration) {
    splashScreenView.imageView.visibility = View.GONE
    if (config.imageUrl == null) {
      return
    }
    Picasso.with(context).load(config.imageUrl).into(
      splashScreenView.imageView,
      object : Callback {
        override fun onSuccess() {
          splashScreenView.imageView.visibility = View.VISIBLE
          splashScreenView.imageView.animation = AlphaAnimation(0.0f, 1.0f).also {
            it.duration = 300
            it.interpolator = AccelerateDecelerateInterpolator()
            it.fillAfter = true
          }
        }

        override fun onError() {
          EXL.e(TAG, "Couldn't load image at url " + config.imageUrl)
        }
      }
    )
  }
}
