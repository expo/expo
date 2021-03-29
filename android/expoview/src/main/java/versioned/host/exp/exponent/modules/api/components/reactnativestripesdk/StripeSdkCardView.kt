package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.content.res.ColorStateList
import android.graphics.Color
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.events.EventDispatcher
import com.stripe.android.databinding.CardInputWidgetBinding
import com.google.android.material.shape.CornerFamily
import com.google.android.material.shape.MaterialShapeDrawable
import com.google.android.material.shape.ShapeAppearanceModel
import com.stripe.android.view.CardInputListener
import com.stripe.android.view.CardInputWidget

class StripeSdkCardView(private val context: ThemedReactContext) : FrameLayout(context) {
  private var mCardWidget: CardInputWidget
  private val cardDetails: MutableMap<String, Any> = mutableMapOf("number" to "", "cvc" to "", "expiryMonth" to "", "expiryYear" to "", "postalCode" to "")
  private var mEventDispatcher: EventDispatcher?

  init {
    mCardWidget = CardInputWidget(context);
    mEventDispatcher = context.getNativeModule(UIManagerModule::class.java)?.eventDispatcher

    addView(mCardWidget)
    setListeners()

    viewTreeObserver.addOnGlobalLayoutListener { requestLayout() }
  }

  fun setValue(value: ReadableMap) {
    mCardWidget.setCardNumber(getValOr(value, "number", null))
    mCardWidget.setCvcCode(getValOr(value, "cvc", null))

    if (value.hasKey("expiryMonth") && value.hasKey("expiryYear")) {
      val month = value.getInt("expiryMonth")
      val year = value.getInt("expiryYear")
      mCardWidget.setExpiryDate(month, year)
    }
  }

  fun setCardStyle(value: ReadableMap) {
    val binding = CardInputWidgetBinding.bind(mCardWidget)
    val borderWidth = getIntOrNull(value, "borderWidth")
    val backgroundColor = getValOr(value, "backgroundColor", null)
    val borderColor = getValOr(value, "borderColor", null)
    val cornerRadius = getIntOrNull(value, "cornerRadius") ?: 0
    val textColor = getValOr(value, "textColor", null)
    val fontSize = getIntOrNull(value,"fontSize")
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

    mCardWidget.setPadding(40, 0 ,40 ,0)
    mCardWidget.background = MaterialShapeDrawable(
      ShapeAppearanceModel()
        .toBuilder()
        .setAllCorners(CornerFamily.ROUNDED, (cornerRadius * 2).toFloat())
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

  fun setPostalCodeEnabled(isEnabled: Boolean) {
    mCardWidget.postalCodeEnabled = isEnabled
  }

  fun getValue(): MutableMap<String, Any> {
    return cardDetails
  }

  fun onCardChanged() {
    val complete = mCardWidget.cardParams != null
    mEventDispatcher?.dispatchEvent(
      CardChangedEvent(id, cardDetails, mCardWidget.postalCodeEnabled, complete))
  }

  private fun setListeners() {
    mCardWidget.setCardInputListener(object : CardInputListener {
      override fun onCardComplete() {}
      override fun onExpirationComplete() {}
      override fun onCvcComplete() {}
      override fun onFocusChange(focusField: CardInputListener.FocusField) {
        if (mEventDispatcher != null) {
          mEventDispatcher?.dispatchEvent(
            CardFocusEvent(id, focusField.name))
        }
      }
    })

    mCardWidget.setCardNumberTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        cardDetails["number"] = var1.toString()
        onCardChanged()
      }
    })

    mCardWidget.setCvcNumberTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        cardDetails["cvc"] = var1.toString()
        onCardChanged()
      }
    })

    mCardWidget.setExpiryDateTextWatcher(object : TextWatcher {
      override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}
      override fun afterTextChanged(p0: Editable?) {}
      override fun onTextChanged(var1: CharSequence?, var2: Int, var3: Int, var4: Int) {
        val splitted = var1.toString().split("/")
        cardDetails["expiryMonth"] = splitted[0]

        if (splitted.size == 2) {
          cardDetails["expiryYear"] = var1.toString().split("/")[1]
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
