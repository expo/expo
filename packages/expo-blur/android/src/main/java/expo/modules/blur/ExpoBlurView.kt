package expo.modules.blur

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
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

  private val blurView = BlurView(context).also {
    it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(it)
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
      BlurMethod.DIMEZIS_BLUR_VIEW -> {
        applyBlurViewOverlayColorCompat(true)
      }

      BlurMethod.NONE -> {
        applyBlurViewOverlayColorCompat(false)
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
