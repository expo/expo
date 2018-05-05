package expo.core;

import android.content.Context;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Abstract class for exported modules, i. e. modules which export some methods to client code.
 * Use {@link ExpoMethod} or override {@link ExportedModule#getExportedMethods()}
 * to export specific methods to client code.
 */
public abstract class ExportedModule {
  private Context mContext;

  public ExportedModule(Context context) {
    mContext = context;
  }

  public abstract String getName();

  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(Collections.<String, Object>emptyMap());
  }

  protected Context getContext() {
    return mContext;
  }

  /**
   * Creates a String-keyed map of methods exported from {@link ExportedModule},
   * i. e. methods annotated with {@link ExpoMethod}, which should be available in client code land.
   *
   * This method is supposed to be called only once for every module instance -- platform adapters
   * should cache maps returned by this method.
   */
  public Map<String, Method> getExportedMethods() {
    Map<String, Method> exportedMethodsMap = new HashMap<>();
    Method[] declaredMethodsArray = getClass().getDeclaredMethods();

    for (Method method : declaredMethodsArray) {
      if (method.getAnnotation(ExpoMethod.class) != null) {
        String methodName = method.getName();
        Class<?>[] methodParameterTypes = method.getParameterTypes();
        Class<?> lastParameterClass = methodParameterTypes[methodParameterTypes.length - 1];

        if (lastParameterClass != expo.core.Promise.class) {
          throw new IllegalArgumentException(
                  "Last argument of method " + methodName + " of Java Module " + getName() + " does not expect a Promise"
          );
        }

        if (exportedMethodsMap.containsKey(methodName)) {
          throw new IllegalArgumentException(
                  "Java Module " + getName() + " method name already registered: " + methodName + "."
          );
        }

        exportedMethodsMap.put(methodName, method);
      }
    }

    return exportedMethodsMap;
  }
}
