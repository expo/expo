package abi38_0_0.host.exp.exponent.modules.universal;

import android.content.Intent;

import abi38_0_0.com.facebook.react.bridge.ReactContext;

import abi38_0_0.org.unimodules.adapters.react.services.UIManagerModuleWrapper;
import abi38_0_0.org.unimodules.core.interfaces.ActivityEventListener;

import host.exp.exponent.ActivityResultListener;
import host.exp.expoview.Exponent;

public class ScopedUIManagerModuleWrapper extends UIManagerModuleWrapper {


  public ScopedUIManagerModuleWrapper(ReactContext reactContext) {
    super(reactContext);
  }

  @Override
  public void registerActivityEventListener(final ActivityEventListener activityEventListener) {
    Exponent.getInstance().addActivityResultListener(new ActivityResultListener() {
      @Override
      public void onActivityResult(int requestCode, int resultCode, Intent data) {
        activityEventListener.onActivityResult(Exponent.getInstance().getCurrentActivity(), requestCode, resultCode, data);
      }
    });
  }

}
