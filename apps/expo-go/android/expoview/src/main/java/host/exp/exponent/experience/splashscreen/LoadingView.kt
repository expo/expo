package host.exp.exponent.experience.splashscreen

import android.content.Context
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.widget.ProgressBar
import android.widget.RelativeLayout
import host.exp.expoview.R

/**
 * The only purpose of this view is to present Android progressBar (spinner) before manifest with experience-related info is available
 */
class LoadingView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
  defStyleAttr: Int = 0
) : RelativeLayout(context, attrs, defStyleAttr) {
  private val progressBar: ProgressBar
  private val progressBarHandler = Handler(Looper.getMainLooper())
  private var progressBarShown = false

  init {
    LayoutInflater.from(context).inflate(R.layout.loading_view, this, true)
    progressBar = findViewById(R.id.progressBar)
    setBackgroundColor(Color.WHITE)
    show()
  }

  fun show() {
    if (progressBarShown) {
      return
    }
    progressBarHandler.postDelayed(
      {
        progressBar.visibility = View.VISIBLE
        progressBar.startAnimation(
          AlphaAnimation(0.0f, 1.0f).also {
            it.duration = 250
            it.interpolator = AccelerateDecelerateInterpolator()
            it.fillAfter = true
          }
        )
        progressBarShown = true
      },
      PROGRESS_BAR_DELAY_MS
    )
  }

  fun hide() {
    if (!progressBarShown) {
      return
    }
    progressBarHandler.removeCallbacksAndMessages(null)
    progressBar.clearAnimation()
    if (progressBar.visibility == View.VISIBLE) {
      progressBar.startAnimation(
        AlphaAnimation(1.0f, 0.0f).also {
          it.duration = 250
          it.interpolator = AccelerateDecelerateInterpolator()
          it.fillAfter = true
          it.setAnimationListener(object : Animation.AnimationListener {
            override fun onAnimationStart(animation: Animation) {}
            override fun onAnimationRepeat(animation: Animation) {}
            override fun onAnimationEnd(animation: Animation) {
              progressBar.visibility = View.GONE
              progressBarShown = false
            }
          })
        }
      )
    }
  }

  companion object {
    private const val PROGRESS_BAR_DELAY_MS = 2500L
  }
}
