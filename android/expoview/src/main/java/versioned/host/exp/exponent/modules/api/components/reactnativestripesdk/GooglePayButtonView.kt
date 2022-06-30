package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.view.LayoutInflater
import android.widget.FrameLayout
import com.facebook.react.uimanager.ThemedReactContext

class GooglePayButtonView(private val context: ThemedReactContext) : FrameLayout(context) {
  private var buttonType: String? = null

  fun initialize() {
    val type = when (buttonType) {
      "pay" -> R.layout.pay_with_googlepay_button_no_shadow
      "pay_shadow" -> R.layout.pay_with_googlepay_button
      "standard_shadow" -> R.layout.googlepay_button
      "standard" -> R.layout.googlepay_button_no_shadow
      else -> R.layout.googlepay_button
    }
    val button = LayoutInflater.from(context).inflate(
      type, null
    )

    addView(button)
  }

  fun setType(type: String) {
    buttonType = type
  }
}
