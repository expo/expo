package expo.modules.developmentclient;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.util.HashMap;
import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

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
    DevelopmentClientController.getInstance().loadApp(getReactApplicationContext(), url, options);
    promise.resolve(null);
  }

  @Override
  public boolean hasConstants() {
    return true;
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("mainComponentName", DevelopmentClientController.getInstance().getMainComponentName());
    return constants;
  }
}
