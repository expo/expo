package abi8_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.view.View;
import android.view.inputmethod.InputMethodManager;

import abi8_0_0.com.facebook.react.bridge.Promise;
import abi8_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi8_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi8_0_0.com.facebook.react.bridge.ReactMethod;

import host.exp.exponent.experience.BaseExperienceActivity;

public class KeyboardModule extends ReactContextBaseJavaModule {
  public KeyboardModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExponentKeyboard";
  }

  @ReactMethod
  public void hideAsync(final Promise promise) {
    Boolean success = false;
    BaseExperienceActivity activity = BaseExperienceActivity.getVisibleActivity();
    if (activity != null) {
      InputMethodManager imm = (InputMethodManager) activity.getSystemService(Activity.INPUT_METHOD_SERVICE);
      View view = activity.getCurrentFocus();
      if (view != null) {
        imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        success = true;
      }
    }
    promise.resolve(success);
  }
}
