package expo.adapters.react;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

import expo.core.ExportedModule;
import expo.core.ExpoMethod;

/**
 * A wrapper/proxy for all {@link ExportedModule}s, gets exposed as {@link com.facebook.react.bridge.NativeModule},
 * so that JS code can call methods of the internal modules.
 */
/* package */ class NativeModulesProxy extends ReactContextBaseJavaModule {
  private final static String NAME = "ExpoNativeModuleProxy";
  private final static String EXPORTED_METHODS_CONSTANT_NAME = "exportedMethodsNames";

  private final static String UNEXPECTED_ERROR = "E_UNEXPECTED_ERROR";
  private final static String UNDEFINED_METHOD_ERROR = "E_UNDEFINED_METHOD";
  private final static String INVALID_ARGS_COUNT_ERROR = "E_INVALID_ARGS_COUNT";
  private final static String ARGS_TYPES_MISMATCH_ERROR = "E_ARGS_TYPES_MISMATCH";

  private Map<String, Object> mConstantsMap;
  private Map<String, ExportedModule> mModulesMap;
  private Map<String, Map<String, Method>> mExportedMethodsMap;

  /* package */ NativeModulesProxy(ReactApplicationContext context, ExportedModule[] exportedModules) {
    super(context);

    mConstantsMap = new HashMap<>();
    mExportedMethodsMap = new HashMap<>();
    mModulesMap = new HashMap<>(exportedModules.length);

    HashMap<String, List<String>> exportedMethodsNamesMap = new HashMap<>();

    // We cache and export names of all available methods for every native module
    // so we can implement a small JS proxy that will provide much sweeter syntax
    mConstantsMap.put(EXPORTED_METHODS_CONSTANT_NAME, new HashMap<String, String>());

    for (ExportedModule exportedModule : exportedModules) {
      String moduleName = exportedModule.getName();
      Map<String, Method> exportedMethodsMap = exportedModule.getExportedMethods();

      mModulesMap.put(moduleName, exportedModule);
      mExportedMethodsMap.put(moduleName, exportedMethodsMap);
      mConstantsMap.put(moduleName, exportedModule.getConstants());

      exportedMethodsNamesMap.put(moduleName, new ArrayList<>(exportedMethodsMap.keySet()));
    }

    mConstantsMap.put(EXPORTED_METHODS_CONSTANT_NAME, exportedMethodsNamesMap);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    return mConstantsMap;
  }

  /**
   * The only exported {@link ReactMethod}.
   * JavaScript can call native modules' exported methods ({@link ExpoMethod}) using this method as a proxy.
   * For native {@link ExpoMethod} `void put(String key, int value)` in `NativeDictionary` module
   * JavaScript could call `NativeDictionary.callMethod("NativeDictionary", "put", ["key", 21])`.
   */
  @ReactMethod
  public void callMethod(String moduleName, String methodName, ReadableArray arguments, final Promise promise) {
    Method method = mExportedMethodsMap.get(moduleName).get(methodName);
    String fullMethodName = moduleName + "#" + methodName;

    // Check if method of such name exists
    if (method == null) {
      promise.reject(
        UNDEFINED_METHOD_ERROR,
        "Method " + methodName + " of Java module " + moduleName + " is undefined."
      );
      return;
    }

    Class<?>[] methodParameterTypes = method.getParameterTypes();

    // Check if parameters count matches
    if (methodParameterTypes.length != arguments.size() + 1) { // + 1 is for Promise
      promise.reject(
        INVALID_ARGS_COUNT_ERROR,
        "Invalid number of arguments for method call " + fullMethodName + " " +
          "(native expects " + (methodParameterTypes.length - 1) + ", " + arguments.size() + " supplied)."
      );
      return;
    }

    try {
      List<Object> nativeArguments = getNativeArgumentsForParameterTypes(arguments, methodParameterTypes);
      nativeArguments.add(new PromiseWrapper(promise));

      method.invoke(mModulesMap.get(moduleName), nativeArguments.toArray());
    } catch (IllegalAccessException | InvocationTargetException e) {
      promise.reject(UNEXPECTED_ERROR, "Encountered an exception while calling native method: " + e.getMessage(), e);
    } catch (IllegalArgumentException e) {
      promise.reject(ARGS_TYPES_MISMATCH_ERROR, "Exception in call to " + moduleName + "#" + methodName + ": " + e.getMessage(), e);
    }
  }

  /**
   * Converts {@link ReadableArray} of arguments into a list of Java Objects.
   * Throws {@link IllegalArgumentException} if object argument types mismatch.
   */
  private static List<Object> getNativeArgumentsForParameterTypes(ReadableArray arguments, Class[] parameterTypes) throws IllegalArgumentException {
    List<Object> nativeArguments = new ArrayList<>();

    for (int i = 0; i < arguments.size(); i++) {
      Class<?> parameterType = parameterTypes[i];
      ReadableType argumentType = arguments.getType(i);
      Class<?> expectedArgumentClass = getClassForReadableType(arguments.getType(i));

      if (
        // This clause can only handle Object-descendants.
        // Without this first check we get "Number is not assignable from native int"
        // for `int` arguments, which is of course true,
        // but also will be handled by the switch below.
        // The only situation we consciously omit here is a JS `method(false)` call
        // to native `void method(int val, Promise...)`.
        // Fortunately, this will be caught by Java when we invoke the method.
        Object.class.isAssignableFrom(parameterType)
          && expectedArgumentClass != null
          && !expectedArgumentClass.isAssignableFrom(parameterType)) {
        throw new IllegalArgumentException(
          "JS argument of type " + arguments.getType(i) + " is not assignable from native argument class " + parameterType + "."
        );
      }

      switch (argumentType) {
        case String:
          nativeArguments.add(arguments.getString(i));
          break;
        case Map:
          nativeArguments.add(arguments.getMap(i).toHashMap());
          break;
        case Array:
          nativeArguments.add(arguments.getArray(i).toArrayList());
          break;
        case Number:
          if (parameterTypes[i] == int.class || parameterTypes[i] == Integer.class) {
            nativeArguments.add(arguments.getInt(i));
          } else {
            // Argument of type .Number is remembered as Double by default.
            nativeArguments.add(arguments.getDouble(i));
          }
          break;
        case Boolean:
          nativeArguments.add(arguments.getBoolean(i));
          break;
        case Null:
          if (!Object.class.isAssignableFrom(parameterType)) {
            // We should throw an exception, as we cannot assign null to an argument of not-Object type.
            throw new IllegalArgumentException(
              "Native parameter of type " + parameterType + " cannot expect null value."
            );
          } else {
            nativeArguments.add(null);
          }
          break;
        default:
          // JS argument is not null, however we can't recognize the type.
          throw new IllegalArgumentException(
            "Don't know how to convert of argument of type " + argumentType + " to native."
          );
      }
    }
    return nativeArguments;
  }

  /**
   * Returns corresponding native Class for value of {@link ReadableType}.
   */
  private static Class<?> getClassForReadableType(ReadableType type) {
    switch (type) {
      case Array:
        return List.class;
      case Boolean:
        return Boolean.class;
      case Map:
        return Map.class;
      case Number:
        return Number.class;
      case String:
        return String.class;
      case Null:
      default:
        return null;
    }
  }
}
