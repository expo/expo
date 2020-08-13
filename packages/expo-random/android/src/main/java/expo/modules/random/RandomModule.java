package expo.modules.random;

import android.util.Base64;

import java.security.SecureRandom;
import java.security.NoSuchAlgorithmException;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class RandomModule extends ReactContextBaseJavaModule {
  public RandomModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoRandom";
  }

  private String _getRandomBase64String(int randomByteCount) throws NoSuchAlgorithmException {
    byte[] output = new byte[randomByteCount];
    SecureRandom random = new SecureRandom();
    random.nextBytes(output);

    return Base64.encodeToString(output, Base64.NO_WRAP);
  }

  @ReactMethod
  public void getRandomBase64StringAsync(int randomByteCount, Promise promise) throws NoSuchAlgorithmException {
    promise.resolve(_getRandomBase64String(randomByteCount));
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getRandomBase64String(int randomByteCount) throws NoSuchAlgorithmException {
    return _getRandomBase64String(randomByteCount);
  }
}
