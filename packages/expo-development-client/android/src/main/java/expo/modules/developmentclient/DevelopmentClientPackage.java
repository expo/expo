package expo.modules.developmentclient;

import java.util.Arrays;
import java.util.List;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import expo.modules.developmentclient.unimodules.adapters.react.ModuleRegistryAdapter;
import expo.modules.developmentclient.unimodules.adapters.react.ReactModuleRegistryProvider;
import expo.modules.developmentclient.unimodules.core.interfaces.Package;

public class DevelopmentClientPackage implements ReactPackage {
  private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(
      Arrays.<Package>asList(
          new expo.modules.developmentclient.barcodescanner.BarCodeScannerPackage()
      ), null
  );

  // Initialize a registry for vendored unimodules
  private final ModuleRegistryAdapter mModuleRegistryAdapter = new ModuleRegistryAdapter(mModuleRegistryProvider);

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    // Return modules from vendored unimodules, along with our own modules
    List<NativeModule> modules = mModuleRegistryAdapter.createNativeModules(reactContext);
    modules.add(new DevelopmentClientModule(reactContext));
    return modules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    // Return modules from vendored unimodules
    return mModuleRegistryAdapter.createViewManagers(reactContext);
  }
}
