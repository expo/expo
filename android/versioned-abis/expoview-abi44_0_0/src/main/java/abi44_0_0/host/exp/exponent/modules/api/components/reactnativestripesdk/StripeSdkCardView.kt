package abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.text.Editable
import android.text.TextWatcher
import android.widget.FrameLayout
import abi44_0_0.com.facebook.react.bridge.ReadableMap
import abi44_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi44_0_0.com.facebook.react.uimanager.UIManagerModule
import abi44_0_0.com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.shape.CornerFamily
import com.google.android.material.shape.MaterialShapeDrawable
import com.google.android.material.shape.ShapeAppearanceModel
import com.stripe.android.databinding.CardInputWidgetBinding
import com.stripe.android.model.Address
import com.stripe.android.model.PaymentMethodCreateParams
import com.stripe.android.view.CardInputListener
import com.stripe.android.view.CardInputWidget

class StripeSdkCardView(private val context: ThemedReactContext) : FrameLayout(context) {
  private var mCardWidget: CardInputWidget
  val cardDetails: MutableMap<String, Any?> = mutableMapOf("brand" to "", "last4" to "", "expiryMonth" to null, "expiryYear" to null, "postalCode" to "")
  var cardParams: PaymentMethodCreateParams.Card? = null
  var cardAddress: Address? = null
  private var mEventDispatcher: EventDispatcher?
  private var dangerouslyGetFullCardDetails: Boolean = false

  init {
    mCardWidget = CardInputWidget(context)
    mEventDispatcher = context.getNativeModule(UIManagerModule::class.java)?.eventDispatcher

    val binding = CardInputWidgetBinding.bind(mCardWidget)
    binding.container.isFocusable = true
    binding.container.isFocusableInTouchMode = true
    binding.container.requestFocus()

    addView(mCardWidget)
    setListeners()

    viewTreeObserver.addOnGlobalLayoutListener { requestLayout() }
  }

  fun setAutofocus(value: Boolean) {
    if (value) {
      val binding = CardInputWidgetBinding.bind(mCardWidget)
      binding.cardNumberEditText.requestFocus()
      binding.cardNumberEditText.showSoftKeyboard()
    }
  }

  fun requestFocusFromJS() {
    val binding = CardInputWidgetBinding.bind(mCardWidget)
    binding.cardNumberEditText.requestFocus()
    binding.cardNumberEditText.showSoftKeyboard()
  }

  fun requestBlurFromJS() {
    val binding = CardInputWidgetBinding.bind(mCardWidget)
    binding.cardNumberEditText.hideSoftKeyboard()
    binding.cardNumberEditText.clearFocus()
    binding.container.requestFocus()
  }

  fun requestClearFromJS() {
    val binding = CardInputWidgetBinding.bind(mCardWidget)
    binding.cardNumberEditText.setText("")
    binding.cvcEditText.setText("")
    binding.expiryDateEditText.setText("")
    if (mCardWidget.postalCodeEnabled) {
      binding.postalCodeEditText.setText("")
    }
  }

  fun setCardStyle(value: ReadableMap) {
    val binding = CardInputWidgetBinding.bind(mCardWidget)
    val borderWidth = getIntOrNull(value, "borderWidth")
    val backgroundColor = getValOr(value, "backgroundColor", null)
    val borderColor = getValOr(value, "borderColor", null)
    val borderRadius = getIntOrNull(value, "borderRadius") ?: 0
    val textColor = getValOr(value, "textColor", null)
    val fontSize = getIntOrNull(value, "fontSize")
    val fontFamily = getValOr(value, "fontFamily")
    val placeholderColor = getValOr(value, "placeholderColor", null)
    val textErrorColor = getValOr(value, "textErrorColor", null)

    textColor?.let {
      binding.cardNumberEditText.setTextColor(Color.parseColor(it))
      binding.cvcEditText.setTextColor(Color.parseColor(it))
      binding.expiryDateEditText.setTextColor(Color.parseColor(it))
      binding.postalCodeEditText.setTextColor(Color.parseColor(it))
    }
    textErrorColor?.let {
      binding.cardNumberEditText.setErrorColor(Color.parseColor(it))
      binding.cvcEditText.setErrorColor(Color.parseColor(it))
      binding.expiryDateEditText.setErrorColor(Color.parseColor(it))
      binding.postalCodeEditText.setErrorColor(Color.parseColor(it))
    }
    placeholderColor?.let {
      binding.cardNumberEditText.setHintTextColor(Color.parseColor(it))
      binding.cvcEditText.setHintTextColor(Color.parseColor(it))
      binding.expiryDateEditText.setHintTextColor(Color.parseColor(it))
      binding.postalCodeEditText.setHintTextColor(Color.parseColor(it))
    }
    fontSize?.let {
      binding.cardNumberEditText.textSize = it.toFloat()
      binding.cvcEditText.textSize = it.toFloat()
      binding.expiryDateEditText.textSize = it.toFloat()
      binding.postalCodeEditText.textSize = it.toFloat()
    }
    fontFamily?.let {
      binding.cardNumberEditText.typeface = Typeface.create(it, Typeface.NORMAL)
      binding.cvcEditText.typeface = Typeface.create(it, Typeface.NORMAL)
      binding.expiryDateEditText.typeface = Typeface.create(it, Typeface.NORMAL)
      binding.postalCodeEditText.typeface = Typeface.create(it, Typeface.NORMAL)
    }

    mCardWidget.setPadding(40, 0, 40, 0)
    mCardWidget.background = MaterialShapeDrawable(
      ShapeAppearanceModel()
        .toBuilder()
        .setAllCorners(CornerFamily.ROUNDED, (borderRadius * 2).toFloat())
        .build()
    ).also { shape ->
      shape.strokeWidth = 0.0f
      shape.strokeColor = ColorStateList.valueOf(Color.parseColor("#000000"))
      shape.fillColor = ColorStateList.valueOf(Color.parseColor("#FFFFFF"))
      borderWidth?.let {
        shape.strokeWidth = (it * 2).toFloat()
      }
      borderColor?.let {
        shape.strokeColor = ColorStateList.valueOf(Color.parseColor(it))
      }
      backgroundColor?.let {
        shape.fillColor = ColorStateList.valueOf(Color.parseColor(it))
      }
    }
  }

