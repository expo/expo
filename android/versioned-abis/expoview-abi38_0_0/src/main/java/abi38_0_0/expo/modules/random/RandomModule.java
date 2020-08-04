package abi38_0_0.expo.modules.random;

import android.content.Context;
import android.util.Base64;

import java.security.SecureRandom;

import abi38_0_0.org.unimodules.core.ExportedModule;
import abi38_0_0.org.unimodules.core.ModuleRegistry;
import abi38_0_0.org.unimodules.core.interfaces.ExpoMethod;
import abi38_0_0.org.unimodules.core.Promise;

public class RandomModule extends ExportedModule {

  SecureRandom mRandom;

  public RandomModule(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    if (moduleRegistry != null) {
      mRandom = new SecureRandom();
    }
  }

  @Override
  public String getName() {
    return "ExpoRandom";
  }

  @ExpoMethod
  public void getRandomBase64StringAsync(int randomByteCount, final Promise promise) {
    byte[] output = new byte[randomByteCount];
    mRandom.nextBytes(output);
    promise.resolve(Base64.encodeToString(output, Base64.NO_WRAP));
  }
}
