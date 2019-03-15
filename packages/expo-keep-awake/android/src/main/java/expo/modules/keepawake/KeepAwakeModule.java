// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.keepawake;

import android.content.Context;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.KeepAwakeManager;

public class KeepAwakeModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String NAME = "ExpoKeepAwake";

  private KeepAwakeManager mKeepAwakeManager;

  public KeepAwakeModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mKeepAwakeManager = moduleRegistry.getModule(KeepAwakeManager.class);
  }


  @ExpoMethod
  public void activate(Promise promise) {
    mKeepAwakeManager.activate(promise);
  }

  @ExpoMethod
  public void deactivate(Promise promise) {
    mKeepAwakeManager.deactivate(promise);
  }

  public boolean isActivated() {
    return mKeepAwakeManager.isActivated();
  }
}
