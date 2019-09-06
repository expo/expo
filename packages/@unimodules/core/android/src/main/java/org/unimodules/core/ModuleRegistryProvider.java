package org.unimodules.core;

import android.content.Context;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.Package;
import org.unimodules.core.interfaces.SingletonModule;

/**
 * Builder for {@link ModuleRegistry}. Override this class to add some custom
 * modules from outside of {@link Package} ecosystem.
 */
public class ModuleRegistryProvider {
  private List<Package> mPackages;
  protected String mAppId;

  public ModuleRegistryProvider(List<Package> initialPackages, String appId) {
    mPackages = initialPackages;
    mAppId = appId;
  }

  protected List<Package> getPackages() {
    return mPackages;
  }

  public ModuleRegistry get(Context context) {
    return new ModuleRegistry(mAppId,
            createInternalModules(context),
            createExportedModules(context),
            createViewManagers(context),
            createSingletonModules(context)
    );
  }

  protected Collection<InternalModule> createInternalModules(Context context) {
    Collection<InternalModule> internalModules = new ArrayList<>();
    for (Package pkg : getPackages()) {
      internalModules.addAll(pkg.createInternalModules(context));
    }
    return internalModules;
  }

  protected Collection<ExportedModule> createExportedModules(Context context) {
    Collection<ExportedModule> exportedModules = new ArrayList<>();
    for (Package pkg : getPackages()) {
      exportedModules.addAll(pkg.createExportedModules(context));
    }
    return exportedModules;
  }

  protected Collection<ViewManager> createViewManagers(Context context) {
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
