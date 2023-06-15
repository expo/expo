package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.uimanager.ThemedReactContext

class GooglePayButtonView(private val context: ThemedReactContext) : FrameLayout(context) {
  private var button: View? = null
  // Used in legacy GooglePayButton implementations
  private var buttonType: String? = null

  // Used in the new PlatformPayButton implementations
  private var type: Int? = null

  fun initialize() {
    val resAsset: Int =
      if (type != null) {
        when (type) {
          0 -> R.layout.plain_googlepay_button
          1 -> R.layout.buy_with_googlepay_button
          6 -> R.layout.book_with_googlepay_button
          5 -> R.layout.checkout_with_googlepay_button
          4 -> R.layout.donate_with_googlepay_button
          11 -> R.layout.order_with_googlepay_button
          1000 -> R.layout.pay_with_googlepay_button
          7 -> R.layout.subscribe_with_googlepay_button
          1001 -> R.layout.googlepay_mark_button
          else -> R.layout.plain_googlepay_button
        }
      } else {
        when (buttonType) {
          "pay" -> R.layout.pay_with_googlepay_button
          "standard" -> R.layout.plain_googlepay_button
          else -> R.layout.plain_googlepay_button
        }
      }

    button = LayoutInflater.from(context).inflate(
      resAsset, null
    )

    addView(button)
    viewTreeObserver.addOnGlobalLayoutListener { requestLayout() }
  }

  override fun requestLayout() {
    super.requestLayout()
    post(mLayoutRunnable)
  }

  private val mLayoutRunnable = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY))
    button?.layout(left, top, right, bottom)
  }

  fun setButtonType(type: String) {
    buttonType = type
  }

  fun setType(type: Int) {
    this.type = type
  }
}
