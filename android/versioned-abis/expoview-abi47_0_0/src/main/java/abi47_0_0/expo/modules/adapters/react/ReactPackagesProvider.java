package abi47_0_0.expo.modules.adapters.react;

import abi47_0_0.com.facebook.react.ReactPackage;

import abi47_0_0.expo.modules.core.interfaces.InternalModule;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

/**
 * Holder for ReactPackages -- visible only to the adapter.
 * <p>
 * We want to be able to create platform-specific unimodules.
 * Thus, we need a way to pass in ReactPackages via unimodules infrastructure.
 * This internal module is populated with ReactPackages by ReactModuleRegistryProvider
 * and is used by ModuleRegistryAdapter when it creates native modules list.
 */
public class ReactPackagesProvider implements InternalModule {
  private Collection<ReactPackage> mReactPackages;

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(ReactPackagesProvider.class);
  }

  public ReactPackagesProvider() {
    mReactPackages = new ArrayList<>();
  }

  public void addPackage(ReactPackage reactPackage) {
    mReactPackages.add(reactPackage);
  }

  public Collection<ReactPackage> getReactPackages() {
    return mReactPackages;
  }
}
