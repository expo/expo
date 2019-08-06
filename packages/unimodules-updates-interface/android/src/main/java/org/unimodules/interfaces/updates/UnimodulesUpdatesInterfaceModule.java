package org.unimodules.interfaces.updates;

import java.util.Map;

import android.content.Context;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

public class UnimodulesUpdatesInterfaceModule extends ExportedModule {
  private static final String NAME = "ExpoUnimodulesUpdatesInterface";
  private static final String TAG = UnimodulesUpdatesInterfaceModule.class.getSimpleName();

  private ModuleRegistry mModuleRegistry;

  public UnimodulesUpdatesInterfaceModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    this.mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void someGreatMethodAsync(Map<String, Object> options, final Promise promise) {
  }
}
