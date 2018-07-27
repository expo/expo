package host.exp.exponent.experience;

import android.content.pm.PackageManager;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;

import org.json.JSONObject;

import java.util.List;
import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.ModuleRegistryProvider;
import expo.interfaces.constants.ConstantsInterface;
import expo.modules.constants.ConstantsService;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ScopedContext;
import versioned.host.exp.exponent.modules.universal.ConstantsBinding;
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;

public class DetachedModuleRegistryAdapter extends ExpoModuleRegistryAdapter {
  public DetachedModuleRegistryAdapter(ModuleRegistryProvider moduleRegistryProvider) {
    super(moduleRegistryProvider);
  }

  @Override
  public List<NativeModule> createNativeModules(final ScopedContext scopedContext, ExperienceId experienceId, Map<String, Object> experienceProperties, JSONObject manifest, List<NativeModule> otherModules) {
    ReactApplicationContext reactApplicationContext = (ReactApplicationContext) scopedContext.getContext();

    // We only use React application context, because we're detached -- no scopes
    ModuleRegistry moduleRegistry = mModuleRegistryProvider.get(reactApplicationContext);
    
    moduleRegistry.registerInternalModule(new ConstantsBinding(scopedContext, experienceProperties, manifest));

    return getNativeModulesFromModuleRegistry(reactApplicationContext, moduleRegistry);
  }
}
