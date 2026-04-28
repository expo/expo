package dev.expo.brownfieldintegratedtester

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import host.exp.exponent.brownfield.ReactNativeFragment
import host.exp.exponent.brownfield.ReactNativeHostManager
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

class MainActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ReactNativeHostManager.shared.initialize(this.application, listOf(BrownfieldTestPackage()))

        val rootLayout =
            LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.TOP
                layoutParams =
                    ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                    )
                setPadding(dpToPx(16), dpToPx(24), dpToPx(16), dpToPx(24))
            }

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            view.setPadding(
                systemBars.left + dpToPx(16),
                systemBars.top + dpToPx(24),
                systemBars.right + dpToPx(16),
                systemBars.bottom + dpToPx(24)
            )
            WindowInsetsCompat.CONSUMED
        }

        val button =
            Button(this).apply {
                text = "Open React Native app"
                backgroundTintList = ContextCompat.getColorStateList(context, R.color.purple_500)
                id = R.id.openReactNativeButton
                setTextColor(Color.WHITE)
                layoutParams =
                    LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                    ).apply {
                        setMargins(0, 0, 0, dpToPx(24))
                    }

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
                ).apply {
                    setMargins(0, dpToPx(16), 0, 0)
                }
            }
        } else {
            FrameLayout(this).apply {
                id = View.generateViewId()
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    400
                ).apply {
                    setMargins(0, dpToPx(16), 0, 0)
                }
            }
        }

        rootLayout.addView(button)
        rootLayout.addView(customComponent)
        setContentView(rootLayout)
    }

    private fun dpToPx(dp: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp.toFloat(),
            resources.displayMetrics
        ).toInt()
    }

    override fun invokeDefaultOnBackPressed() {
        // TODO: Implement this
    }
}