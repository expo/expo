package abi28_0_0.host.exp.exponent.modules.api.components.payments;

import android.text.Editable;
import android.text.TextWatcher;
import android.util.AttributeSet;
import android.util.Log;
import android.util.Xml;
import android.widget.EditText;

import com.devmarvel.creditcardentry.library.CreditCardForm;
import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi28_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi28_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi28_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import host.exp.expoview.R;
import abi28_0_0.host.exp.exponent.modules.api.components.payments.CreditCardFormOnChangeEvent;

import org.xmlpull.v1.XmlPullParser;


/**
 * Created by dmitriy on 11/15/16
 */

public class CustomCardInputReactManager extends SimpleViewManager<CreditCardForm> {

  public static final String REACT_CLASS = "CreditCardForm";
  private static final String TAG = CustomCardInputReactManager.class.getSimpleName();
  private static final String NUMBER = "number";
  private static final String EXP_MONTH = "expMonth";
  private static final String EXP_YEAR = "expYear";
  private static final String CCV = "cvc";

  private ThemedReactContext reactContext;
  private WritableMap currentParams;

  private String currentNumber;
  private int currentMonth;
  private int currentYear;
  private String currentCCV;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected CreditCardForm createViewInstance(ThemedReactContext reactContext) {
    XmlPullParser parser = reactContext.getResources().getXml(R.xml.stub_material);
    try {
      parser.next();
      parser.nextTag();
    } catch (Exception e) {
      e.printStackTrace();
    }

    AttributeSet attr = Xml.asAttributeSet(parser);
    final CreditCardForm creditCardForm = new CreditCardForm(reactContext, attr);
    setListeners(creditCardForm);
    this.reactContext = reactContext;
    return creditCardForm;
  }

  @ReactProp(name = "enabled")
  public void setEnabled(CreditCardForm view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = "backgroundColor")
  public void setBackgroundColor(CreditCardForm view, int color) {
    Log.d("TAG", "setBackgroundColor: "+color);
    view.setBackgroundColor(color);
  }

  @ReactProp(name = "cardNumber")
  public void setCardNumber(CreditCardForm view, String cardNumber) {
    view.setCardNumber(cardNumber, true);
  }

  @ReactProp(name = "expDate")
  public void setExpDate(CreditCardForm view, String expDate) {
    view.setExpDate(expDate, true);
  }

  @ReactProp(name = "securityCode")
  public void setSecurityCode(CreditCardForm view, String securityCode) {
    view.setSecurityCode(securityCode, true);
  }

  @ReactProp(name = "numberPlaceholder")
  public void setCreditCardTextHint(CreditCardForm view, String creditCardTextHint) {
    view.setCreditCardTextHint(creditCardTextHint);
  }

  @ReactProp(name = "expirationPlaceholder")
  public void setExpDateTextHint(CreditCardForm view, String expDateTextHint) {
    view.setExpDateTextHint(expDateTextHint);
  }

  @ReactProp(name = "cvcPlaceholder")
  public void setSecurityCodeTextHint(CreditCardForm view, String securityCodeTextHint) {
    view.setSecurityCodeTextHint(securityCodeTextHint);
  }


  private void setListeners(final CreditCardForm view){

    final EditText ccNumberEdit = (EditText) view.findViewById(R.id.cc_card);
    final EditText ccExpEdit = (EditText) view.findViewById(R.id.cc_exp);
    final EditText ccCcvEdit = (EditText) view.findViewById(R.id.cc_ccv);

    ccNumberEdit.addTextChangedListener(new TextWatcher() {
      @Override
      public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
      }

      @Override
      public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
        Log.d(TAG, "onTextChanged: cardNumber = "+charSequence);
        currentNumber = charSequence.toString().replaceAll(" ", "");
        postEvent(view);
      }

      @Override
      public void afterTextChanged(Editable editable) {
      }
    });

    ccExpEdit.addTextChangedListener(new TextWatcher() {
      @Override
      public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
      }

      @Override
      public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
        Log.d(TAG, "onTextChanged: EXP_YEAR = "+charSequence);
        try {
          currentMonth = view.getCreditCard().getExpMonth();
        }catch (Exception e){
          if(charSequence.length() == 0)
            currentMonth = 0;
        }
        try {
          currentYear = view.getCreditCard().getExpYear();
        }catch (Exception e){
          currentYear = 0;
        }
        postEvent(view);
      }

      @Override
      public void afterTextChanged(Editable editable) {
      }
    });

    ccCcvEdit.addTextChangedListener(new TextWatcher() {
      @Override
      public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
      }

      @Override
      public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
        Log.d(TAG, "onTextChanged: CCV = "+charSequence);
        currentCCV = charSequence.toString();
        postEvent(view);
      }

      @Override
      public void afterTextChanged(Editable editable) {
      }
    });
  }

  private void postEvent(CreditCardForm view){
    currentParams = Arguments.createMap();
    currentParams.putString(NUMBER, currentNumber);
    currentParams.putInt(EXP_MONTH, currentMonth);
    currentParams.putInt(EXP_YEAR, currentYear);
    currentParams.putString(CCV, currentCCV);
    reactContext.getNativeModule(UIManagerModule.class)
      .getEventDispatcher().dispatchEvent(
      new CreditCardFormOnChangeEvent(view.getId(), currentParams, view.isCreditCardValid()));
  }

  private void updateView(CreditCardForm view){

  }
}
