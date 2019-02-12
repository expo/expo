package expo.modules.random;

import android.content.Context;
import android.util.Base64;

import java.security.SecureRandom;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.Promise;

public class RandomModule extends ExportedModule implements ModuleRegistryConsumer {

  SecureRandom random;

  public RandomModule(Context context) {
    super(context);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    if (moduleRegistry != null) {
      random = new SecureRandom();
    }
  }

  @Override
  public String getName() {
    return "ExpoRandom";
  }

  @ExpoMethod
  public void getRandomBase64StringAsync(int randomByteCount, final Promise promise) {
    byte[] output = new byte[randomByteCount];
    random.nextBytes(output);
    promise.resolve(Base64.encodeToString(output, Base64.NO_WRAP));
  }
}
