package expo.core;

import android.content.Context;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import expo.core.interfaces.ExpoMethod;

/**
 * Abstract class for exported modules, i. e. modules which export some methods to client code.
 * Use {@link ExpoMethod} or override {@link ExportedModule#getExportedMethods()}
 * to export specific methods to client code and then {@link ExportedModule#invokeExportedMethod(String, Collection)}
 * to support them.
 */
public abstract class ExportedModule {
  private Context mContext;
  private Map<String, Method> mExportedMethods;

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
   */
  public Map<String, Method> getExportedMethods() {
    if (mExportedMethods != null) {
      return mExportedMethods;
    }

    mExportedMethods = new HashMap<>();
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

        if (mExportedMethods.containsKey(methodName)) {
          throw new IllegalArgumentException(
                  "Java Module " + getName() + " method name already registered: " + methodName + "."
          );
        }

        mExportedMethods.put(methodName, method);
      }
    }

    return mExportedMethods;
  }

  /**
   * Invokes an exported method
   */
  public Object invokeExportedMethod(String methodName, Collection<Object> arguments) throws NoSuchMethodException, RuntimeException {
    Method method = mExportedMethods.get(methodName);

    if (method  == null) {
      throw new NoSuchMethodException("Module " + getName() + "does not export method " + methodName + ".");
    }

    int expectedArgumentsCount = method.getParameterTypes().length;
    if (arguments.size() != expectedArgumentsCount) {
      throw new IllegalArgumentException(
              "Method " + methodName + " on class " + getName() + " expects " + expectedArgumentsCount + " arguments, "
                      + "whereas " + arguments.size() + " arguments have been provided.");
    }

    Class<?>[] expectedArgumentClasses = method.getParameterTypes();
    Iterator<Object> actualArgumentsIterator = arguments.iterator();
    List<Object> transformedArguments = new ArrayList<>(arguments.size());

    for (int i = 0; i < expectedArgumentsCount; i++) {
      transformedArguments.add(transformArgumentToClass(actualArgumentsIterator.next(), expectedArgumentClasses[i]));
    }

    try {
      return method.invoke(this, transformedArguments.toArray());
    } catch (IllegalAccessException | InvocationTargetException e) {
      throw new RuntimeException("Exception occurred while executing exported method " + methodName
              + " on module " + getName() + ": " + e.getMessage(), e);
    }
  }

  protected Object transformArgumentToClass(Object argument, Class<?> expectedArgumentClass) {
    if (Object.class.isAssignableFrom(expectedArgumentClass)) {
      // Expected argument class is an Object descendant
      if (argument != null) {
        // Actual argument is not null, so we can check whether
        // its class matches expectation.
        Class<?> actualArgumentClass = argument.getClass();

        if (!expectedArgumentClass.isAssignableFrom(actualArgumentClass)) {
          // Expected argument class is not assignable from actual argument class
          // i. e. eg. Map was provided for a String argument.
          throw new IllegalArgumentException(
                  "Argument of an incompatible class: " + actualArgumentClass
                          + " cannot be passed as an argument to parameter expecting " + expectedArgumentClass + ".");
        }
      }
    } else {
      // Argument is of primitive type, like boolean or int.
      if (argument == null) {
        throw new IllegalArgumentException(
                "Argument null cannot be passed to an argument to parameter expecting " + expectedArgumentClass + ".");
      }

      Class<?> actualArgumentClass = argument.getClass();
      if (expectedArgumentClass != actualArgumentClass) {
        if (!Number.class.isAssignableFrom(actualArgumentClass)) {
          throw new IllegalArgumentException("Argument of an incompatible class: "
                  + actualArgumentClass + " cannot be passed as an argument to parameter expecting " + expectedArgumentClass + ".");
        } else {
          // Expected argument is of type int or long and actual argument class is a descendant of Number.
          // We believe that platform adapter has coerced the value correctly and when expected argument
          // is int, actual argument is Integer; when expected is float, actual is Float, etc.
          // If it's not, Java will throw a developer-readable exception.
        }
      }
    }

    // All checks passed
    return argument;
  }
}