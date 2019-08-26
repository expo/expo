// Copyright 2015-present 650 Industries. All rights reserved.

package abi31_0_0.expo.modules.constants;

import android.content.Context;

import java.util.Map;

import abi31_0_0.expo.core.ExportedModule;
import abi31_0_0.expo.core.ModuleRegistry;
import abi31_0_0.expo.core.Promise;
import abi31_0_0.expo.core.interfaces.ExpoMethod;
import abi31_0_0.expo.core.interfaces.ModuleRegistryConsumer;
import abi31_0_0.expo.interfaces.constants.ConstantsInterface;

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
