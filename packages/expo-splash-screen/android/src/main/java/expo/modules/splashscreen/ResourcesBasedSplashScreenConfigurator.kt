package expo.modules.splashscreen

import android.content.Context
import android.widget.ImageView
import androidx.core.content.ContextCompat

/**
 * Default implementation that bases on native resources.
 */
class ResourcesBasedSplashScreenConfigurator : SplashScreenConfigurator {

  override fun getBackgroundColor(context: Context): Int {
    return ContextCompat.getColor(context, R.color.splashscreen_background);
  }

  override fun configureImageView(context: Context, imageView: ImageView, resizeMode: SplashScreenImageResizeMode) {
    when (resizeMode) {
      SplashScreenImageResizeMode.NATIVE -> {
        imageView.setImageResource(R.drawable.splashscreen)
      }
      SplashScreenImageResizeMode.COVER,
      SplashScreenImageResizeMode.CONTAIN -> {
        imageView.setImageResource(R.drawable.splashscreen_image)
      }
    }
  }

  override fun configureSplashScreen(context: Context, splashScreenView: SplashScreenView) {}
}
