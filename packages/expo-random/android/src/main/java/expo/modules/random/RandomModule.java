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

  public RandomModule(Context context) {
    super(context);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
  }

  @Override
  public String getName() {
    return "ExpoRandom";
  }

  @ExpoMethod
  public void getRandomIntegerAsync(int length, final Promise promise) {
    SecureRandom random = new SecureRandom();
    byte[] output = new byte[length];
    random.nextBytes(output);
    promise.resolve(Base64.encodeToString(output, Base64.NO_WRAP));
  }
}
