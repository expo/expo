// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.constants;

import android.content.Context;

import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.interfaces.constants.ConstantsInterface;

public class ConstantsModule extends ExportedModule implements ModuleRegistryConsumer {
  private ModuleRegistry mModuleRegistry;

  public ConstantsModule(Context context) {
    super(context);
  }

  @Override
  public Map<String, Object> getConstants() {
    ConstantsInterface constantsService = mModuleRegistry.getModule(ConstantsInterface.class);
    return constantsService.getConstants();
  }

  @Override
  public String getName() {
    return "ExponentConstants";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void getWebViewUserAgentAsync(Promise promise) {
    String userAgent = System.getProperty("http.agent");
    promise.resolve(userAgent);
  }
}
