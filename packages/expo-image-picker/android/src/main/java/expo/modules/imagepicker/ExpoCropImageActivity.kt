package expo.modules.imagepicker

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.view.Gravity
import android.view.Menu
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.updateLayoutParams
import androidx.lifecycle.lifecycleScope
import com.canhub.cropper.CropImageActivity
import com.canhub.cropper.CropImageOptions
import com.canhub.cropper.CropImageView
import expo.modules.imagepicker.ExpoCropImageUtils.getColorResource
import expo.modules.imagepicker.ExpoCropImageUtils.getThemeColor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

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
  private var contentFit: ContentFit = ContentFit.FILL
  private var contentFitAspectX: Int = 0
  private var contentFitAspectY: Int = 0
  private var isApplyingContentFit = false
  private var didApplyContentFit = false
  private var contentFitFile: File? = null
  private var contentFitLoadingOverlay: View? = null

  // region Lifecycle Methods
  override fun onCreate(savedInstanceState: android.os.Bundle?) {
    contentFit = ContentFit.entries.find { it.value == intent.getStringExtra(CONTENT_FIT_KEY) } ?: ContentFit.FILL
    contentFitAspectX = intent.getIntExtra(CONTENT_FIT_ASPECT_X_KEY, 0)
    contentFitAspectY = intent.getIntExtra(CONTENT_FIT_ASPECT_Y_KEY, 0)

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
    contentFitLoadingOverlay = null
    contentFitFile?.delete()
    contentFitFile = null

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
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )

      view.updateLayoutParams<ViewGroup.MarginLayoutParams> {
        setMargins(values.left, values.top, values.right, values.bottom)
      }

      insets
    }
  }

  override fun onSetImageUriComplete(view: CropImageView, uri: Uri, error: Exception?) {
    if (error == null && shouldApplyContainContentFit()) {
      applyContainContentFit(view, uri)
      return
    }

    hideContentFitLoadingIndicator()
    super.onSetImageUriComplete(view, uri, error)
  }

  // endregion

  private fun shouldApplyContainContentFit(): Boolean {
    return contentFit == ContentFit.CONTAIN &&
      contentFitAspectX > 0 &&
      contentFitAspectY > 0 &&
      !isApplyingContentFit &&
      !didApplyContentFit
  }

  private fun applyContainContentFit(view: CropImageView, uri: Uri) {
    isApplyingContentFit = true
    showContentFitLoadingIndicator()

    lifecycleScope.launch {
      val paddedFile = runCatching {
        withContext(Dispatchers.Default) {
          createPaddedContentFitFile(uri, contentFitAspectX, contentFitAspectY)
        }
      }.getOrNull()

      isApplyingContentFit = false
      didApplyContentFit = true

      if (paddedFile == null) {
        hideContentFitLoadingIndicator()
        super@ExpoCropImageActivity.onSetImageUriComplete(view, uri, null)
        return@launch
      }

      contentFitFile?.delete()
      contentFitFile = paddedFile
      view.setImageUriAsync(Uri.fromFile(paddedFile))
    }
  }

  private fun showContentFitLoadingIndicator() {
    cropImageViewRef?.visibility = View.INVISIBLE

    if (contentFitLoadingOverlay == null) {
      contentFitLoadingOverlay = FrameLayout(this).apply {
        addView(
          ProgressBar(context).apply {
            isIndeterminate = true
            indeterminateTintList = ColorStateList.valueOf(getLoadingIndicatorColor())
          },
          FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER
          )
        )
      }

      addContentView(
        contentFitLoadingOverlay,
        ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
      )
    }

    contentFitLoadingOverlay?.visibility = View.VISIBLE
  }

  private fun hideContentFitLoadingIndicator() {
    cropImageViewRef?.visibility = View.VISIBLE
    contentFitLoadingOverlay?.visibility = View.GONE
  }

  private fun getLoadingIndicatorColor(): Int {
    val isNight = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
      android.content.res.Configuration.UI_MODE_NIGHT_YES

    return if (isNight) Color.WHITE else Color.BLACK
  }

  private fun createPaddedContentFitFile(uri: Uri, aspectX: Int, aspectY: Int): File? {
    val bitmap = readBitmap(uri)
    val paddedBitmap = bitmap.createPaddedBitmap(aspectX, aspectY)
    if (paddedBitmap == null) {
      bitmap.recycle()
      return null
    }

    try {
      val outputFile = createOutputFile(cacheDir, Bitmap.CompressFormat.PNG.toImageFileExtension())
      FileOutputStream(outputFile).use { outputStream ->
        paddedBitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
      }
      return outputFile
    } finally {
      bitmap.recycle()
      paddedBitmap.recycle()
    }
  }

  private fun readBitmap(uri: Uri): Bitmap {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      ImageDecoder.decodeBitmap(ImageDecoder.createSource(contentResolver, uri)) { decoder, _, _ ->
        decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
      }
    } else {
      @Suppress("DEPRECATION")
      MediaStore.Images.Media.getBitmap(contentResolver, uri)
    }
  }

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

  companion object {
    const val CONTENT_FIT_KEY = "expo.modules.imagepicker.CONTENT_FIT"
    const val CONTENT_FIT_ASPECT_X_KEY = "expo.modules.imagepicker.CONTENT_FIT_ASPECT_X"
    const val CONTENT_FIT_ASPECT_Y_KEY = "expo.modules.imagepicker.CONTENT_FIT_ASPECT_Y"
  }
}

private fun Bitmap.createPaddedBitmap(aspectX: Int, aspectY: Int): Bitmap? {
  val (paddedWidth, paddedHeight) = calculatePaddedSize(width, height, aspectX, aspectY) ?: return null
  val paddedBitmap = Bitmap.createBitmap(paddedWidth, paddedHeight, Bitmap.Config.ARGB_8888)
  val left = (paddedWidth - width) / 2
  val top = (paddedHeight - height) / 2

  Canvas(paddedBitmap).apply {
    drawColor(Color.BLACK)
    drawBitmap(this@createPaddedBitmap, left.toFloat(), top.toFloat(), null)
  }

  return paddedBitmap
}

private fun calculatePaddedSize(width: Int, height: Int, aspectX: Int, aspectY: Int): Pair<Int, Int>? {
  val widthScaledByTargetHeight = width.toLong() * aspectY
  val heightScaledByTargetWidth = height.toLong() * aspectX

  return when {
    widthScaledByTargetHeight == heightScaledByTargetWidth -> null
    widthScaledByTargetHeight > heightScaledByTargetWidth -> {
      width to ceilToBalancedPadding(widthScaledByTargetHeight, aspectX, height)
    }
    else -> {
      ceilToBalancedPadding(heightScaledByTargetWidth, aspectY, width) to height
    }
  }
}

private fun ceilToBalancedPadding(value: Long, divisor: Int, originalSize: Int): Int {
  var paddedSize = ((value + divisor - 1) / divisor).toInt()
  if ((paddedSize - originalSize) % 2 != 0) {
    paddedSize += 1
  }
  return paddedSize
}
