package expo.modules.blur

import android.content.Context
import android.os.Build
import android.view.ViewGroup
import eightbitlab.com.blurview.BlurView
import eightbitlab.com.blurview.RenderEffectBlur
import eightbitlab.com.blurview.RenderScriptBlur
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.views.ExpoView

class ExpoBlurView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var blurReduction = 4f
  private var blurRadius = 50f
  internal var tint = "default"

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
    // When setting a blur directly to 0 a "nativePtr is null" exception is thrown
    // https://issuetracker.google.com/issues/241546169
    blurView.setBlurEnabled(radius != 0f)
    if (radius > 0f) {
      blurView.setBlurRadius(radius / blurReduction)
      blurView.invalidate()
    }
    blurRadius = radius
  }

  fun applyBlurReduction(reductionFactor: Float) {
    blurReduction = reductionFactor
    setBlurRadius(blurRadius)
  }

  fun applyTint() {
    blurView.setOverlayColor(tint.toColorInt(blurRadius))
    blurView.invalidate()
  }
}
