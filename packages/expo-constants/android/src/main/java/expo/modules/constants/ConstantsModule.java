// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.constants;

import android.content.Context;

import java.util.Map;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;

import expo.modules.interfaces.constants.ConstantsInterface;

public class ConstantsModule extends ExportedModule {
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
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void getWebViewUserAgentAsync(Promise promise) {
    String userAgent = System.getProperty("http.agent");
    promise.resolve(userAgent);
  }
}
