package expo.adapters.react;

import android.content.Context;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.WeakHashMap;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.ModuleRegistryBuilder;
import expo.core.interfaces.Module;
import expo.core.interfaces.Package;
import expo.core.interfaces.ViewManager;

public class ReactModuleRegistryBuilder extends ModuleRegistryBuilder {
  private Collection<ViewManager> mViewManagers;

  public ReactModuleRegistryBuilder(List<Package> initialPackages) {
    super(initialPackages);
  }

  @Override
  public ModuleRegistry build(Context context) {
    Collection<Module> internalModules = new ArrayList<>();
    Collection<ExportedModule> exportedModules = new ArrayList<>();
    for(Package pkg : getPackages()) {
      internalModules.addAll(pkg.createInternalModules(context));
      exportedModules.addAll(pkg.createExportedModules(context));
    }
    return new ModuleRegistry(internalModules, exportedModules, getViewManagers(context));
  }

  private Collection<ViewManager> getViewManagers(Context context) {
    if (mViewManagers != null) {
      return mViewManagers;
    }

    mViewManagers = Collections.newSetFromMap(new WeakHashMap<ViewManager, Boolean>());
    mViewManagers.addAll(ModuleRegistry.createViewManagers(getPackages(), context));
    return mViewManagers;
  }
}
