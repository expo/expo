package expo.modules.splashscreen

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.RelativeLayout

// this needs to stay for versioning to work
/* ktlint-disable no-unused-imports */
import expo.modules.splashscreen.SplashScreenImageResizeMode
/* ktlint-enable no-unused-imports */

@SuppressLint("ViewConstructor")
class SplashScreenView(
  context: Context
) : RelativeLayout(context) {
  val imageView: ImageView = ImageView(context).also { view ->
    view.layoutParams = LayoutParams(
      LayoutParams.MATCH_PARENT,
      LayoutParams.MATCH_PARENT
    )
  }

  init {
    layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    isClickable = true

    addView(imageView)
  }

  fun configureImageViewResizeMode(resizeMode: SplashScreenImageResizeMode) {
    imageView.scaleType = resizeMode.scaleType
    when (resizeMode) {
      SplashScreenImageResizeMode.NATIVE -> {}
      SplashScreenImageResizeMode.CONTAIN -> {
        imageView.adjustViewBounds = true
      }
      SplashScreenImageResizeMode.COVER -> {}
    }
  }
}
