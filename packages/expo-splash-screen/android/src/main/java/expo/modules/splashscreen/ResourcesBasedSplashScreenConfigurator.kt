package expo.modules.splashscreen

import android.content.Context
import android.widget.ImageView

/**
 * Default implementation that bases on native resources.
 */
class ResourcesBasedSplashScreenConfigurator : SplashScreenConfigurator {

  override fun getBackgroundColor(context: Context): Int {
    return context.resources.getColor(R.color.splashscreen_background)
  }

  override fun configureImageView(context: Context, imageView: ImageView, mode: SplashScreenMode) {
    when (mode) {
      SplashScreenMode.NATIVE -> {
        imageView.setImageResource(R.drawable.splashscreen)
      }
      SplashScreenMode.COVER,
      SplashScreenMode.CONTAIN -> {
        imageView.setImageResource(R.drawable.splashscreen_image)
      }
    }
  }

  override fun configureSplashScreen(context: Context, splashScreenView: SplashScreenView) {}
}
