package expo.modules.adapters.react;

import android.util.SparseArray;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;

import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import javax.annotation.Nullable;

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

  private final static String METHOD_INFO_KEY = "key";
  private final static String METHOD_INFO_NAME = "name";

  private final static String UNEXPECTED_ERROR = "E_UNEXPECTED_ERROR";
  private final static String UNDEFINED_METHOD_ERROR = "E_UNDEFINED_METHOD";

  private ModuleRegistry mModuleRegistry;
  private Map<String, Map<String, Integer>> mExportedMethodsKeys;
  private Map<String, SparseArray<String>> mExportedMethodsReverseKeys;
  private KotlinInteropModuleRegistry mKotlinInteropModuleRegistry;
  private Map<String, Object> cachedConstants;

  public NativeModulesProxy(ReactApplicationContext context, ModuleRegistry moduleRegistry) {
    super(context);
    mModuleRegistry = moduleRegistry;
    mExportedMethodsKeys = new HashMap<>();
    mExportedMethodsReverseKeys = new HashMap<>();

    mKotlinInteropModuleRegistry = new KotlinInteropModuleRegistry(
      Objects.requireNonNull(ExpoModulesHelper.Companion.getModulesProvider()),
      moduleRegistry,
      new WeakReference<>(context)
    );
  }

  public NativeModulesProxy(ReactApplicationContext context, ModuleRegistry moduleRegistry, ModulesProvider modulesProvider) {
    super(context);
    mModuleRegistry = moduleRegistry;
    mExportedMethodsKeys = new HashMap<>();
    mExportedMethodsReverseKeys = new HashMap<>();

    mKotlinInteropModuleRegistry = new KotlinInteropModuleRegistry(
      Objects.requireNonNull(modulesProvider),
      moduleRegistry,
      new WeakReference<>(context)
    );
  }

  public KotlinInteropModuleRegistry getKotlinInteropModuleRegistry() {
    return mKotlinInteropModuleRegistry;
  }

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
  public void callMethod(String moduleName, int methodKey, ReadableArray arguments, final Promise promise) {
    callMethod(moduleName, mExportedMethodsReverseKeys.get(moduleName).get(methodKey), arguments, promise);
  }

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

  /**
   * Assigns keys to exported method infos and updates {@link #mExportedMethodsKeys} and {@link #mExportedMethodsReverseKeys}.
   * Mutates maps in provided list.
   */
  private void assignExportedMethodsKeys(String moduleName, List<Map<String, Object>> exportedMethodsInfos) {
    if (mExportedMethodsKeys.get(moduleName) == null) {
      mExportedMethodsKeys.put(moduleName, new HashMap<String, Integer>());
    }

    if (mExportedMethodsReverseKeys.get(moduleName) == null) {
      mExportedMethodsReverseKeys.put(moduleName, new SparseArray<String>());
    }

    for (int i = 0; i < exportedMethodsInfos.size(); i++) {
      Map<String, Object> methodInfo = exportedMethodsInfos.get(i);

      if (methodInfo.get(METHOD_INFO_NAME) == null || !(methodInfo.get(METHOD_INFO_NAME) instanceof String)) {
        throw new RuntimeException("No method name in MethodInfo - " + methodInfo.toString());
      }

      String methodName = (String) methodInfo.get(METHOD_INFO_NAME);
      Integer maybePreviousIndex = mExportedMethodsKeys.get(moduleName).get(methodName);
      if (maybePreviousIndex == null) {
        int key = mExportedMethodsKeys.get(moduleName).values().size();
        methodInfo.put(METHOD_INFO_KEY, key);
        mExportedMethodsKeys.get(moduleName).put(methodName, key);
        mExportedMethodsReverseKeys.get(moduleName).put(key, methodName);
      } else {
        int key = maybePreviousIndex;
        methodInfo.put(METHOD_INFO_KEY, key);
      }
    }
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
