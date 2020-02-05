package expo.modules.splashscreen

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.RelativeLayout

@SuppressLint("ViewConstructor")
class SplashScreenView(
  context: Context,
  mode: SplashScreenMode,
  splashScreenConfigurator: SplashScreenConfigurator
) : RelativeLayout(context) {
  val imageView: ImageView

  init {
    imageView = ImageView(context).also { view ->
      view.layoutParams = LayoutParams(
        LayoutParams.FILL_PARENT,
        LayoutParams.FILL_PARENT
      ).also { layoutParams ->
        layoutParams.addRule(CENTER_IN_PARENT, TRUE)
      }
    }

    layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    setBackgroundColor(splashScreenConfigurator.getBackgroundColor(context))
    addView(imageView)

    imageView.scaleType = mode.scaleType
    when (mode) {
      SplashScreenMode.NATIVE -> {}
      SplashScreenMode.CONTAIN -> { imageView.adjustViewBounds = true }
      SplashScreenMode.COVER -> {}
    }
    splashScreenConfigurator.configureImageView(context, imageView, mode)
    splashScreenConfigurator.configureSplashScreen(context, this)
  }
}