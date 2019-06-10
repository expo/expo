package expo.modules.random;

import android.content.Context;
import android.util.Base64;

import java.security.SecureRandom;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.Promise;

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
