package expo.modules.splashscreen

import android.annotation.SuppressLint
import android.app.Activity
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.RelativeLayout
import java.lang.ref.WeakReference

@SuppressLint("ViewConstructor")
class SplashScreenView(
  activity: Activity,
  val resizeMode: SplashScreenImageResizeMode,
  splashScreenResourcesProvider: SplashScreenResourcesProvider
) : RelativeLayout(activity) {
  private val imageView: ImageView
  private val activity = WeakReference(activity)

  init {
    imageView = ImageView(activity).also { view ->
      view.layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT
      )
    }

    layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    setBackgroundColor(splashScreenResourcesProvider.getBackgroundColor(activity))

    addView(imageView)
    splashScreenResourcesProvider.configureImageView(activity, imageView, resizeMode)
    imageView.scaleType = resizeMode.scaleType
    isClickable = true

    when (resizeMode) {
      SplashScreenImageResizeMode.NATIVE -> {}
      SplashScreenImageResizeMode.CONTAIN -> { imageView.adjustViewBounds = true }
      SplashScreenImageResizeMode.COVER -> {}
    }
  }

  /**
   * TODO (@bbarthec): This solution is not nice - to be discussed
   * It might be better to switch from 'android:windowBackground' to 'android:background' regarding background
   * (but it's drawback is that every View will inherit the theme styling)
   */
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    // obtain measuredHeight of top level view (DecorView) that draws the "android:windowBackground" drawable
    // if the ResizeMode.NATIVE is being used, then we need our custom SplashView have exactly the same height to prevent visual move of optional SplashScreen image
    // TODO (@bbarthec): check how it behaves when different visibility settings are applied to StatusBar and/or NavigationBar
    // TODO (@bbarthec): check how it behaves when orientation = landscape
    if (resizeMode === SplashScreenImageResizeMode.NATIVE) {
      val decorViewMeasuredHeight = activity.get()?.window?.decorView?.measuredHeight
      val newHeightMeasureSpec: Int = decorViewMeasuredHeight?.let { MeasureSpec.makeMeasureSpec(it, MeasureSpec.EXACTLY) }
        ?: heightMeasureSpec
      super.onMeasure(widthMeasureSpec, newHeightMeasureSpec)
    } else {
      super.onMeasure(widthMeasureSpec, heightMeasureSpec);
    }
  }
}
