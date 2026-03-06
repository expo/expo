package expo.modules.blur

import android.content.Context
import android.view.View
import android.view.View.MeasureSpec
import android.view.ViewGroup
import eightbitlab.com.blurview.BlurTarget
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class ExpoBlurTargetView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  internal val blurTargetView: BlurTarget = UIManagerCompatibleBlurTarget(appContext, context)

  init {
    super.addView(
      blurTargetView,
      LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT
      )
    )
  }

  /**
   * When adding a child to this view, we want to actually add it to the blur target view.
   * Because of this we need to override add, remove and measurement methods.
   */
  override fun addView(child: View?) {
    if (child === blurTargetView) {
      super.addView(child)
      return
    }
    blurTargetView.addView(child)
  }

  override fun addView(child: View?, index: Int) {
    if (child === blurTargetView) {
      super.addView(child, index)
      return
    }
    blurTargetView.addView(child, index)
  }

  override fun addView(child: View?, params: ViewGroup.LayoutParams?) {
    if (child === blurTargetView) {
      super.addView(child, toHostLayoutParams(params))
      return
    }
    blurTargetView.addView(child, params)
  }

  override fun addView(child: View?, index: Int, params: ViewGroup.LayoutParams?) {
    if (child === blurTargetView) {
      super.addView(child, index, toHostLayoutParams(params))
      return
    }
    blurTargetView.addView(child, index, params)
  }

  override fun addView(child: View?, width: Int, height: Int) {
    if (child === blurTargetView) {
      super.addView(child, width, height)
      return
    }
    blurTargetView.addView(child, width, height)
  }

  override fun updateViewLayout(view: View?, params: ViewGroup.LayoutParams?) {
    if (view === blurTargetView) {
      super.updateViewLayout(view, toHostLayoutParams(params))
      return
    }
    blurTargetView.updateViewLayout(view, params)
  }

  override fun removeView(view: View?) {
    if (view === blurTargetView) {
      super.removeView(view)
      return
    }
    blurTargetView.removeView(view)
  }

  override fun removeViewAt(index: Int) = blurTargetView.removeViewAt(index)

  override fun removeViews(start: Int, count: Int) = blurTargetView.removeViews(start, count)

  override fun removeViewsInLayout(start: Int, count: Int) = blurTargetView.removeViewsInLayout(start, count)

  override fun removeAllViews() = blurTargetView.removeAllViews()

  override fun removeAllViewsInLayout() = blurTargetView.removeAllViewsInLayout()

  override fun getChildCount(): Int = blurTargetView.childCount

  override fun getChildAt(index: Int): View? = blurTargetView.getChildAt(index)

  override fun indexOfChild(child: View?): Int = blurTargetView.indexOfChild(child)

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = MeasureSpec.getSize(widthMeasureSpec)
    val height = MeasureSpec.getSize(heightMeasureSpec)
    setMeasuredDimension(width, height)

    blurTargetView.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    blurTargetView.layout(0, 0, right - left, bottom - top)
  }

  private fun toHostLayoutParams(params: ViewGroup.LayoutParams?): LayoutParams = when (params) {
    null -> LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    is LayoutParams -> params
    else -> LayoutParams(params)
  }
}
