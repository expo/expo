package versioned.host.exp.exponent.modules.api.getrandomvalues;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

import android.util.Base64;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

public class RNGetRandomValuesModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  public RNGetRandomValuesModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "RNGetRandomValues";
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getRandomBase64(int byteLength) throws NoSuchAlgorithmException {
    byte[] data = new byte[byteLength];
    SecureRandom random = new SecureRandom();

    random.nextBytes(data);

    return Base64.encodeToString(data, Base64.NO_WRAP);
  }
}
