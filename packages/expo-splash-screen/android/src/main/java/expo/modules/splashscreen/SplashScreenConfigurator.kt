package expo.modules.splashscreen

import android.content.Context
import android.widget.ImageView

/**
 * This interface is responsible for providing resources for proper SplashScreen configuration.
 */
interface SplashScreenConfigurator {
  /**
   * Provide color that would be set as a background of splash screen.
   */
  fun getBackgroundColor(context: Context): Int
  
  /**
   * Purpose of this method is to provide source for imageView. Additionally you can modify imageView behaviour.
   */
  fun configureImageView(context: Context, imageView: ImageView, resizeMode: SplashScreenImageResizeMode)
  
  /**
   * Optional configuration for whole SplashScreen.
   * Should only be used for extreme cases (when SplashScreen should show something different from plain ImageView).
   */
  fun configureSplashScreen(context: Context, splashScreenView: SplashScreenView)
}
