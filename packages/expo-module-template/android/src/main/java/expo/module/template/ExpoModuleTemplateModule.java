package expo.module.template;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;

public class ExpoModuleTemplateModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = "ExpoModuleTemplateModule";

  private ModuleRegistry mModuleRegistry;

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void someGreatMethodAsync(final Promise promise) {
  }
}
