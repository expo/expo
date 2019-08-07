package expo.module.template;

import java.util.Map;

import android.content.Context;

import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

public class ModuleTemplateModule extends ExportedModule {
  private static final String NAME = "ExpoModuleTemplate";
  private static final String TAG = ModuleTemplateModule.class.getSimpleName();

  private ModuleRegistry mModuleRegistry;

  public ModuleTemplateModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void someGreatMethodAsync(Map<String, Object> options, final Promise promise) {
  }
}
