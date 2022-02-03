package expo.modules.devlauncher.splashscreen

import android.annotation.SuppressLint
import android.content.Context
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.RelativeLayout
import android.widget.TextView
import expo.modules.devlauncher.R

@SuppressLint("ViewConstructor")
class DevLauncherSplashScreen(
  context: Context,
  textColor: Int
) : RelativeLayout(context) {
  init {
    val textView = TextView(context)
    textView.text = context.getString(R.string.splash_screen_text)
    textView.gravity = Gravity.CENTER
    textView.textSize = 24F
    textView.layoutParams = LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.MATCH_PARENT
    )
    textView.setTextColor(textColor)
    addView(textView)
  }
}