  fun setPlaceHolders(value: ReadableMap) {
    val binding = CardInputWidgetBinding.bind(mCardWidget)
    val numberPlaceholder = getValOr(value, "number", null)
    val expirationPlaceholder = getValOr(value, "expiration", null)
    val cvcPlaceholder = getValOr(value, "cvc", null)
    val postalCodePlaceholder = getValOr(value, "postalCode", null)

    numberPlaceholder?.let {
      binding.cardNumberEditText.hint = it
    }
    expirationPlaceholder?.let {
      binding.expiryDateEditText.hint = it
    }
    cvcPlaceholder?.let {
      mCardWidget.setCvcLabel(it)
    }
    postalCodePlaceholder?.let {
      binding.postalCodeEditText.hint = it
    }
  }

  fun setDangerouslyGetFullCardDetails(isEnabled: Boolean) {
    dangerouslyGetFullCardDetails = isEnabled
  }

  fun setPostalCodeEnabled(isEnabled: Boolean) {
    mCardWidget.postalCodeEnabled = isEnabled
  }

  fun getValue(): MutableMap<String, Any?> {
    return cardDetails
  }

  fun onCardChanged() {
    mCardWidget.paymentMethodCard?.let {
      cardParams = it
      cardAddress = Address.Builder()
        .setPostalCode(cardDetails["postalCode"] as String?)
        .build()
    } ?: run {
      cardParams = null
      cardAddress = null
    }

    mCardWidget.cardParams?.let {
      cardDetails["brand"] = mapCardBrand(it.brand)
      cardDetails["last4"] = it.last4
    } ?: run {
      cardDetails["brand"] = null
      cardDetails["last4"] = null
    }
    mEventDispatcher?.dispatchEvent(
      CardChangedEvent(id, cardDetails, mCardWidget.postalCodeEnabled, cardParams != null, dangerouslyGetFullCardDetails)
    )
  }

  private fun setListeners() {
    mCardWidget.setCardValidCallback { isValid, _ ->
      if (isValid) {
        onCardChanged()
      }
    }

    mCardWidget.setCardInputListener(object : CardInputListener {
      override fun onCardComplete() {}
      override fun onExpirationComplete() {}
      override fun onCvcComplete() {}

      override fun onFocusChange(focusField: CardInputListener.FocusField) {
        if (mEventDispatcher != null) {
          mEventDispatcher?.dispatchEvent(
            CardFocusEvent(id, focusField.name)
          )
        }
      }
    })

    mCardWidget.setExpiryDateTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        val splitted = var1.toString().split("/")
        cardDetails["expiryMonth"] = splitted[0].toIntOrNull()

        if (splitted.size == 2) {
          cardDetails["expiryYear"] = var1.toString().split("/")[1].toIntOrNull()
        }

        onCardChanged()
      }
    })

    mCardWidget.setPostalCodeTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        cardDetails["postalCode"] = var1.toString()
        onCardChanged()
      }
    })

    mCardWidget.setCardNumberTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        if (dangerouslyGetFullCardDetails) {
          cardDetails["number"] = var1.toString().replace(" ", "")
        }
        onCardChanged()
      }
    })

    mCardWidget.setCvcNumberTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        onCardChanged()
      }
    })
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
