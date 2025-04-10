@file:Suppress("UnusedImport") // this needs to stay for versioning to work

package host.exp.exponent.experience.splashscreen.legacy

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.RelativeLayout

// this needs to stay for versioning to work

@SuppressLint("ViewConstructor")
class SplashScreenView(
  context: Context
) : RelativeLayout(context) {
  val imageView: ImageView = ImageView(context).also { view ->
    val width = 200
    val height = 200

    val density = context.resources.displayMetrics.density
    val pixelWidth = (width * density).toInt()
    val pixelHeight = (height * density).toInt()

    val layoutParams = LayoutParams(pixelWidth, pixelHeight)
    layoutParams.addRule(CENTER_IN_PARENT)
    view.layoutParams = layoutParams
  }

  init {
    layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)

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
