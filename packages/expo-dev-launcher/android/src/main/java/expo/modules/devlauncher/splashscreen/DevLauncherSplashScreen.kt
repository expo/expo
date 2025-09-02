package expo.modules.devlauncher.splashscreen

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.util.TypedValue
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.RelativeLayout

@SuppressLint("ViewConstructor")
class DevLauncherSplashScreen(
  context: Context
) : RelativeLayout(context) {
  init {
    setBackgroundColor(Color.WHITE)

    val imageWidthDPI = 85f
    val imageWidthPixels = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      imageWidthDPI,
      context.resources.displayMetrics
    )

    val imageView = ImageView(context)
    imageView.layoutParams = LayoutParams(
      imageWidthPixels.toInt(),
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply {
      addRule(CENTER_IN_PARENT, TRUE)
    }
    addView(imageView)
  }
}
