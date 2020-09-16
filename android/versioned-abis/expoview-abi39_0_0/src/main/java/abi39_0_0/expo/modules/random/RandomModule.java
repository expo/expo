package abi39_0_0.expo.modules.random;

import android.util.Base64;

import java.security.SecureRandom;

import abi39_0_0.com.facebook.react.bridge.Promise;
import abi39_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi39_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi39_0_0.com.facebook.react.bridge.ReactMethod;

public class RandomModule extends ReactContextBaseJavaModule {
  SecureRandom mSecureRandom;

  public RandomModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoRandom";
  }

  @ReactMethod
  public void getRandomBase64StringAsync(int randomByteCount, Promise promise) {
    promise.resolve(getRandomBase64String(randomByteCount));
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getRandomBase64String(int randomByteCount) {
    if (mSecureRandom == null) {
      mSecureRandom = new SecureRandom();
    }

    byte[] output = new byte[randomByteCount];
    mSecureRandom.nextBytes(output);

    return Base64.encodeToString(output, Base64.NO_WRAP);
  }
}
