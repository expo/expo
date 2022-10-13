package expo.modules.adapters.react;

import android.util.Log;
import android.util.SparseArray;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.ViewManager;
import expo.modules.core.interfaces.ExpoMethod;
import expo.modules.kotlin.ExpoModulesHelper;
import expo.modules.kotlin.KotlinInteropModuleRegistry;
import expo.modules.kotlin.KPromiseWrapper;
import expo.modules.kotlin.ModulesProvider;

import java.lang.ref.WeakReference;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import javax.annotation.Nullable;

/**
 * A wrapper/proxy for all {@link ExportedModule}s, gets exposed as {@link com.facebook.react.bridge.NativeModule},
 * so that JS code can call methods of the internal modules.
 */
public class NativeModulesProxy extends ReactContextBaseJavaModule {
  private final static String NAME = "NativeUnimoduleProxy";
  private final static String VIEW_MANAGERS_METADATA_KEY = "viewManagersMetadata";
  private final static String MODULES_CONSTANTS_KEY = "modulesConstants";
  private final static String EXPORTED_METHODS_KEY = "exportedMethods";

  private final static String METHOD_INFO_KEY = "key";
  private final static String METHOD_INFO_NAME = "name";
  private final static String METHOD_INFO_ARGUMENTS_COUNT = "argumentsCount";

  private final static String UNEXPECTED_ERROR = "E_UNEXPECTED_ERROR";
  private final static String UNDEFINED_METHOD_ERROR = "E_UNDEFINED_METHOD";
  private final static String ARGS_TYPES_MISMATCH_ERROR = "E_ARGS_TYPES_MISMATCH";

  private ModuleRegistry mModuleRegistry;
  private Map<String, Map<String, Integer>> mExportedMethodsKeys;
  private Map<String, SparseArray<String>> mExportedMethodsReverseKeys;
  private KotlinInteropModuleRegistry mKotlinInteropModuleRegistry;

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
    mModuleRegistry.ensureIsInitialized();
    getKotlinInteropModuleRegistry().installJSIInterop();

    Collection<ExportedModule> exportedModules = mModuleRegistry.getAllExportedModules();
    Collection<ViewManager> viewManagers = mModuleRegistry.getAllViewManagers();

    Map<String, Object> modulesConstants = new HashMap<>(exportedModules.size());
    Map<String, Object> exportedMethodsMap = new HashMap<>(exportedModules.size());
    Map<String, Object> viewManagersMetadata = new HashMap<>(viewManagers.size());

    for (ExportedModule exportedModule : exportedModules) {
      String moduleName = exportedModule.getName();
      modulesConstants.put(moduleName, exportedModule.getConstants());

      List<Map<String, Object>> exportedMethods = transformExportedMethodsMap(exportedModule.getExportedMethods());
      assignExportedMethodsKeys(moduleName, exportedMethods);

      exportedMethodsMap.put(moduleName, exportedMethods);
    }

    modulesConstants.putAll(mKotlinInteropModuleRegistry.exportedModulesConstants());
    exportedMethodsMap.putAll(mKotlinInteropModuleRegistry.exportMethods((name, info) -> {
      assignExportedMethodsKeys(name, (List<Map<String, Object>>) info);
      return null;
    }));

    for (ViewManager viewManager : viewManagers) {
      viewManagersMetadata.put(viewManager.getName(), viewManager.getMetadata());
    }

    viewManagersMetadata.putAll(mKotlinInteropModuleRegistry.viewManagersMetadata());

    Map<String, Object> constants = new HashMap<>(3);
    constants.put(MODULES_CONSTANTS_KEY, modulesConstants);
    constants.put(EXPORTED_METHODS_KEY, exportedMethodsMap);
    constants.put(VIEW_MANAGERS_METADATA_KEY, viewManagersMetadata);

    Log.i("ExpoModulesCore", "✅ Constants was exported");

