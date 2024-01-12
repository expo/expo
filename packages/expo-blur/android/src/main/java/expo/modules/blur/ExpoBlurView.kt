package expo.modules.blur

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.view.ViewGroup
import eightbitlab.com.blurview.BlurView
import eightbitlab.com.blurview.RenderEffectBlur
import eightbitlab.com.blurview.RenderScriptBlur
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

  private val blurView = BlurView(context).also {
    it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)

    val decorView = (appContext.currentActivity ?: throw Exceptions.MissingActivity()).window?.decorView
    val rootView = decorView?.findViewById(android.R.id.content) as ViewGroup
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      it.setupWith(rootView, RenderEffectBlur())
        .setFrameClearDrawable(decorView.background)
    } else {
      it.setupWith(rootView, RenderScriptBlur(context))
        .setFrameClearDrawable(decorView.background)
    }
    addView(it)
  }

  fun setBlurRadius(radius: Float) {
    when (blurMethod) {
      BlurMethod.NONE -> {
        this.setBackgroundColor(tint.toBlurEffect(blurRadius))
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
    blurRadius = radius
  }

  fun setBlurMethod(method: BlurMethod) {
    blurMethod = method
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
}
