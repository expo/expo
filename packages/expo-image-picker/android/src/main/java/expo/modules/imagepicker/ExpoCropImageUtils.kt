package expo.modules.imagepicker

import android.graphics.Color
import android.util.TypedValue
import com.canhub.cropper.CropImageOptions
import androidx.core.view.WindowInsetsControllerCompat

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

  /**
   * Applies a color palette to CropImageOptions based on theme attributes or color resources.
   * @param theme The theme to resolve colors from
   * @param resources The resources to get colors from
   * @param isNight Whether the app is in dark mode
   * @param options The CropImageOptions to apply colors to
   * @return The toolbar widget color that was applied
   */
  fun applyPaletteToOptions(
    theme: android.content.res.Resources.Theme,
    resources: android.content.res.Resources,
    isNight: Boolean,
    options: CropImageOptions
  ): Int {
    // Try theme attributes first, then fall back to color resources
    val customToolbar = getThemeColor(theme, R.attr.expoCropToolbarColor)
      ?: getColorResource(resources, R.color.expoCropToolbarColor)
    val customIconColor = getThemeColor(theme, R.attr.expoCropToolbarIconColor)
      ?: getColorResource(resources, R.color.expoCropToolbarIconColor)
    val customActionTextColor = getThemeColor(theme, R.attr.expoCropToolbarActionTextColor)
      ?: getColorResource(resources, R.color.expoCropToolbarActionTextColor)
    val customBackButtonIconColor = getThemeColor(theme, R.attr.expoCropBackButtonIconColor)
      ?: getColorResource(resources, R.color.expoCropBackButtonIconColor)
    val customBg = getThemeColor(theme, R.attr.expoCropBackgroundColor)
      ?: getColorResource(resources, R.color.expoCropBackgroundColor)

    val defaultColor = if (isNight) Color.BLACK else Color.WHITE
    val toolbarWidgetColor = customIconColor ?: if (isNight) Color.WHITE else Color.BLACK

    options.activityBackgroundColor = customBg ?: defaultColor
    options.toolbarColor = customToolbar ?: defaultColor
    options.toolbarTitleColor = toolbarWidgetColor
    options.toolbarBackButtonColor = customBackButtonIconColor ?: toolbarWidgetColor
    options.activityMenuIconColor = toolbarWidgetColor
    options.activityMenuTextColor = customActionTextColor ?: if (isNight) Color.WHITE else Color.BLACK

    return toolbarWidgetColor
  }

  /**
   * Applies window-level theming (status bar, etc.) based on the applied palette.
   * @param window The window to apply theming to
   * @param toolbarColor The toolbar color that was applied
   * @param isNight Whether the app is in dark mode
   */
  fun applyWindowTheming(
    window: android.view.Window,
    toolbarColor: Int,
    isNight: Boolean
  ) {
    window.statusBarColor = toolbarColor
    WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = !isNight
  }
}
