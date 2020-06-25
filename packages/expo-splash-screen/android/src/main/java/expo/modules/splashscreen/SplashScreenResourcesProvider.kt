package expo.modules.splashscreen

import android.content.Context
import android.widget.ImageView
import androidx.annotation.ColorInt

/**
 * This interface is responsible for providing resources for proper SplashScreenView configuration.
 */
interface SplashScreenResourcesProvider {
  /**
   * Provide color that would be set as a background of splash screen view.
   * @return [ColorInt]
   */
  @ColorInt
  fun getBackgroundColor(context: Context): Int

  /**
   * Purpose of this method is to configure splashScreen's imageView.
   */
  fun configureImageView(context: Context, imageView: ImageView, resizeMode: SplashScreenImageResizeMode)
}
