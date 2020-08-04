package expo.modules.splashscreen

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.RelativeLayout

@SuppressLint("ViewConstructor")
class SplashScreenView(
  context: Context,
  resizeMode: SplashScreenImageResizeMode,
  splashScreenResourcesProvider: SplashScreenResourcesProvider
) : RelativeLayout(context) {
  private val imageView: ImageView

  init {
    imageView = ImageView(context).also { view ->
      view.layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT
      )
    }

    layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    setBackgroundColor(splashScreenResourcesProvider.getBackgroundColor(context))

    addView(imageView)
    imageView.setImageResource(splashScreenResourcesProvider.getImageResource(context))
    imageView.scaleType = resizeMode.scaleType

    when (resizeMode) {
      SplashScreenImageResizeMode.NATIVE -> {}
      SplashScreenImageResizeMode.CONTAIN -> { imageView.adjustViewBounds = true }
      SplashScreenImageResizeMode.COVER -> {}
    }
  }
}
