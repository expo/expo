package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Build
import android.text.Editable
import android.text.InputFilter
import android.text.TextWatcher
import android.util.Log
import android.widget.FrameLayout
import androidx.core.os.LocaleListCompat
import abi49_0_0.com.facebook.react.bridge.ReadableMap
import abi49_0_0.com.facebook.react.uimanager.PixelUtil
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi49_0_0.com.facebook.react.uimanager.UIManagerModule
import abi49_0_0.com.facebook.react.uimanager.events.EventDispatcher
import abi49_0_0.com.facebook.react.views.text.ReactTypefaceUtils
import com.google.android.material.shape.CornerFamily
import com.google.android.material.shape.MaterialShapeDrawable
import com.google.android.material.shape.ShapeAppearanceModel
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.*
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapCardBrand
import com.stripe.android.core.model.CountryCode
import com.stripe.android.core.model.CountryUtils
import com.stripe.android.databinding.StripeCardInputWidgetBinding
import com.stripe.android.model.Address
import com.stripe.android.model.PaymentMethodCreateParams
import com.stripe.android.view.CardInputListener
import com.stripe.android.view.CardInputWidget
import com.stripe.android.view.CardValidCallback
import com.stripe.android.view.StripeEditText

class CardFieldView(context: ThemedReactContext) : FrameLayout(context) {
  private var mCardWidget: CardInputWidget = CardInputWidget(context)
  private val cardInputWidgetBinding = StripeCardInputWidgetBinding.bind(mCardWidget)
  val cardDetails: MutableMap<String, Any?> = mutableMapOf("brand" to "", "last4" to "", "expiryMonth" to null, "expiryYear" to null, "postalCode" to "", "validNumber" to "Unknown", "validCVC" to "Unknown", "validExpiryDate" to "Unknown")
  var cardParams: PaymentMethodCreateParams.Card? = null
  var cardAddress: Address? = null
  private var mEventDispatcher: EventDispatcher? = context.getNativeModule(UIManagerModule::class.java)?.eventDispatcher
  private var dangerouslyGetFullCardDetails: Boolean = false
  private var currentFocusedField: String? = null
  private var isCardValid = false

  init {
    cardInputWidgetBinding.container.isFocusable = true
    cardInputWidgetBinding.container.isFocusableInTouchMode = true
    cardInputWidgetBinding.container.requestFocus()

    addView(mCardWidget)
    setListeners()

    viewTreeObserver.addOnGlobalLayoutListener { requestLayout() }
  }

  fun setAutofocus(value: Boolean) {
    if (value) {
      cardInputWidgetBinding.cardNumberEditText.requestFocus()
      cardInputWidgetBinding.cardNumberEditText.showSoftKeyboard()
    }
  }

  fun requestFocusFromJS() {
    cardInputWidgetBinding.cardNumberEditText.requestFocus()
    cardInputWidgetBinding.cardNumberEditText.showSoftKeyboard()
  }

  fun requestBlurFromJS() {
    cardInputWidgetBinding.cardNumberEditText.hideSoftKeyboard()
    cardInputWidgetBinding.cardNumberEditText.clearFocus()
    cardInputWidgetBinding.container.requestFocus()
  }

  fun requestClearFromJS() {
    cardInputWidgetBinding.cardNumberEditText.setText("")
    cardInputWidgetBinding.cvcEditText.setText("")
    cardInputWidgetBinding.expiryDateEditText.setText("")
    if (mCardWidget.postalCodeEnabled) {
      cardInputWidgetBinding.postalCodeEditText.setText("")
    }
  }

  private fun onChangeFocus() {
    mEventDispatcher?.dispatchEvent(
      CardFocusEvent(id, currentFocusedField))
  }

