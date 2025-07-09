package expo.modules.adapters.react;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;

import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import javax.annotation.Nullable;

import androidx.annotation.NonNull;
import expo.modules.core.ModuleRegistry;
import expo.modules.kotlin.CoreLoggerKt;
import expo.modules.kotlin.ExpoModulesHelper;
import expo.modules.kotlin.KPromiseWrapper;
import expo.modules.kotlin.KotlinInteropModuleRegistry;
import expo.modules.kotlin.ModulesProvider;

/**
 * A wrapper/proxy for all {@link expo.modules.kotlin.modules.Module}s, gets exposed as {@link com.facebook.react.bridge.NativeModule},
 * so that JS code can call methods of the internal modules.
 */
public class NativeModulesProxy extends ReactContextBaseJavaModule {
  private final static String NAME = "NativeUnimoduleProxy";
  private final static String VIEW_MANAGERS_METADATA_KEY = "viewManagersMetadata";
  private final static String MODULES_CONSTANTS_KEY = "modulesConstants";
  private final static String EXPORTED_METHODS_KEY = "exportedMethods";

  private final static String UNDEFINED_METHOD_ERROR = "E_UNDEFINED_METHOD";

  private ModuleRegistry mModuleRegistry;
  private KotlinInteropModuleRegistry mKotlinInteropModuleRegistry;
  private Map<String, Object> cachedConstants;

  public NativeModulesProxy(ReactApplicationContext context, ModuleRegistry moduleRegistry) {
    super(context);
    mModuleRegistry = moduleRegistry;

    mKotlinInteropModuleRegistry = new KotlinInteropModuleRegistry(
      Objects.requireNonNull(ExpoModulesHelper.Companion.getModulesProvider()),
      moduleRegistry,
      new WeakReference<>(context)
    );
  }

  public NativeModulesProxy(ReactApplicationContext context, ModuleRegistry moduleRegistry, ModulesProvider modulesProvider) {
    super(context);
    mModuleRegistry = moduleRegistry;

    mKotlinInteropModuleRegistry = new KotlinInteropModuleRegistry(
      Objects.requireNonNull(modulesProvider),
      moduleRegistry,
      new WeakReference<>(context)
    );
  }

  public KotlinInteropModuleRegistry getKotlinInteropModuleRegistry() {
    return mKotlinInteropModuleRegistry;
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    if (cachedConstants != null) {
      return cachedConstants;
    }

    mModuleRegistry.ensureIsInitialized();

    KotlinInteropModuleRegistry kotlinModuleRegistry = getKotlinInteropModuleRegistry();
    kotlinModuleRegistry.installJSIInterop();
    kotlinModuleRegistry.emitOnCreate();

    Map<String, Object> constants = new HashMap<>(3);
    constants.put(MODULES_CONSTANTS_KEY, new HashMap<>());
    constants.put(EXPORTED_METHODS_KEY, new HashMap<>());
    constants.put(VIEW_MANAGERS_METADATA_KEY, mKotlinInteropModuleRegistry.viewManagersMetadata());

    CoreLoggerKt.getLogger().info("✅ Constants were exported");

    cachedConstants = constants;

    return constants;
  }

  /**
   * The only exported {@link ReactMethod} for legacy NativeUnimoduleProxy.
   * This is used only when JSI is not available. i.e. the legacy remote debugging.
   * JavaScript can call native modules' exported methods ({@link ExpoMethod}) using this method as a proxy.
   * For native {@link ExpoMethod} `void put(String key, int value)` in `NativeDictionary` module
   * JavaScript could call `NativeModulesProxy.callMethod("NativeDictionary", 2, ["key", 42])`, where the second argument
   * is a method's constant key.
   */
  @ReactMethod
  public void callMethod(String moduleName, String methodName, ReadableArray arguments, final Promise promise) {
    if (mKotlinInteropModuleRegistry.hasModule(moduleName)) {
      mKotlinInteropModuleRegistry.callMethod(moduleName, methodName, arguments, new KPromiseWrapper(promise));
      return;
    }

    promise.reject(
      UNDEFINED_METHOD_ERROR,
      "Method " + methodName + " of Java module " + moduleName + " is undefined."
    );
  }

  @Override
  public void invalidate() {
    super.invalidate();
    mModuleRegistry.onDestroy();
    mKotlinInteropModuleRegistry.onDestroy();
  }

  ModuleRegistry getModuleRegistry() {
    return mModuleRegistry;
  }

  /* package */ ReactApplicationContext getReactContext() {
    return getReactApplicationContext();
  }
}
