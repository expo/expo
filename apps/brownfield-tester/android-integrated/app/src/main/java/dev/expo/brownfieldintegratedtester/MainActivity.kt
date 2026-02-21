package dev.expo.brownfieldintegratedtester

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val rootLayout =
        LinearLayout(this).apply {
          orientation = LinearLayout.VERTICAL
          gravity = Gravity.CENTER
          layoutParams =
              ViewGroup.LayoutParams(
                  ViewGroup.LayoutParams.MATCH_PARENT,
                  ViewGroup.LayoutParams.MATCH_PARENT,
              )
        }

    val button =
        Button(this).apply {
          text = "Open React Native app"
          backgroundTintList = ContextCompat.getColorStateList(context, R.color.purple_500)
          id = R.id.openReactNativeButton
          setTextColor(Color.WHITE)
          layoutParams =
              LinearLayout.LayoutParams(
                  LinearLayout.LayoutParams.WRAP_CONTENT,
                  LinearLayout.LayoutParams.WRAP_CONTENT,
              )

          setOnClickListener { startActivity(Intent(context, ReactNativeActivity::class.java)) }
        }

    rootLayout.addView(button)
    setContentView(rootLayout)
  }
}