  fun setCardStyle(value: ReadableMap) {
    val borderWidth = getIntOrNull(value, "borderWidth")
    val backgroundColor = getValOr(value, "backgroundColor", null)
    val borderColor = getValOr(value, "borderColor", null)
    val borderRadius = getIntOrNull(value, "borderRadius") ?: 0
    val textColor = getValOr(value, "textColor", null)
    val fontSize = getIntOrNull(value, "fontSize")
    val fontFamily = getValOr(value, "fontFamily")
    val placeholderColor = getValOr(value, "placeholderColor", null)
    val textErrorColor = getValOr(value, "textErrorColor", null)
    val cursorColor = getValOr(value, "cursorColor", null)
    val bindings = setOf(
      cardInputWidgetBinding.cardNumberEditText,
      cardInputWidgetBinding.cvcEditText,
      cardInputWidgetBinding.expiryDateEditText,
      cardInputWidgetBinding.postalCodeEditText
    )

    textColor?.let {
      for (editTextBinding in bindings) {
        editTextBinding.setTextColor(Color.parseColor(it))
      }
    }
    textErrorColor?.let {
      for (editTextBinding in bindings) {
        editTextBinding.setErrorColor(Color.parseColor(it))
      }
    }
    placeholderColor?.let {
      for (editTextBinding in bindings) {
        editTextBinding.setHintTextColor(Color.parseColor(it))
      }
      setCardBrandTint(Color.parseColor(it))
    }
    fontSize?.let {
      for (editTextBinding in bindings) {
        editTextBinding.textSize = it.toFloat()
      }
    }
    fontFamily?.let {
      for (editTextBinding in bindings) {
        // Load custom font from assets, and fallback to default system font
        editTextBinding.typeface = ReactTypefaceUtils.applyStyles(null, -1, -1, it.takeIf { it.isNotEmpty() }, context.assets)
      }
    }
    cursorColor?.let {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val color = Color.parseColor(it)
        for (editTextBinding in bindings) {
          editTextBinding.textCursorDrawable?.setTint(color)
          editTextBinding.textSelectHandle?.setTint(color)
          editTextBinding.textSelectHandleLeft?.setTint(color)
          editTextBinding.textSelectHandleRight?.setTint(color)
          editTextBinding.highlightColor = color
        }
      }
    }

