package expo.modules.imagepicker

import android.content.res.Resources
import android.util.TypedValue

/**
 * Utility functions for ExpoCropImageActivity theming and color management.
 */
object ExpoCropImageUtils {

  /**
   * Gets a color value from the theme attributes.
   * @param theme The theme to resolve the attribute from
   * @param attr The attribute resource ID
   * @return The color value or null if not found
   */
  fun getThemeColor(theme: android.content.res.Resources.Theme, attr: Int): Int? = runCatching {
    val tv = TypedValue()
    if (theme.resolveAttribute(attr, tv, true)) tv.data else null
  }.getOrNull()

  /**
   * Gets a color resource value directly.
   * @param resources The resources to get the color from
   * @param colorResId The color resource ID
   * @return The color value or null if not found
   */
  fun getColorResource(resources: android.content.res.Resources, colorResId: Int): Int? = runCatching {
    resources.getColor(colorResId, null)
  }.getOrNull()
}
