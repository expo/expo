package expo.modules.blur

import android.content.Context
import android.view.View
import android.view.ViewGroup
import eightbitlab.com.blurview.BlurTarget
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class ExpoBlurTargetView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  internal val blurTargetView: BlurTarget = UIManagerCompatibleBlurTarget(appContext, context)

  init {
    addView(
      blurTargetView,
      ViewGroup.LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT
      )
    )
  }

  override fun addView(child: View?) {
    blurTargetView.addView(child)
  }

  override fun addView(child: View?, index: Int) {
    blurTargetView.addView(child, index)
  }

  override fun addView(child: View?, width: Int, height: Int) {
    blurTargetView.addView(child, width, height)
  }

  override fun removeView(view: View?) {
    blurTargetView.removeView(view)
  }
}
