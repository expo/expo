package expo.modules.imagepicker

import android.graphics.Color
import android.view.Menu
import android.view.View
import android.view.ViewGroup
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.updateLayoutParams
import com.canhub.cropper.CropImageActivity
import com.canhub.cropper.CropImageOptions
import com.canhub.cropper.CropImageView
import expo.modules.imagepicker.ExpoCropImageUtils.getColorResource
import expo.modules.imagepicker.ExpoCropImageUtils.getThemeColor

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
  private var cropImageViewRef: CropImageView? = null

  // region Lifecycle Methods
  override fun onCreate(savedInstanceState: android.os.Bundle?) {
    super.onCreate(savedInstanceState)
    // Fetch the private cropImageOptions and apply the palette as early as possible so
    // the toolbar and menu icons are tinted correctly on first render.
    getCropOptions()?.let { opts ->
      val isNight = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
      applyCustomization(isNight, opts)
      invokeSetCustomizations()
      invalidateOptionsMenu() // Recreate the menu to apply the new icon colors.
    }
  }

  override fun onDestroy() {
    ViewCompat.setOnApplyWindowInsetsListener(window.decorView, null)

    cropImageViewRef?.let { ViewCompat.setOnApplyWindowInsetsListener(it, null) }
    cropImageViewRef = null

    super.onDestroy()
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

  override fun setCropImageView(cropImageView: CropImageView) {
    super.setCropImageView(cropImageView)

    cropImageViewRef = cropImageView

    // Inset the crop view margins so it doesn't overlap with system bars or display cutouts
    ViewCompat.setOnApplyWindowInsetsListener(cropImageView) { view, insets ->
      val values = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())

      view.updateLayoutParams<ViewGroup.MarginLayoutParams> {
        setMargins(values.left, values.top, values.right, values.bottom)
      }

      insets
    }
  }

  // endregion

  private fun applyCustomization(isNight: Boolean, options: CropImageOptions) {
    val defaultBackgroundColor = if (isNight) Color.BLACK else Color.WHITE
    val defaultContentColor = if (isNight) Color.WHITE else Color.BLACK

    // Try theme attributes first, then fall back to color resources
    val expoCropBackButtonIconColor = getThemeColor(theme, R.attr.expoCropBackButtonIconColor)
      ?: getColorResource(resources, R.color.expoCropBackButtonIconColor)
    val expoCropBackgroundColor = getThemeColor(theme, R.attr.expoCropBackgroundColor)
      ?: getColorResource(resources, R.color.expoCropBackgroundColor)
    val expoCropToolbarActionTextColor = getThemeColor(theme, R.attr.expoCropToolbarActionTextColor)
      ?: getColorResource(resources, R.color.expoCropToolbarActionTextColor)
    val expoCropToolbarColor = getThemeColor(theme, R.attr.expoCropToolbarColor)
      ?: getColorResource(resources, R.color.expoCropToolbarColor)
    val expoCropToolbarIconColor = getThemeColor(theme, R.attr.expoCropToolbarIconColor)
      ?: getColorResource(resources, R.color.expoCropToolbarIconColor)

    val activityBackgroundColor = expoCropBackgroundColor ?: defaultBackgroundColor
    val toolbarColor = expoCropToolbarColor ?: defaultBackgroundColor
    val toolbarIconColor = expoCropToolbarIconColor ?: defaultContentColor

    // Set the current icon color for menu tinting
    currentIconColor = toolbarIconColor

    // Remove action bar elevation for a flat design
    supportActionBar?.elevation = 0f

    options.activityBackgroundColor = activityBackgroundColor
    options.activityMenuIconColor = toolbarIconColor
    options.activityMenuTextColor = expoCropToolbarActionTextColor ?: defaultContentColor
    options.toolbarBackButtonColor = expoCropBackButtonIconColor ?: toolbarIconColor
    options.toolbarColor = toolbarColor
    options.toolbarTitleColor = toolbarIconColor

    window.run {
      // Create a view that will sit behind the status bar, colored to match the toolbar
      val statusBarView = View(context).apply { setBackgroundColor(toolbarColor) }

      // Draw content edge-to-edge, behind system bars
      WindowCompat.enableEdgeToEdge(this)

      // Set system bar icon colors based on the current theme (dark icons on light bg, and vice versa)
      WindowInsetsControllerCompat(this, decorView).run {
        isAppearanceLightStatusBars = !isNight
        isAppearanceLightNavigationBars = !isNight
      }

      // Set the root background color so it shows through transparent system bars
      decorView.setBackgroundColor(activityBackgroundColor)

      // Add the status bar view with zero initial height (will be sized by insets listener below)
      addContentView(statusBarView,
        ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0))

      // Dynamically resize the status bar view to match the actual status bar / display cutout height
      ViewCompat.setOnApplyWindowInsetsListener(decorView) { _, insets ->
        val values = insets.getInsets(
          WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.displayCutout())
        statusBarView.updateLayoutParams { height = values.top }
        insets
      }
    }
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
