package versioned.host.exp.exponent.modules.universal;

import android.content.Intent;

import com.facebook.react.bridge.ReactContext;

import org.unimodules.adapters.react.services.UIManagerModuleWrapper;
import org.unimodules.core.interfaces.ActivityEventListener;

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
