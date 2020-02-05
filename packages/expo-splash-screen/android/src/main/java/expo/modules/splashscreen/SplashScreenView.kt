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
  splashScreenConfigurator: SplashScreenConfigurator
) : RelativeLayout(context) {
  val imageView: ImageView

  init {
    imageView = ImageView(context).also { view ->
      view.layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT
      ).also { layoutParams ->
        layoutParams.addRule(CENTER_IN_PARENT, TRUE)
      }
    }

    layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    setBackgroundColor(splashScreenConfigurator.getBackgroundColor(context))
    addView(imageView)

    imageView.scaleType = resizeMode.scaleType
    when (resizeMode) {
      SplashScreenImageResizeMode.NATIVE -> {}
      SplashScreenImageResizeMode.CONTAIN -> { imageView.adjustViewBounds = true }
      SplashScreenImageResizeMode.COVER -> {}
    }
    splashScreenConfigurator.configureImageView(context, imageView, resizeMode)
    splashScreenConfigurator.configureSplashScreen(context, this)
  }
}