    mCardWidget.setPadding(20, 0, 20, 0)
    mCardWidget.background = MaterialShapeDrawable(
      ShapeAppearanceModel()
        .toBuilder()
        .setAllCorners(CornerFamily.ROUNDED, PixelUtil.toPixelFromDIP(borderRadius.toDouble()))
        .build()
    ).also { shape ->
      shape.strokeWidth = 0.0f
      shape.strokeColor = ColorStateList.valueOf(Color.parseColor("#000000"))
      shape.fillColor = ColorStateList.valueOf(Color.parseColor("#FFFFFF"))
      borderWidth?.let {
        shape.strokeWidth = PixelUtil.toPixelFromDIP(it.toDouble())
      }
      borderColor?.let {
        shape.strokeColor = ColorStateList.valueOf(Color.parseColor(it))
      }
      backgroundColor?.let {
        shape.fillColor = ColorStateList.valueOf(Color.parseColor(it))
      }
    }
  }

  private fun setCardBrandTint(color: Int) {
    try {
      cardInputWidgetBinding.cardBrandView::class.java.getDeclaredField("tintColorInt").let { internalTintColor ->
        internalTintColor.isAccessible = true
        internalTintColor.set(cardInputWidgetBinding.cardBrandView, color)
      }
    } catch (e: Exception) {
      Log.e(
        "StripeReactNative",
        "Unable to set card brand tint color: " + e.message)
    }
  }

  fun setPlaceHolders(value: ReadableMap) {
    val numberPlaceholder = getValOr(value, "number", null)
    val expirationPlaceholder = getValOr(value, "expiration", null)
    val cvcPlaceholder = getValOr(value, "cvc", null)
    val postalCodePlaceholder = getValOr(value, "postalCode", null)

    numberPlaceholder?.let {
      cardInputWidgetBinding.cardNumberEditText.hint = it
    }
    expirationPlaceholder?.let {
      cardInputWidgetBinding.expiryDateEditText.hint = it
    }
    cvcPlaceholder?.let {
      mCardWidget.setCvcLabel(it)
    }
    postalCodePlaceholder?.let {
      cardInputWidgetBinding.postalCodeEditText.hint = it
    }
  }

  fun setDangerouslyGetFullCardDetails(isEnabled: Boolean) {
    dangerouslyGetFullCardDetails = isEnabled
  }

  fun setPostalCodeEnabled(isEnabled: Boolean) {
    mCardWidget.postalCodeEnabled = isEnabled

    if (isEnabled === false) {
      mCardWidget.postalCodeRequired = false
    }
  }

  fun setDisabled(isDisabled: Boolean) {
    mCardWidget.isEnabled = !isDisabled
  }

  /**
   * We can reliable assume that setPostalCodeEnabled is called before
   * setCountryCode because of the order of the props in CardField.tsx
   */
  fun setCountryCode(countryString: String?) {
    if (mCardWidget.postalCodeEnabled) {
      val countryCode = CountryCode.create(value = countryString ?: LocaleListCompat.getAdjustedDefault()[0]?.country ?: "US")
      mCardWidget.postalCodeRequired = CountryUtils.doesCountryUsePostalCode(countryCode)
      setPostalCodeFilter(countryCode)
    }
  }

  fun getValue(): MutableMap<String, Any?> {
    return cardDetails
  }

  private fun onValidCardChange() {
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
    sendCardDetailsEvent()
  }

  private fun sendCardDetailsEvent() {
    mEventDispatcher?.dispatchEvent(
      CardChangedEvent(id, cardDetails, mCardWidget.postalCodeEnabled, isCardValid, dangerouslyGetFullCardDetails))
  }

  private fun setListeners() {
    cardInputWidgetBinding.cardNumberEditText.setOnFocusChangeListener { _, hasFocus ->
      currentFocusedField = if (hasFocus) CardInputListener.FocusField.CardNumber.name else null
      onChangeFocus()
    }
    cardInputWidgetBinding.expiryDateEditText.setOnFocusChangeListener { _, hasFocus ->
      currentFocusedField = if (hasFocus) CardInputListener.FocusField.ExpiryDate.name else null
      onChangeFocus()
    }
    cardInputWidgetBinding.cvcEditText.setOnFocusChangeListener { _, hasFocus ->
      currentFocusedField = if (hasFocus) CardInputListener.FocusField.Cvc.name else null
      onChangeFocus()
    }
    cardInputWidgetBinding.postalCodeEditText.setOnFocusChangeListener { _, hasFocus ->
      currentFocusedField = if (hasFocus) CardInputListener.FocusField.PostalCode.name else null
      onChangeFocus()
    }

    mCardWidget.setCardValidCallback { isValid, invalidFields ->
      isCardValid = isValid
      fun getCardValidationState(field: CardValidCallback.Fields, editTextField: StripeEditText): String {
        if (invalidFields.contains(field)) {
          return if (editTextField.shouldShowError) "Invalid"
          else "Incomplete"
        }
        return "Valid"
      }

      cardDetails["validNumber"] = getCardValidationState(CardValidCallback.Fields.Number, cardInputWidgetBinding.cardNumberEditText)
      cardDetails["validCVC"] = getCardValidationState(CardValidCallback.Fields.Cvc, cardInputWidgetBinding.cvcEditText)
      cardDetails["validExpiryDate"] = getCardValidationState(CardValidCallback.Fields.Expiry, cardInputWidgetBinding.expiryDateEditText)
      cardDetails["brand"] = mapCardBrand(cardInputWidgetBinding.cardNumberEditText.cardBrand)

      if (isValid) {
        onValidCardChange()
      } else {
        cardParams = null
        cardAddress = null
        sendCardDetailsEvent()
      }
    }

    mCardWidget.setCardInputListener(object : CardInputListener {
      override fun onCardComplete() {}
      override fun onExpirationComplete() {}
      override fun onCvcComplete() {}
      override fun onPostalCodeComplete() {}
      override fun onFocusChange(focusField: CardInputListener.FocusField) {}
    })

    mCardWidget.setExpiryDateTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        val splitText = var1.toString().split("/")
        cardDetails["expiryMonth"] = splitText[0].toIntOrNull()

        if (splitText.size == 2) {
          cardDetails["expiryYear"] = var1.toString().split("/")[1].toIntOrNull()
        }
      }
    })

    mCardWidget.setPostalCodeTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        cardDetails["postalCode"] = var1.toString()
      }
    })

    mCardWidget.setCardNumberTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        if (dangerouslyGetFullCardDetails) {
          cardDetails["number"] = var1.toString().replace(" ", "")
        }
      }
    })

    mCardWidget.setCvcNumberTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        if (dangerouslyGetFullCardDetails) {
          cardDetails["cvc"] = var1.toString()
        }
      }
    })
  }

  private fun setPostalCodeFilter(countryCode: CountryCode) {
    cardInputWidgetBinding.postalCodeEditText.filters = arrayOf(
      *cardInputWidgetBinding.postalCodeEditText.filters,
      createPostalCodeInputFilter(countryCode)
    )
  }

  private fun createPostalCodeInputFilter(countryCode: CountryCode): InputFilter {
    return InputFilter { charSequence, start, end, _, _, _ ->
      for (i in start until end) {
        val isValidCharacter = (countryCode == CountryCode.US && PostalCodeUtilities.isValidUsPostalCodeCharacter(charSequence[i])) ||
          (countryCode != CountryCode.US && PostalCodeUtilities.isValidGlobalPostalCodeCharacter(charSequence[i]))
        if (!isValidCharacter) {
          return@InputFilter ""
        }
      }
      return@InputFilter null
    }
  }

  override fun requestLayout() {
    super.requestLayout()
    post(mLayoutRunnable)
  }

  private val mLayoutRunnable = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY))
    layout(left, top, right, bottom)
  }
}
