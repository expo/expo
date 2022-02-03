package abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.content.res.ColorStateList
import android.graphics.Color
import android.view.View
import android.view.View.OnFocusChangeListener
import android.widget.FrameLayout
import abi44_0_0.com.facebook.react.bridge.ReadableMap
import abi44_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi44_0_0.com.facebook.react.uimanager.UIManagerModule
import abi44_0_0.com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.shape.MaterialShapeDrawable
import com.stripe.android.databinding.CardMultilineWidgetBinding
import com.stripe.android.databinding.StripeCardFormViewBinding
import com.stripe.android.model.Address
import com.stripe.android.model.PaymentMethodCreateParams
import com.stripe.android.view.CardFormView
import com.stripe.android.view.CardInputListener
import host.exp.expoview.R

class CardFormView(private val context: ThemedReactContext) : FrameLayout(context) {
  private var cardForm: CardFormView = CardFormView(context, null, R.style.StripeCardFormView_Borderless)
  private var mEventDispatcher: EventDispatcher? = context.getNativeModule(UIManagerModule::class.java)?.eventDispatcher
  private var dangerouslyGetFullCardDetails: Boolean = false
  private var currentFocusedField: String? = null
  var cardParams: PaymentMethodCreateParams.Card? = null
  var cardAddress: Address? = null
  private val cardFormViewBinding = StripeCardFormViewBinding.bind(cardForm)
  private val multilineWidgetBinding = CardMultilineWidgetBinding.bind(cardFormViewBinding.cardMultilineWidget)

  init {
    cardFormViewBinding.cardMultilineWidgetContainer.isFocusable = true
    cardFormViewBinding.cardMultilineWidgetContainer.isFocusableInTouchMode = true
    cardFormViewBinding.cardMultilineWidgetContainer.requestFocus()

    addView(cardForm)
    setListeners()

    viewTreeObserver.addOnGlobalLayoutListener { requestLayout() }
  }

  fun setPostalCodeEnabled(value: Boolean) {
    val cardFormView = StripeCardFormViewBinding.bind(cardForm)
    val visibility = if (value) View.VISIBLE else View.GONE

    cardFormView.cardMultilineWidget.postalCodeRequired = false
    cardFormView.postalCodeContainer.visibility = visibility
  }

  fun setPlaceHolders(value: ReadableMap) {
    val cardFormView = StripeCardFormViewBinding.bind(cardForm)

    val numberPlaceholder = getValOr(value, "number", null)
    val expirationPlaceholder = getValOr(value, "expiration", null)
    val cvcPlaceholder = getValOr(value, "cvc", null)
    val postalCodePlaceholder = getValOr(value, "postalCode", null)

    numberPlaceholder?.let {
//      multilineWidgetBinding.tlCardNumber.hint = it
    }
    expirationPlaceholder?.let {
      multilineWidgetBinding.tlExpiry.hint = it
    }
    cvcPlaceholder?.let {
      multilineWidgetBinding.tlCvc.hint = it
    }
    postalCodePlaceholder?.let {
      cardFormView.postalCodeContainer.hint = it
    }
  }

  fun setAutofocus(value: Boolean) {
    if (value) {
      val cardNumberEditText = multilineWidgetBinding.etCardNumber
      cardNumberEditText.requestFocus()
      cardNumberEditText.showSoftKeyboard()
    }
  }

  fun requestFocusFromJS() {
    val cardNumberEditText = multilineWidgetBinding.etCardNumber
    cardNumberEditText.requestFocus()
    cardNumberEditText.showSoftKeyboard()
  }

  fun requestBlurFromJS() {
    val cardNumberEditText = multilineWidgetBinding.etCardNumber
    cardNumberEditText.hideSoftKeyboard()
    cardNumberEditText.clearFocus()
  }

  fun requestClearFromJS() {
    multilineWidgetBinding.etCardNumber.setText("")
    multilineWidgetBinding.etCvc.setText("")
    multilineWidgetBinding.etExpiry.setText("")
    cardFormViewBinding.postalCode.setText("")
  }

  private fun onChangeFocus() {
    mEventDispatcher?.dispatchEvent(
      CardFocusEvent(id, currentFocusedField)
    )
  }

  fun setCardStyle(value: ReadableMap) {
    val binding = StripeCardFormViewBinding.bind(cardForm)
    val backgroundColor = getValOr(value, "backgroundColor", null)

    binding.cardMultilineWidgetContainer.background = MaterialShapeDrawable().also { shape ->
      shape.fillColor = ColorStateList.valueOf(Color.parseColor("#FFFFFF"))
      backgroundColor?.let {
        shape.fillColor = ColorStateList.valueOf(Color.parseColor(it))
      }
    }
  }

  fun setDangerouslyGetFullCardDetails(isEnabled: Boolean) {
    dangerouslyGetFullCardDetails = isEnabled
  }

  private fun setListeners() {
    cardForm.setCardValidCallback { isValid, _ ->
      if (isValid) {
        cardForm.cardParams?.let {
          val cardParamsMap = it.toParamMap()["card"] as HashMap<*, *>
          val cardDetails: MutableMap<String, Any> = mutableMapOf(
            "expiryMonth" to cardParamsMap["exp_month"] as Int,
            "expiryYear" to cardParamsMap["exp_year"] as Int,
            "last4" to it.last4,
            "brand" to mapCardBrand(it.brand),
            "postalCode" to (it.address?.postalCode ?: ""),
            "country" to (it.address?.country ?: "")
          )

          if (dangerouslyGetFullCardDetails) {
            cardDetails["number"] = cardParamsMap["number"] as String
          }

          mEventDispatcher?.dispatchEvent(
            CardFormCompleteEvent(id, cardDetails, isValid, dangerouslyGetFullCardDetails)
          )

          cardAddress = Address.Builder()
            .setPostalCode(it.address?.postalCode)
            .setCountry(it.address?.country)
            .build()

          val binding = StripeCardFormViewBinding.bind(cardForm)
          binding.cardMultilineWidget.paymentMethodCard?.let { params -> cardParams = params }
        }
      } else {
        cardParams = null
        cardAddress = null
        mEventDispatcher?.dispatchEvent(
          CardFormCompleteEvent(id, null, isValid, dangerouslyGetFullCardDetails)
        )
      }
    }

    val cardNumberEditText = multilineWidgetBinding.etCardNumber
    val cvcEditText = multilineWidgetBinding.etCvc
    val expiryEditText = multilineWidgetBinding.etExpiry
    val postalCodeEditText = cardFormViewBinding.postalCode

    cardNumberEditText.onFocusChangeListener = OnFocusChangeListener { _, hasFocus ->
      currentFocusedField = if (hasFocus) CardInputListener.FocusField.CardNumber.toString() else null
      onChangeFocus()
    }
    cvcEditText.onFocusChangeListener = OnFocusChangeListener { _, hasFocus ->
      currentFocusedField = if (hasFocus) CardInputListener.FocusField.Cvc.toString() else null
      onChangeFocus()
    }
    expiryEditText.onFocusChangeListener = OnFocusChangeListener { _, hasFocus ->
      currentFocusedField = if (hasFocus) CardInputListener.FocusField.ExpiryDate.toString() else null
      onChangeFocus()
    }
    postalCodeEditText.onFocusChangeListener = OnFocusChangeListener { _, hasFocus ->
      currentFocusedField = if (hasFocus) CardInputListener.FocusField.PostalCode.toString() else null
      onChangeFocus()
    }
  }

  override fun requestLayout() {
    super.requestLayout()
    post(mLayoutRunnable)
  }

  private val mLayoutRunnable = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }
}
