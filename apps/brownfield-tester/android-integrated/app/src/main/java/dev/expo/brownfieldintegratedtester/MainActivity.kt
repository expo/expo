package dev.expo.brownfieldintegratedtester

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import host.exp.exponent.brownfield.ReactNativeFragment
import host.exp.exponent.brownfield.ReactNativeHostManager
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

class MainActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ReactNativeHostManager.shared.initialize(this.application)
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

                setOnClickListener {
                    startActivity(
                        Intent(
                            context,
                            ReactNativeActivity::class.java
                        )
                    )
                }
            }

        val customComponent = if (savedInstanceState == null) {
            ReactNativeFragment.createFragmentHost(this, "custom-component").apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    400
                )
            }
        } else {
            FrameLayout(this).apply {
                id = View.generateViewId()
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    400
                )
            }
        }

        rootLayout.addView(button)
        rootLayout.addView(customComponent)
        setContentView(rootLayout)
    }

    override fun invokeDefaultOnBackPressed() {
        // TODO: Implement this
    }
}
