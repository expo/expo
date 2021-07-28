package expo.modules.core;

import android.content.Context;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.Package;
import expo.modules.core.interfaces.SingletonModule;

/**
 * Builder for {@link ModuleRegistry}. Override this class to add some custom
 * modules from outside of {@link Package} ecosystem.
 */
public class ModuleRegistryProvider {
  private List<Package> mPackages;

  public ModuleRegistryProvider(List<Package> initialPackages) {
    mPackages = initialPackages;
  }

  protected List<Package> getPackages() {
    return mPackages;
  }

  public ModuleRegistry get(Context context) {
    return new ModuleRegistry(
            createInternalModules(context),
            createExportedModules(context),
            createViewManagers(context),
            createSingletonModules(context)
    );
  }

  public Collection<InternalModule> createInternalModules(Context context) {
    Collection<InternalModule> internalModules = new ArrayList<>();
    for (Package pkg : getPackages()) {
      internalModules.addAll(pkg.createInternalModules(context));
    }
    return internalModules;
  }

  public Collection<ExportedModule> createExportedModules(Context context) {
    Collection<ExportedModule> exportedModules = new ArrayList<>();
    for (Package pkg : getPackages()) {
      exportedModules.addAll(pkg.createExportedModules(context));
    }
    return exportedModules;
  }

  public Collection<ViewManager> createViewManagers(Context context) {
    Collection<ViewManager> viewManagers = new ArrayList<>();
    for (Package pkg : getPackages()) {
      viewManagers.addAll(pkg.createViewManagers(context));
    }
    return viewManagers;
  }

  public Collection<SingletonModule> createSingletonModules(Context context) {
    Collection<SingletonModule> singletonModules = new ArrayList<>();
    for (Package pkg : getPackages()) {
      singletonModules.addAll(pkg.createSingletonModules(context));
    }
    return singletonModules;
  }
}
