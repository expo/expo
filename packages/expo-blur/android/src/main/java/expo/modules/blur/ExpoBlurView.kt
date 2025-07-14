package expo.modules.blur

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.view.ViewGroup
import eightbitlab.com.blurview.BlurView
import eightbitlab.com.blurview.RenderEffectBlur
import expo.modules.blur.enums.BlurMethod
import expo.modules.blur.enums.TintStyle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.views.ExpoView

@SuppressLint("ViewConstructor")
class ExpoBlurView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var blurMethod: BlurMethod = BlurMethod.NONE
  private var blurReduction = 4f
  private var blurRadius = 50f
  internal var tint: TintStyle = TintStyle.DEFAULT
  private var isBlurViewConfigured = false

  private val blurView = BlurView(context).also {
    it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(it)
  }

  fun setBlurRadius(radius: Float) {
    blurRadius = radius

    if (!isBlurViewConfigured) return

    when (blurMethod) {
      BlurMethod.NONE -> {
        this.setBackgroundColor(tint.toBlurEffect(radius))
      }

      BlurMethod.DIMEZIS_BLUR_VIEW -> {
        // When setting a blur directly to 0 a "nativePtr is null" exception is thrown
        // https://issuetracker.google.com/issues/241546169
        blurView.setBlurEnabled(radius != 0f)
        if (radius > 0f) {
          blurView.setBlurRadius(radius / blurReduction)
          blurView.invalidate()
        }
      }
    }
  }

  fun setBlurMethod(method: BlurMethod) {
    blurMethod = method

    if (!isBlurViewConfigured) return

    when (method) {
      BlurMethod.NONE -> {
        blurView.setBlurEnabled(false)
      }

      BlurMethod.DIMEZIS_BLUR_VIEW -> {
        blurView.setBlurEnabled(true)
        this.setBackgroundColor(Color.TRANSPARENT)
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
    if (!isBlurViewConfigured) return

    when (blurMethod) {
      BlurMethod.DIMEZIS_BLUR_VIEW -> {
        blurView.setOverlayColor(tint.toBlurEffect(blurRadius))
      }

      BlurMethod.NONE -> {
        this.setBackgroundColor(tint.toBlurEffect(blurRadius))
      }
    }
    blurView.invalidate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    // Now we can safely walk the parent hierarchy
    if (!isBlurViewConfigured) {
      isBlurViewConfigured = true
      configureBlurView()
    }
  }

  private fun configureBlurView() {
    val rootView = findOptimalBlurRoot()
    val decorView = appContext.throwingActivity.window?.decorView

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      blurView.setupWith(rootView, RenderEffectBlur())
        .setFrameClearDrawable(decorView?.background)
    } else {
      @Suppress("DEPRECATION")
      blurView.setupWith(rootView, eightbitlab.com.blurview.RenderScriptBlur(context))
        .setFrameClearDrawable(decorView?.background)
    }

    // Apply any blur settings that were set before configuration
    applyCurrentBlurSettings()
  }

  /**
   * Apply blur settings that may have been set before the BlurView was configured.
   */
  private fun applyCurrentBlurSettings() {
    setBlurRadius(blurRadius)
    setBlurMethod(blurMethod)
    applyTint()
  }

  /**
   * Attempts to find the nearest Screen ancestor (from react-native-screens).
   * Falls back to app root if no Screen is found.
   */
  private fun findOptimalBlurRoot(): ViewGroup {
    val screenAncestor = findNearestScreenAncestor()
    return screenAncestor ?: getAppRootFallback()
  }

  /**
   * Walks up the view hierarchy looking for react-native-screens Screen components
   * using class name detection to avoid hard dependencies.
   */
  private fun findNearestScreenAncestor(): ViewGroup? {
    var currentParent = parent
    while (currentParent != null) {
      if (isReactNativeScreen(currentParent)) {
        return currentParent as? ViewGroup
      }
      currentParent = currentParent.parent
    }
    return null
  }

  private fun isReactNativeScreen(view: Any): Boolean {
    val className = view.javaClass.name
    return className == "com.swmansion.rnscreens.Screen"
  }

  private fun getAppRootFallback(): ViewGroup {
    val decorView = appContext.throwingActivity.window?.decorView
    return decorView?.findViewById(android.R.id.content)
      ?: throw Exceptions.MissingRootView()
  }
}
