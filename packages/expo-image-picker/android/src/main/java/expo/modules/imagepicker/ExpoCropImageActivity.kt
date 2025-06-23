package expo.modules.imagepicker

import android.content.res.ColorStateList
import android.graphics.Color
import android.view.Menu
import androidx.appcompat.widget.Toolbar
import androidx.core.graphics.drawable.DrawableCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.util.TypedValue
import com.canhub.cropper.CropImageActivity
import com.canhub.cropper.CropImageOptions
import java.io.Serializable

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
    fun getThemeColor(attr: Int): Int? = runCatching {
      val tv = TypedValue()
      if (theme.resolveAttribute(attr, tv, true)) tv.data else null
    }.getOrNull()

    val customToolbar = getThemeColor(R.attr.expoCropToolbarColor)
    val customIconColor = getThemeColor(R.attr.expoCropToolbarIconColor)
    val customActionTextColor = getThemeColor(R.attr.expoCropToolbarActionTextColor)
    val customBackButtonIconColor = getThemeColor(R.attr.expoCropBackButtonIconColor)
    val customBg = getThemeColor(R.attr.expoCropBackgroundColor)

    if (isNight) {
      opts.activityBackgroundColor = customBg ?: Color.BLACK
      opts.toolbarColor = customToolbar ?: Color.BLACK
      val toolbarWidgetColor = customIconColor ?: Color.WHITE
      opts.toolbarTitleColor = toolbarWidgetColor
      opts.toolbarBackButtonColor = customBackButtonIconColor ?: toolbarWidgetColor
      opts.activityMenuIconColor = toolbarWidgetColor
      opts.activityMenuTextColor = customActionTextColor ?: Color.WHITE
      currentIconColor = toolbarWidgetColor
      window.statusBarColor = opts.toolbarColor ?: Color.BLACK
      WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = false
    } else {
      opts.activityBackgroundColor = customBg ?: Color.WHITE
      opts.toolbarColor = customToolbar ?: opts.activityBackgroundColor ?: Color.WHITE
      val toolbarWidgetColor = customIconColor ?: Color.BLACK
      opts.toolbarTitleColor = toolbarWidgetColor
      opts.toolbarBackButtonColor = customBackButtonIconColor ?: toolbarWidgetColor
      opts.activityMenuIconColor = toolbarWidgetColor
      opts.activityMenuTextColor = customActionTextColor ?: Color.BLACK
      currentIconColor = toolbarWidgetColor
      window.statusBarColor = opts.toolbarColor ?: Color.WHITE
      WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true
    }
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