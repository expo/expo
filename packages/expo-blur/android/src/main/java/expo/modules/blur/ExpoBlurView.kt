package expo.modules.blur

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Path
import android.graphics.RectF
import android.os.Build
import android.util.TypedValue
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
  private val clippingPath = Path()
  private val clippingRect = RectF()
  private var borderRadii = FloatArray(8)
  private var needsClippingPathUpdate = true
  private val platformBackdrop = PlatformBackdrop()

  // `PLATFORM_BACKDROP` falls back to `DIMEZIS_BLUR_VIEW_SDK_31_PLUS` where the platform API is missing.
  private val effectiveMethod: BlurMethod
    get() = if (blurMethod == BlurMethod.PLATFORM_BACKDROP && !PlatformBackdrop.isSupported) {
      BlurMethod.DIMEZIS_BLUR_VIEW_SDK_31_PLUS
    } else {
      blurMethod
    }

  private val blurView = BlurView(context).also {
    it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(it)
  }

  fun setBorderRadii(radii: FloatArray) {
    borderRadii = FloatArray(8) { index ->
      val radius = radii.getOrElse(index) { 0f }
      TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP,
        radius,
        context.resources.displayMetrics
      )
    }
    needsClippingPathUpdate = true
    invalidate()
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
    // `setupWith` turns the blur on. Apply the blur method again, so that
    // `DIMEZIS_BLUR_VIEW_SDK_31_PLUS` doesn't blur below API 31.
    applyCurrentBlurSettings()
  }

  fun setBlurRadius(radius: Float) {
    blurRadius = radius

    if (blurConfiguration == BlurViewConfiguration.UNCONFIGURED) {
      return
    }

    when (effectiveMethod) {
      BlurMethod.NONE -> {
        applyBlurViewRadiusCompat(false, radius)
      }

      BlurMethod.PLATFORM_BACKDROP -> {
        applyBlurViewRadiusCompat(false, radius)
        invalidate()
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
    if (effectiveMethod.usesDimezis && blurConfiguration != BlurViewConfiguration.DIMEZIS) {
      configureBlurView()
      applyTint()
      setBlurRadius(blurRadius)
    }

    val safeMethod = if (blurTarget != null || effectiveMethod == BlurMethod.PLATFORM_BACKDROP) {
      effectiveMethod
    } else {
      BlurMethod.NONE
    }

    if (blurConfiguration == BlurViewConfiguration.UNCONFIGURED) {
      return
    }

    when (safeMethod) {
      BlurMethod.NONE -> {
        blurView.setBlurEnabled(false)
      }

      BlurMethod.PLATFORM_BACKDROP -> {
        blurView.setBlurEnabled(false)
        invalidate()
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
    }
    // Update of the blur to the current blurRadius value
    setBlurRadius(blurRadius)
  }

  fun applyBlurReduction(reductionFactor: Float) {
    blurReduction = reductionFactor
    setBlurRadius(blurRadius)
  }

  fun applyTint() {
    if (blurConfiguration == BlurViewConfiguration.UNCONFIGURED) {
      return
    }

    when (effectiveMethod) {
      BlurMethod.NONE, BlurMethod.PLATFORM_BACKDROP -> {
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

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    needsClippingPathUpdate = true
  }

  override fun draw(canvas: Canvas) {
    val hasBorderRadius = borderRadii.any { it > 0f }
    if (hasBorderRadius) {
      updateClippingPathIfNeeded()
    }

    // The processed backdrop is drawn first, so the tint (this view's background) and children are
    // drawn on top of it.
    if (effectiveMethod == BlurMethod.PLATFORM_BACKDROP) {
      platformBackdrop.draw(
        canvas,
        width,
        height,
        if (hasBorderRadius) clippingPath else null,
        blurRadius / blurReduction * resources.displayMetrics.density
      )
    }

    if (!hasBorderRadius) {
      super.draw(canvas)
      return
    }

    val saveCount = canvas.save()
    canvas.clipPath(clippingPath)
    super.draw(canvas)
    canvas.restoreToCount(saveCount)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    platformBackdrop.release()
  }

  private fun configureBlurView() {
    if (blurTarget == null || !effectiveMethod.usesDimezis) {
      blurView.setBlurEnabled(false)
      blurConfiguration = BlurViewConfiguration.NONE
      return
    }

    val decorView = appContext.throwingActivity.window?.decorView
      ?: throw BlurViewConfigurationException("Failed to find a decor view associated with the blur view")

    val dimezisBlurTarget = blurTarget?.blurTargetView
      ?: throw BlurViewConfigurationException("The BlurView targeting blur target with id: $blurTargetId couldn't find the target")

    blurView.setupWith(dimezisBlurTarget)
      .setFrameClearDrawable(decorView.background)
      .setBlurRadius(blurRadius / blurReduction)

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

  private fun updateClippingPathIfNeeded() {
    if (!needsClippingPathUpdate) {
      return
    }

    clippingRect.set(0f, 0f, width.toFloat(), height.toFloat())
    clippingPath.reset()
    clippingPath.addRoundRect(clippingRect, borderRadii, Path.Direction.CW)
    needsClippingPathUpdate = false
  }
}
