package expo.modules.splashscreen

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup

/**
 * The root view of the prerender surface. Like React Native's root view, it takes the size it is
 * given and leaves the frames of its children to Fabric.
 */
@SuppressLint("ViewConstructor")
internal class SplashScreenPrerenderRootView(context: Context) : ViewGroup(context) {
  init {
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
    isClickable = false
    isFocusable = false
    clipChildren = false
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit
}