    return constants;
  }

  /**
   * The only exported {@link ReactMethod}.
   * JavaScript can call native modules' exported methods ({@link ExpoMethod}) using this method as a proxy.
   * For native {@link ExpoMethod} `void put(String key, int value)` in `NativeDictionary` module
   * JavaScript could call `NativeModulesProxy.callMethod("NativeDictionary", "put", ["key", 42])`
   * or `NativeModulesProxy.callMethod("NativeDictionary", 2, ["key", 42])`, where the second argument
   * is a method's constant key.
   */
  @ReactMethod
  public void callMethod(String moduleName, Dynamic methodKeyOrName, ReadableArray arguments, final Promise promise) {
    String methodName;
    if (methodKeyOrName.getType() == ReadableType.String) {
      methodName = methodKeyOrName.asString();
    } else if (methodKeyOrName.getType() == ReadableType.Number) {
      methodName = mExportedMethodsReverseKeys.get(moduleName).get(methodKeyOrName.asInt());
    } else {
      promise.reject(UNEXPECTED_ERROR, "Method key is neither a String nor an Integer -- don't know how to map it to method name.");
      return;
    }

    if (mKotlinInteropModuleRegistry.hasModule(moduleName)) {
      mKotlinInteropModuleRegistry.callMethod(moduleName, methodName, arguments, new KPromiseWrapper(promise));
      return;
    }

    try {
      List<Object> nativeArguments = getNativeArgumentsForMethod(arguments, mModuleRegistry.getExportedModule(moduleName).getExportedMethodInfos().get(methodName));
      nativeArguments.add(new PromiseWrapper(promise));

      mModuleRegistry.getExportedModule(moduleName).invokeExportedMethod(methodName, nativeArguments);
    } catch (IllegalArgumentException e) {
      promise.reject(ARGS_TYPES_MISMATCH_ERROR, e.getMessage(), e);
    } catch (RuntimeException e) {
      promise.reject(UNEXPECTED_ERROR, "Encountered an exception while calling native method: " + e.getMessage(), e);
    } catch (NoSuchMethodException e) {
      promise.reject(
        UNDEFINED_METHOD_ERROR,
        "Method " + methodName + " of Java module " + moduleName + " is undefined.",
        e
      );
    }
  }

  /**
   * Converts {@link ReadableArray} of arguments into a list of Java Objects.
   * Throws {@link RuntimeException} if it can't convert some {@link ReadableType} to Object.
   * Method is used when converting Double to proper argument.
   */
  private static List<Object> getNativeArgumentsForMethod(ReadableArray arguments, ExportedModule.MethodInfo methodInfo) {
    List<Object> nativeArguments = new ArrayList<>();

    for (int i = 0; i < arguments.size(); i++) {
      nativeArguments.add(ArgumentsHelper.getNativeArgumentForExpectedClass(arguments.getDynamic(i), methodInfo.getParameterTypes()[i]));
    }
    return nativeArguments;
  }

  /**
   * Transforms exportedMethodsMap to a map of methodInfos
   */
  private List<Map<String, Object>> transformExportedMethodsMap(Map<String, Method> exportedMethods) {
    List<Map<String, Object>> methods = new ArrayList<>(exportedMethods.size());
    for (Map.Entry<String, Method> entry : exportedMethods.entrySet()) {
      methods.add(getMethodInfo(entry.getKey(), entry.getValue()));
    }
    return methods;
  }

  /**
   * Returns methodInfo Map (a Map containing a value for key argumentsCount).
   */
  private Map<String, Object> getMethodInfo(String name, Method method) {
    Map<String, Object> info = new HashMap<>(2);
    info.put(METHOD_INFO_NAME, name);
    info.put(METHOD_INFO_ARGUMENTS_COUNT, method.getParameterTypes().length - 1); // - 1 is for the Promise
    return info;
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
  public void onCatalystInstanceDestroy() {
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
