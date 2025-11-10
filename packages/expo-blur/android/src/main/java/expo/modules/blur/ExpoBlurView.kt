package expo.modules.blur

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.Outline
import android.os.Build
import android.view.View
import android.view.ViewOutlineProvider
import eightbitlab.com.blurview.BlurView
import expo.modules.blur.enums.BlurMethod
import expo.modules.blur.enums.TintStyle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

private enum class BlurViewConfiguration {
  // BlurView is yet to be configured.
  UNCONFIGURED,

  // BlurView has been configured to use the `NONE` blur method
  NONE,

  // Blur View has been configured to use the `DIMEZIS_BLUR_VIEW` method
  DIMEZIS
}

@SuppressLint("ViewConstructor")
class ExpoBlurView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var blurMethod: BlurMethod = BlurMethod.NONE
  private var blurReduction = 4f
  private var blurRadius = 50f
  internal var tint: TintStyle = TintStyle.DEFAULT
  private var blurConfiguration = BlurViewConfiguration.NONE
  private var blurTargetId: Int? = null
  private var blurTarget: ExpoBlurTargetView? = null

  // Border radius properties
  private var radius: Float? = null
  private var topLeftRadius: Float? = null
  private var topRightRadius: Float? = null
  private var bottomLeftRadius: Float? = null
  private var bottomRightRadius: Float? = null
  private var topStartRadius: Float? = null
  private var topEndRadius: Float? = null
  private var bottomStartRadius: Float? = null
  private var bottomEndRadius: Float? = null

  private val blurView = BlurView(context).also {
    it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(it)
  }

  init {
    clipToOutline = true
  }

  private fun updateBorderRadius() {
    val density = resources.displayMetrics.density

    val finalTopLeft: Float
    val finalTopRight: Float
    val finalBottomLeft: Float
    val finalBottomRight: Float

    val isRTL = layoutDirection == View.LAYOUT_DIRECTION_RTL

    if (isRTL) {
      finalTopLeft = (topLeftRadius ?: topEndRadius ?: radius ?: 0f) * density
      finalTopRight = (topRightRadius ?: topStartRadius ?: radius ?: 0f) * density
      finalBottomLeft = (bottomLeftRadius ?: bottomEndRadius ?: radius ?: 0f) * density
      finalBottomRight = (bottomRightRadius ?: bottomStartRadius ?: radius ?: 0f) * density
    } else {
      finalTopLeft = (topLeftRadius ?: topStartRadius ?: radius ?: 0f) * density
      finalTopRight = (topRightRadius ?: topEndRadius ?: radius ?: 0f) * density
      finalBottomLeft = (bottomLeftRadius ?: bottomStartRadius ?: radius ?: 0f) * density
      finalBottomRight = (bottomRightRadius ?: bottomEndRadius ?: radius ?: 0f) * density
    }

    // Check if all corners have the same radius for optimization
    val allCornersEqual = finalTopLeft == finalTopRight &&
            finalTopRight == finalBottomLeft &&
            finalBottomLeft == finalBottomRight

    if (allCornersEqual && finalTopLeft == 0f) {
      // No border radius, remove outline provider
      outlineProvider = ViewOutlineProvider.BACKGROUND
      clipToOutline = false
    } else {
      clipToOutline = true
      outlineProvider = object : ViewOutlineProvider() {
        override fun getOutline(view: View, outline: Outline) {
          if (allCornersEqual) {
            // Use simple round rect for better performance
            outline.setRoundRect(0, 0, view.width, view.height, finalTopLeft)
          } else {
            // For different corner radii, we need to use a path (API level 30)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
              val path = android.graphics.Path()
              val radii = floatArrayOf(
                finalTopLeft, finalTopLeft,
                finalTopRight, finalTopRight,
                finalBottomRight, finalBottomRight,
                finalBottomLeft, finalBottomLeft
              )
              path.addRoundRect(
                0f, 0f, view.width.toFloat(), view.height.toFloat(),
                radii,
                android.graphics.Path.Direction.CW
              )
              outline.setPath(path)
            } else {
              // Fallback to simple round rect with the minimum radius
              val minRadius = minOf(finalTopLeft, finalTopRight, finalBottomLeft, finalBottomRight)
              outline.setRoundRect(0, 0, view.width, view.height, minRadius)
            }
          }
        }
      }
    }
    invalidateOutline()
  }

  fun setBorderRadius(radius: Float?) {
    this.radius = radius
    updateBorderRadius()
  }

  fun setBorderTopLeftRadius(radius: Float?) {
    this.topLeftRadius = radius
    updateBorderRadius()
  }

  fun setBorderTopRightRadius(radius: Float?) {
    this.topRightRadius = radius
    updateBorderRadius()
  }

  fun setBorderBottomLeftRadius(radius: Float?) {
    this.bottomLeftRadius = radius
    updateBorderRadius()
  }

  fun setBorderBottomRightRadius(radius: Float?) {
    this.bottomRightRadius = radius
    updateBorderRadius()
  }

  fun setBorderTopStartRadius(radius: Float?) {
    this.topStartRadius = radius
    updateBorderRadius()
  }

  fun setBorderTopEndRadius(radius: Float?) {
    this.topEndRadius = radius
    updateBorderRadius()
  }

  fun setBorderBottomStartRadius(radius: Float?) {
    this.bottomStartRadius = radius
    updateBorderRadius()
  }

  fun setBorderBottomEndRadius(radius: Float?) {
    this.bottomEndRadius = radius
    updateBorderRadius()
  }

  fun setBlurTargetId(blurTargetId: Int?) {
    if (blurTargetId == this.blurTargetId) {
      return
    }

    if (blurTargetId == null) {
      blurTarget = null
    } else {
      val blurTargetView = appContext.findView<ExpoBlurTargetView>(blurTargetId)
      blurTarget = blurTargetView
    }

    this.blurTargetId = blurTargetId
    configureBlurView()
  }

  fun setBlurRadius(radius: Float) {
    blurRadius = radius

    if (blurConfiguration == BlurViewConfiguration.UNCONFIGURED) return

    when (blurMethod) {
      BlurMethod.NONE -> {
        applyBlurViewRadiusCompat(false, radius)
      }

      BlurMethod.DIMEZIS_BLUR_VIEW -> {
        applyBlurViewRadiusCompat(true, radius)
      }

      BlurMethod.DIMEZIS_BLUR_VIEW_SDK_31_PLUS -> {
        applyBlurViewRadiusCompat(Build.VERSION.SDK_INT >= 31, radius)
      }
    }
  }

  fun setBlurMethod(method: BlurMethod) {
    blurMethod = method
    // re-configure if the method was changed from none -> dimezis at runtime
    if (method != BlurMethod.NONE && blurConfiguration != BlurViewConfiguration.DIMEZIS) {
      configureBlurView()
      applyTint()
      setBlurRadius(blurRadius)
    }

    val safeMethod = if (blurTarget != null) {
      method
    } else {
      BlurMethod.NONE
    }

    if (blurConfiguration == BlurViewConfiguration.UNCONFIGURED) return

    when (safeMethod) {
      BlurMethod.NONE -> {
        blurView.setBlurEnabled(false)
      }

      BlurMethod.DIMEZIS_BLUR_VIEW -> {
        blurView.setBlurEnabled(true)
        setBackgroundColor(Color.TRANSPARENT)
      }

      BlurMethod.DIMEZIS_BLUR_VIEW_SDK_31_PLUS -> {
        val isNewSdk = Build.VERSION.SDK_INT >= 31
        blurView.setBlurEnabled(isNewSdk)

        if (isNewSdk) {
          this.setBackgroundColor(Color.TRANSPARENT)
        }
      }

      BlurMethod.DIMEZIS_BLUR_VIEW_SDK_31_PLUS -> {
        val isNewSdk = Build.VERSION.SDK_INT >= 31
        blurView.setBlurEnabled(isNewSdk)

        if (isNewSdk) {
          this.setBackgroundColor(Color.TRANSPARENT)
        }
      }
    }
    // Update of the blur to the current blurRadius value
    setBlurRadius(blurRadius)
  }

  fun applyBlurReduction(reductionFactor: Float) {
    blurReduction = reductionFactor
    setBlurRadius(blurRadius)
  }

  fun applyTint() {
    if (blurConfiguration == BlurViewConfiguration.UNCONFIGURED) return

    when (blurMethod) {
      BlurMethod.NONE -> {
        applyBlurViewOverlayColorCompat(false)
      }

      BlurMethod.DIMEZIS_BLUR_VIEW -> {
        applyBlurViewOverlayColorCompat(true)
      }

      BlurMethod.DIMEZIS_BLUR_VIEW_SDK_31_PLUS -> {
        applyBlurViewOverlayColorCompat(Build.VERSION.SDK_INT >= 31)
      }
    }
    blurView.invalidate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    // Now we can safely walk the parent hierarchy
    if (blurConfiguration == BlurViewConfiguration.UNCONFIGURED) {
      configureBlurView()
      applyCurrentBlurSettings()
    }
  }

  private fun configureBlurView() {
    if (blurTarget == null || blurMethod == BlurMethod.NONE) {
      blurView.setBlurEnabled(false)
      blurConfiguration == BlurViewConfiguration.NONE
      return
    }

    val decorView = appContext.throwingActivity.window?.decorView
      ?: throw BlurViewConfigurationException("Failed to find a decor view associated with the blur view")

    val dimezisBlurTarget = blurTarget?.blurTargetView
      ?: throw BlurViewConfigurationException("The BlurView targeting blur target with id: $blurTargetId couldn't find the target")

    blurView.setupWith(dimezisBlurTarget)
      .setFrameClearDrawable(decorView.background)
      .setBlurRadius(blurRadius)

    blurConfiguration = BlurViewConfiguration.DIMEZIS
  }

  /**
   * Apply blur settings that may have been set before the BlurView was configured.
   */
  private fun applyCurrentBlurSettings() {
    setBlurRadius(blurRadius)
    setBlurMethod(blurMethod)
    applyTint()
  }

  private fun applyBlurViewRadiusCompat(useBlur: Boolean, radius: Float) {
    if (useBlur && blurTarget != null) {
      // When setting a blur directly to 0 a "nativePtr is null" exception is thrown
      // https://issuetracker.google.com/issues/241546169
      blurView.setBlurEnabled(radius != 0f)
      if (radius > 0f) {
        blurView.setBlurRadius(radius / blurReduction)
        blurView.invalidate()
      }
    } else {
      setBackgroundColor(tint.toBlurEffect(radius))
    }
  }

  private fun applyBlurViewOverlayColorCompat(useBlurView: Boolean) {
    if (useBlurView && blurTarget != null) {
      blurView.setOverlayColor(tint.toBlurEffect(blurRadius))
    } else {
      setBackgroundColor(tint.toBlurEffect(blurRadius))
    }
  }
}
