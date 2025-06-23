package expo.modules.imagepicker

import android.graphics.Color
import android.view.Menu
import com.canhub.cropper.CropImageActivity
import com.canhub.cropper.CropImageOptions

/**
 * A wrapper around `CropImageActivity` to provide custom theming and functionality.
 *
 * This activity applies a custom color palette based on the application's theme
 * and ensures that all icons are tinted correctly for both light and dark modes.
 * It uses reflection to access private fields in the base `CropImageActivity`
 * to avoid forking the library.
 */
class ExpoCropImageActivity : CropImageActivity() {
  private var currentIconColor: Int = Color.BLACK

  // region Lifecycle Methods
  override fun onCreate(savedInstanceState: android.os.Bundle?) {
    super.onCreate(savedInstanceState)
    // Fetch the private cropImageOptions and apply the palette as early as possible so
    // the toolbar and menu icons are tinted correctly on first render.
    getCropOptions()?.let { opts ->
      val isNight = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
      applyPalette(isNight, opts)
      invokeSetCustomizations()
      invalidateOptionsMenu() // Recreate the menu to apply the new icon colors.
    }
  }

  override fun onCreateOptionsMenu(menu: Menu): Boolean {
    val result = super.onCreateOptionsMenu(menu)
    tintAllMenuItems(menu)
    return result
  }

  override fun onPrepareOptionsMenu(menu: Menu): Boolean {
    val result = super.onPrepareOptionsMenu(menu)
    tintAllMenuItems(menu)
    return result
  }
  // endregion

  private fun applyPalette(isNight: Boolean, opts: CropImageOptions) {
    // Apply palette to options and get the toolbar widget color
    val toolbarWidgetColor = ExpoCropImageUtils.applyPaletteToOptions(theme, resources, isNight, opts)

    // Set the current icon color for menu tinting
    currentIconColor = toolbarWidgetColor

    // Set up toolbar color with fallback for status bar theming
    val defaultToolbarColor = if (isNight) Color.BLACK else Color.WHITE
    val toolbarColor = opts.toolbarColor ?: defaultToolbarColor
    ExpoCropImageUtils.applyWindowTheming(window, toolbarColor, isNight)

    // Remove action bar elevation for a flat design
    supportActionBar?.elevation = 0f
  }

  // region Helper Methods
  private fun getCropOptions(): CropImageOptions? =
    runCatching {
      CropImageActivity::class.java.getDeclaredField("cropImageOptions")
        .apply { isAccessible = true }
        .get(this) as? CropImageOptions
    }.getOrNull()

  private fun invokeSetCustomizations() =
    runCatching {
      CropImageActivity::class.java.getDeclaredMethod("setCustomizations")
        .apply { isAccessible = true }
        .invoke(this)
    }

  private fun tintAllMenuItems(menu: Menu) {
    for (i in 0 until menu.size()) {
      menu.getItem(i)?.icon?.mutate()?.setTint(currentIconColor)
    }
  }
  // endregion
}
