package expo.modules.imagepicker

import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Bundle
import android.text.Spannable
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import androidx.activity.addCallback
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.graphics.BlendModeColorFilterCompat
import androidx.core.graphics.BlendModeCompat
import androidx.core.graphics.drawable.toDrawable
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.get
import androidx.core.view.size
import androidx.core.view.updateLayoutParams
import com.canhub.cropper.CropImage
import com.canhub.cropper.CropImageOptions
import com.canhub.cropper.CropImageView
import com.canhub.cropper.R as CropperR
import com.canhub.cropper.databinding.CropImageActivityBinding
import com.canhub.cropper.parcelable
import expo.modules.imagepicker.ExpoCropImageUtils.getColorResource
import expo.modules.imagepicker.ExpoCropImageUtils.getThemeColor

/*
 * This code is based on the CropImageActivity implementation from the Android-Image-Cropper library:
 * ref: https://github.com/CanHub/Android-Image-Cropper/blob/91fa86dd5f48b9f4e5398dc77c0d40ba26903d7a/cropper/src/main/kotlin/com/canhub/cropper/CropImageActivity.kt
 * Additionally, this activity applies a custom color palette based on the application's theme
 * and ensures that all icons are tinted correctly for both light and dark modes.
 */
class ExpoCropImageActivity :
  AppCompatActivity(),
  CropImageView.OnSetImageUriCompleteListener,
  CropImageView.OnCropImageCompleteListener {
  private var currentIconColor: Int = Color.BLACK
  private var cropImageUri: Uri? = null
  private lateinit var cropImageOptions: CropImageOptions
  private var cropImageView: CropImageView? = null
  private lateinit var binding: CropImageActivityBinding

  // region OnCreate Flow
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    readCropImageOptions()
    val colors = resolveCustomizationColors()
    applyCustomizationToOptions(cropImageOptions, colors)
    setupContentView()
    applyWindowCustomization(colors)
    if (savedInstanceState == null) {
      // The cropImageView image should only be set if savedInstanceState is null
      // otherwise it would override user changes like zooming or cropping
      cropImageView?.setImageUriAsync(cropImageUri)
    }
    applyActivityBackground()
    applyToolbarCustomization()
    setupBackHandling()
  }

  private fun readCropImageOptions() {
    val bundle = intent.getBundleExtra(CropImage.CROP_IMAGE_EXTRA_BUNDLE)
    cropImageUri = bundle?.parcelable(CropImage.CROP_IMAGE_EXTRA_SOURCE)
    requireNotNull(cropImageUri) {
      "Crop image source URI is required but was not provided."
    }
    cropImageOptions = bundle?.parcelable(CropImage.CROP_IMAGE_EXTRA_OPTIONS)
      ?: CropImageOptions()
  }

  private fun resolveCustomizationColors(): CustomizationColors {
    val isNight = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
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

    return CustomizationColors(
      isNight = isNight,
      activityBackgroundColor = activityBackgroundColor,
      toolbarColor = toolbarColor,
      toolbarIconColor = toolbarIconColor,
      toolbarActionTextColor = expoCropToolbarActionTextColor ?: defaultContentColor,
      backButtonIconColor = expoCropBackButtonIconColor ?: toolbarIconColor
    )
  }

  private fun applyCustomizationToOptions(options: CropImageOptions, colors: CustomizationColors) {
    // Set the current icon color for menu tinting
    currentIconColor = colors.toolbarIconColor

    options.activityBackgroundColor = colors.activityBackgroundColor
    options.activityMenuIconColor = colors.toolbarIconColor
    options.activityMenuTextColor = colors.toolbarActionTextColor
    options.toolbarBackButtonColor = colors.backButtonIconColor
    options.toolbarColor = colors.toolbarColor
    options.toolbarTitleColor = colors.toolbarIconColor
  }

  private fun setupContentView() {
    binding = CropImageActivityBinding.inflate(layoutInflater)
    setContentView(binding.root)
    setCropImageView(binding.cropImageView)
  }

  private fun setCropImageView(cropImageView: CropImageView) {
    this.cropImageView = cropImageView

    // Inset the crop view margins so it doesn't overlap with system bars or display cutouts
    ViewCompat.setOnApplyWindowInsetsListener(cropImageView) { view, insets ->
      val values = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )

      view.updateLayoutParams<ViewGroup.MarginLayoutParams> {
        setMargins(values.left, values.top, values.right, values.bottom)
      }

      insets
    }
  }

  private fun applyWindowCustomization(colors: CustomizationColors) {
    // Remove action bar elevation for a flat design
    supportActionBar?.elevation = 0f

    window.run {
      // Create a view that will sit behind the status bar, colored to match the toolbar
      val statusBarView = View(context).apply { setBackgroundColor(colors.toolbarColor) }

      // Draw content edge-to-edge, behind system bars
      WindowCompat.enableEdgeToEdge(this)

      // Set system bar icon colors based on the current theme (dark icons on light bg, and vice versa)
      WindowInsetsControllerCompat(this, decorView).run {
        isAppearanceLightStatusBars = !colors.isNight
        isAppearanceLightNavigationBars = !colors.isNight
      }

      // Set the root background color so it shows through transparent system bars
      decorView.setBackgroundColor(colors.activityBackgroundColor)

      // Add the status bar view with zero initial height (will be sized by insets listener below)
      addContentView(
        statusBarView,
        ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0)
      )

      // Dynamically resize the status bar view to match the actual status bar / display cutout height
      ViewCompat.setOnApplyWindowInsetsListener(decorView) { _, insets ->
        val values = insets.getInsets(
          WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.displayCutout()
        )
        statusBarView.updateLayoutParams { height = values.top }
        insets
      }
    }
  }

  private fun applyActivityBackground() {
    cropImageOptions.activityBackgroundColor.let { activityBackgroundColor ->
      binding.root.setBackgroundColor(activityBackgroundColor)
    }
  }

  private fun applyToolbarCustomization() {
    supportActionBar?.let { actionBar ->
      title = cropImageOptions.activityTitle.ifEmpty { "" }
      actionBar.setDisplayHomeAsUpEnabled(true)
      applyToolbarColor(actionBar)
      applyToolbarTitleColor()
      applyToolbarBackButtonColor(actionBar)
    }
  }

  private fun applyToolbarColor(actionBar: ActionBar) {
    cropImageOptions.toolbarColor?.let { toolbarColor ->
      actionBar.setBackgroundDrawable(toolbarColor.toDrawable())
    }
  }

  private fun applyToolbarTitleColor() {
    cropImageOptions.toolbarTitleColor?.let { toolbarTitleColor ->
      val spannableTitle: Spannable = SpannableString(title)
      spannableTitle.setSpan(
        ForegroundColorSpan(toolbarTitleColor),
        0,
        spannableTitle.length,
        Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
      )
      title = spannableTitle
    }
  }

  private fun applyToolbarBackButtonColor(actionBar: ActionBar) {
    cropImageOptions.toolbarBackButtonColor?.let { backBtnColor ->
      try {
        val upArrow = ContextCompat.getDrawable(
          this,
          CropperR.drawable.ic_arrow_back_24
        )
        upArrow?.colorFilter = PorterDuffColorFilter(backBtnColor, PorterDuff.Mode.SRC_ATOP)
        actionBar.setHomeAsUpIndicator(upArrow)
      } catch (e: Exception) {
        Log.w("ExpoCropImage", "Failed to set back button color", e)
      }
    }
  }

  private fun setupBackHandling() {
    onBackPressedDispatcher.addCallback {
      setResultCancel()
    }
  }
  // endregion

  // region Activity Overrides
  public override fun onStart() {
    super.onStart()
    cropImageView?.setOnSetImageUriCompleteListener(this)
    cropImageView?.setOnCropImageCompleteListener(this)
  }

  public override fun onStop() {
    super.onStop()
    cropImageView?.setOnSetImageUriCompleteListener(null)
    cropImageView?.setOnCropImageCompleteListener(null)
  }

  override fun onDestroy() {
    ViewCompat.setOnApplyWindowInsetsListener(window.decorView, null)

    cropImageView?.let { ViewCompat.setOnApplyWindowInsetsListener(it, null) }
    cropImageView = null

    super.onDestroy()
  }

  override fun onCreateOptionsMenu(menu: Menu): Boolean {
    if (cropImageOptions.skipEditing) return true
    menuInflater.inflate(CropperR.menu.crop_image_menu, menu)

    if (!cropImageOptions.allowRotation) {
      menu.removeItem(CropperR.id.ic_rotate_left_24)
      menu.removeItem(CropperR.id.ic_rotate_right_24)
    } else if (cropImageOptions.allowCounterRotation) {
      menu.findItem(CropperR.id.ic_rotate_left_24).isVisible = true
    }

    if (!cropImageOptions.allowFlipping) menu.removeItem(CropperR.id.ic_flip_24)

    if (cropImageOptions.cropMenuCropButtonTitle != null) {
      menu.findItem(CropperR.id.crop_image_menu_crop).title =
        cropImageOptions.cropMenuCropButtonTitle
    }

    var cropIcon: Drawable? = null
    try {
      if (cropImageOptions.cropMenuCropButtonIcon != 0) {
        cropIcon = ContextCompat.getDrawable(this, cropImageOptions.cropMenuCropButtonIcon)
        menu.findItem(CropperR.id.crop_image_menu_crop).icon = cropIcon
      }
    } catch (e: Exception) {
      Log.w("ExpoCropImage", "Failed to read menu crop drawable", e)
    }

    if (cropImageOptions.activityMenuIconColor != 0) {
      updateMenuItemIconColor(
        menu,
        CropperR.id.ic_rotate_left_24,
        cropImageOptions.activityMenuIconColor
      )
      updateMenuItemIconColor(
        menu,
        CropperR.id.ic_rotate_right_24,
        cropImageOptions.activityMenuIconColor
      )
      updateMenuItemIconColor(menu, CropperR.id.ic_flip_24, cropImageOptions.activityMenuIconColor)

      if (cropIcon != null) {
        updateMenuItemIconColor(
          menu,
          CropperR.id.crop_image_menu_crop,
          cropImageOptions.activityMenuIconColor
        )
      }
    }
    cropImageOptions.activityMenuTextColor?.let { menuItemsTextColor ->
      val menuItemIds = listOf(
        CropperR.id.ic_rotate_left_24,
        CropperR.id.ic_rotate_right_24,
        CropperR.id.ic_flip_24,
        CropperR.id.ic_flip_24_horizontally,
        CropperR.id.ic_flip_24_vertically,
        CropperR.id.crop_image_menu_crop
      )
      for (itemId in menuItemIds) {
        updateMenuItemTextColor(menu, itemId, menuItemsTextColor)
      }
    }

    tintAllMenuItems(menu)
    return true
  }

  override fun onPrepareOptionsMenu(menu: Menu): Boolean {
    val result = super.onPrepareOptionsMenu(menu)
    tintAllMenuItems(menu)
    return result
  }

  override fun onOptionsItemSelected(item: MenuItem) = when (item.itemId) {
    CropperR.id.crop_image_menu_crop -> {
      cropImage()
      true
    }
    CropperR.id.ic_rotate_left_24 -> {
      cropImageView?.rotateImage(-cropImageOptions.rotationDegrees)
      true
    }
    CropperR.id.ic_rotate_right_24 -> {
      cropImageView?.rotateImage(cropImageOptions.rotationDegrees)
      true
    }
    CropperR.id.ic_flip_24_horizontally -> {
      cropImageView?.flipImageHorizontally()
      true
    }
    CropperR.id.ic_flip_24_vertically -> {
      cropImageView?.flipImageVertically()
      true
    }
    android.R.id.home -> {
      setResultCancel()
      true
    }
    else -> super.onOptionsItemSelected(item)
  }

  override fun onSetImageUriComplete(view: CropImageView, uri: Uri, error: Exception?) {
    if (error == null) {
      if (cropImageOptions.initialCropWindowRectangle != null) {
        cropImageView?.cropRect = cropImageOptions.initialCropWindowRectangle
      }

      if (cropImageOptions.initialRotation > 0) {
        cropImageView?.rotatedDegrees = cropImageOptions.initialRotation
      }

      if (cropImageOptions.skipEditing) {
        cropImage()
      }
    } else {
      setResult(null, error, 1)
    }
  }

  override fun onCropImageComplete(view: CropImageView, result: CropImageView.CropResult) {
    setResult(result.uriContent, result.error, result.sampleSize)
  }
  // endregion

  // region Menu Helpers
  private fun tintAllMenuItems(menu: Menu) {
    for (i in 0 until menu.size) {
      menu[i].icon?.mutate()?.setTint(currentIconColor)
    }
  }

  private fun updateMenuItemTextColor(menu: Menu, itemId: Int, color: Int) {
    val menuItem = menu.findItem(itemId) ?: return
    val menuTitle = menuItem.title
    if (menuTitle?.isNotBlank() == true) {
      try {
        val spannableTitle: Spannable = SpannableString(menuTitle)
        spannableTitle.setSpan(
          ForegroundColorSpan(color),
          0,
          spannableTitle.length,
          Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        )
        menuItem.title = spannableTitle
      } catch (e: Exception) {
        Log.w("ExpoCropImage", "Failed to update menu item color", e)
      }
    }
  }

  private fun updateMenuItemIconColor(menu: Menu, itemId: Int, color: Int) {
    val menuItem = menu.findItem(itemId)
    if (menuItem != null) {
      val menuItemIcon = menuItem.icon
      if (menuItemIcon != null) {
        try {
          menuItemIcon.apply {
            mutate()
            colorFilter = BlendModeColorFilterCompat.createBlendModeColorFilterCompat(
              color,
              BlendModeCompat.SRC_ATOP
            )
          }
          menuItem.icon = menuItemIcon
        } catch (e: Exception) {
          Log.w("ExpoCropImage", "Failed to update menu item color", e)
        }
      }
    }
  }
  // endregion

  // region Crop Result
  private fun cropImage() {
    if (cropImageOptions.noOutputImage) {
      setResult(null, null, 1)
    } else {
      cropImageView?.croppedImageAsync(
        saveCompressFormat = cropImageOptions.outputCompressFormat,
        saveCompressQuality = cropImageOptions.outputCompressQuality,
        reqWidth = cropImageOptions.outputRequestWidth,
        reqHeight = cropImageOptions.outputRequestHeight,
        options = cropImageOptions.outputRequestSizeOptions,
        customOutputUri = cropImageOptions.customOutputUri
      )
    }
  }

  private fun setResultCancel() {
    setResult(RESULT_CANCELED)
    finish()
  }

  private fun setResult(uri: Uri?, error: Exception?, sampleSize: Int) {
    setResult(
      error?.let { CropImage.CROP_IMAGE_ACTIVITY_RESULT_ERROR_CODE } ?: RESULT_OK,
      getResultIntent(uri, error, sampleSize)
    )
    finish()
  }

  private fun getResultIntent(uri: Uri?, error: Exception?, sampleSize: Int): Intent {
    val result = CropImage.ActivityResult(
      originalUri = cropImageView?.imageUri,
      uriContent = uri,
      error = error,
      cropPoints = cropImageView?.cropPoints,
      cropRect = cropImageView?.cropRect,
      rotation = cropImageView?.rotatedDegrees ?: 0,
      wholeImageRect = cropImageView?.wholeImageRect,
      sampleSize = sampleSize
    )
    return Intent().putExtra(CropImage.CROP_IMAGE_EXTRA_RESULT, result)
  }
  // endregion

  private data class CustomizationColors(
    val isNight: Boolean,
    val activityBackgroundColor: Int,
    val toolbarColor: Int,
    val toolbarIconColor: Int,
    val toolbarActionTextColor: Int,
    val backButtonIconColor: Int
  )
}
