package host.exp.exponent.experience;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;

import org.json.JSONObject;

import java.util.List;
import java.util.Map;

import org.unimodules.adapters.react.ReactModuleRegistryProvider;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ScopedContext;
import versioned.host.exp.exponent.modules.universal.ConstantsBinding;
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;
import versioned.host.exp.exponent.modules.universal.ScopedFileSystemModule;
import versioned.host.exp.exponent.modules.universal.ScopedUIManagerModuleWrapper;

public class DetachedModuleRegistryAdapter extends ExpoModuleRegistryAdapter {
  public DetachedModuleRegistryAdapter(ReactModuleRegistryProvider moduleRegistryProvider) {
    super(moduleRegistryProvider);
  }

  @Override
  public List<NativeModule> createNativeModules(final ScopedContext scopedContext, ExperienceId experienceId, Map<String, Object> experienceProperties, JSONObject manifest, List<NativeModule> otherModules) {
    ReactApplicationContext reactApplicationContext = (ReactApplicationContext) scopedContext.getContext();

    // We only use React application context, because we're detached -- no scopes
    ModuleRegistry moduleRegistry = mModuleRegistryProvider.get(scopedContext);

    moduleRegistry.registerInternalModule(new ConstantsBinding(scopedContext, experienceProperties, manifest));

    // ReactAdapterPackage requires ReactContext
    ReactApplicationContext reactContext = (ReactApplicationContext) scopedContext.getContext();
    for (InternalModule internalModule : mReactAdapterPackage.createInternalModules(reactContext)) {
      moduleRegistry.registerInternalModule(internalModule);
    }

    // Overriding ScopedUIManagerModuleWrapper from ReactAdapterPackage
    moduleRegistry.registerInternalModule(new ScopedUIManagerModuleWrapper(reactContext, experienceId, manifest.optString(ExponentManifest.MANIFEST_NAME_KEY)));

    // Overriding expo-file-system FileSystemModule
    moduleRegistry.registerExportedModule(new ScopedFileSystemModule(scopedContext));

    // Adding other modules (not universal) to module registry as consumers.
    // It allows these modules to refer to universal modules.
    for (NativeModule otherModule : otherModules) {
      if (otherModule instanceof ModuleRegistryConsumer) {
        moduleRegistry.addRegistryConsumer((ModuleRegistryConsumer) otherModule);
      }
    }

    configureModuleRegistry(moduleRegistry, reactApplicationContext);

    return getNativeModulesFromModuleRegistry(reactApplicationContext, moduleRegistry);
  }

  protected void configureModuleRegistry(ModuleRegistry moduleRegistry, ReactApplicationContext reactContext) {
    // Subclasses may add more modules here.
  }
}
