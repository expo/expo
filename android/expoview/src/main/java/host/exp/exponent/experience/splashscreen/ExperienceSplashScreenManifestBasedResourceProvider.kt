package host.exp.exponent.experience.splashscreen

import android.content.Context
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AlphaAnimation
import android.widget.ImageView
import com.squareup.picasso.Callback
import com.squareup.picasso.Picasso
import expo.modules.splashscreen.SplashScreenImageResizeMode
import expo.modules.splashscreen.SplashScreenResourcesProvider
import host.exp.exponent.analytics.EXL


class ExperienceSplashScreenManifestBasedResourceProvider(private val config: ExperienceSplashScreenConfiguration) : SplashScreenResourcesProvider {
  companion object {
    private const val TAG: String = "ExperienceSplashScreenManifestBasedResourceProvider"
  }

  override fun getBackgroundColor(context: Context): Int {
    return config.backgroundColor
  }

  override fun configureImageView(context: Context, imageView: ImageView, resizeMode: SplashScreenImageResizeMode) {
    imageView.visibility = View.GONE
    if (config.imageUrl == null) {
      return
    }
    Picasso.with(context).load(config.imageUrl).into(imageView, object : Callback {
      override fun onSuccess() {
        imageView.visibility = View.VISIBLE
        imageView.animation = AlphaAnimation(0.0f, 1.0f).also {
          it.duration = 300
          it.interpolator = AccelerateDecelerateInterpolator()
          it.fillAfter = true
        }
      }

      override fun onError() {
        EXL.e(TAG, "Couldn't load image at url " + config.imageUrl)
      }
    })
  }
}