package expo.modules.developmentclient.modules;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import androidx.annotation.NonNull;
import expo.modules.developmentclient.DevelopmentClientController;

public class DevelopmentClientModule extends ReactContextBaseJavaModule {
  public DevelopmentClientModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "EXDevelopmentClient";
  }

  @ReactMethod
  public void loadApp(String url, ReadableMap options, final Promise promise) {
    DevelopmentClientController.getInstance().loadApp(url);
    promise.resolve(null);
  }

  @Override
  public boolean hasConstants() {
    return true;
  }
}
