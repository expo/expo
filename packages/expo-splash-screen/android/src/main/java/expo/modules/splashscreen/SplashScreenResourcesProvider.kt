package expo.modules.splashscreen

import android.content.Context
import androidx.annotation.ColorInt
import androidx.annotation.DrawableRes

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
   * Purpose of this method is to provide source for imageView. Additionally you can modify imageView behaviour.
   */
  @DrawableRes
  fun getImageResource(context: Context): Int
}
