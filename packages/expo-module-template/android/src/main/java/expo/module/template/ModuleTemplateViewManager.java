package expo.module.template;

import android.content.Context;

import java.util.Arrays;
import java.util.List;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.ViewManager;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;

public class ModuleTemplateViewManager extends ViewManager<ModuleTemplateView> implements ModuleRegistryConsumer {
  private static final String TAG = "ExpoModuleTemplateView";

  private ModuleRegistry mModuleRegistry;

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public ModuleTemplateView createViewInstance(Context context) {
    return new ModuleTemplateView(context, mModuleRegistry);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.SIMPLE;
  }

  @Override
  public List<String> getExportedEventNames() {
    return Arrays.asList("onSomethingHappened");
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
