package expo.core;

import android.content.Context;

import java.util.List;

import expo.core.interfaces.Package;

/**
 * Builder for {@link ModuleRegistry}. Override this class to add some custom
 * modules from outside of {@link Package} ecosystem.
 */
public class ModuleRegistryBuilder {
  private List<Package> mPackages;

  public ModuleRegistryBuilder(List<Package> initialPackages) {
    mPackages = initialPackages;
  }

  public ModuleRegistry build(Context context) {
    return new ModuleRegistry(mPackages, context);
  }
}
