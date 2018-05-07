package expo.adapters.react;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ExpoMethod;

/**
 * A wrapper/proxy for all {@link ExportedModule}s, gets exposed as {@link com.facebook.react.bridge.NativeModule},
 * so that JS code can call methods of the internal modules.
 */
/* package */ class NativeModulesProxy extends ReactContextBaseJavaModule {
  private final static String NAME = "ExpoNativeModuleProxy";
  private final static String EXPORTED_METHODS_CONSTANT_NAME = "exportedMethods";

  private final static String METHOD_INFO_ARGUMENTS_COUNT = "argumentsCount";

  private final static String UNEXPECTED_ERROR = "E_UNEXPECTED_ERROR";
  private final static String UNDEFINED_METHOD_ERROR = "E_UNDEFINED_METHOD";
  private final static String ARGS_TYPES_MISMATCH_ERROR = "E_ARGS_TYPES_MISMATCH";

  private ModuleRegistry mModuleRegistry;

  /* package */ NativeModulesProxy(ReactApplicationContext context, ModuleRegistry moduleRegistry) {
    super(context);
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>(1);

    Collection<ExportedModule> exportedModules = mModuleRegistry.getAllExportedModules();
    Map<String, Object> exportedMethodsMap = new HashMap<>(exportedModules.size());

    for (ExportedModule exportedModule : exportedModules) {
      String moduleName = exportedModule.getName();
      constants.put(moduleName, exportedModule.getConstants());
      exportedMethodsMap.put(moduleName, transformExportedMethodsMap(exportedModule.getExportedMethods()));
    }

    constants.put(EXPORTED_METHODS_CONSTANT_NAME, exportedMethodsMap);
    return constants;
  }

  /**
   * The only exported {@link ReactMethod}.
   * JavaScript can call native modules' exported methods ({@link ExpoMethod}) using this method as a proxy.
   * For native {@link ExpoMethod} `void put(String key, int value)` in `NativeDictionary` module
   * JavaScript could call `NativeModulesProxy.callMethod("NativeDictionary", "put", ["key", 42])`.
   */
  @ReactMethod
  public void callMethod(String moduleName, String methodName, ReadableArray arguments, final Promise promise) {
    try {
      List<Object> nativeArguments = getNativeArgumentsForMethod(arguments, mModuleRegistry.getExportedModule(moduleName).getExportedMethods().get(methodName));
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
  private static List<Object> getNativeArgumentsForMethod(ReadableArray arguments, Method method) {
    List<Object> nativeArguments = new ArrayList<>();

    for (int i = 0; i < arguments.size(); i++) {
      nativeArguments.add(getNativeArgumentForExpectedClass(arguments.getDynamic(i), method.getParameterTypes()[i]));
    }
    return nativeArguments;
  }

  /* package */ static Object getNativeArgumentForExpectedClass(Dynamic argument, Class<?> expectedArgumentClass) {
    switch (argument.getType()) {
      case String:
        return argument.asString();
      case Map:
        return argument.asMap().toHashMap();
      case Array:
        return argument.asArray().toArrayList();
      case Number:
        // Argument of type .Number is remembered as Double by default.
        Double doubleArgument = argument.asDouble();
        // We have to provide ExportedModule with proper Number value
        if (expectedArgumentClass == byte.class || expectedArgumentClass == Byte.class) {
          return doubleArgument.byteValue();
        } else if (expectedArgumentClass == short.class || expectedArgumentClass == Short.class) {
          return doubleArgument.shortValue();
        } else if (expectedArgumentClass == int.class || expectedArgumentClass == Integer.class) {
          return doubleArgument.intValue();
        } else if (expectedArgumentClass == float.class || expectedArgumentClass == Float.class) {
          return doubleArgument.floatValue();
        } else if (expectedArgumentClass == long.class || expectedArgumentClass == Long.class) {
          return doubleArgument.longValue();
        } else {
          return doubleArgument;
        }
      case Boolean:
        return argument.asBoolean();
      case Null:
        return null;
      default:
        // JS argument is not null, however we can't recognize the type.
        throw new RuntimeException(
                "Don't know how to convert React Native argument of type " + argument.getType() + " to native."
        );
    }
  }

  /**
   * Transforms exportedMethodsMap to a map of methodInfos
   */
  private Map<String, Object> transformExportedMethodsMap(Map<String, Method> exportedMethods) {
    Map<String, Object> methods = new HashMap<>(exportedMethods.size());
    for (Map.Entry<String, Method> entry : exportedMethods.entrySet()) {
      methods.put(entry.getKey(), getMethodInfo(entry.getValue()));
    }
    return methods;
  }

  /**
   * Returns methodInfo Map (a Map containing a value for key argumentsCount).
   */
  private Map<String, Object> getMethodInfo(Method method) {
    Map<String, Object> info = new HashMap<>(1);
    info.put(METHOD_INFO_ARGUMENTS_COUNT, method.getParameterTypes().length - 1); // - 1 is for the Promise
    return info;
  }
}
