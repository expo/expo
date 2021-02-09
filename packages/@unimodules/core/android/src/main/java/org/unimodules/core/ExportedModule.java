package org.unimodules.core;

import android.content.Context;

import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Abstract class for exported modules, i. e. modules which export some methods to client code.
 * Use {@link ExpoMethod} or override {@link ExportedModule#getExportedMethods()}
 * to export specific methods to client code and then {@link ExportedModule#invokeExportedMethod(String, Collection)}
 * to support them.
 */
public abstract class ExportedModule implements RegistryLifecycleListener {
  public class MethodInfo {
    private Class<?>[] mParameterTypes;

    MethodInfo(Method method) {
      mParameterTypes = method.getParameterTypes();
    }

    public Class<?>[] getParameterTypes() {
      return mParameterTypes;
    }
  }

  private Context mContext;
  private Map<String, Method> mExportedMethods;
  private Map<String, MethodInfo> mExportedMethodInfos;

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
   * Returns a map of { exportedMethodName => methodInfo } so that eg. platform adapter knows
   * what classes of arguments does the method expect.
   */
  public Map<String, MethodInfo> getExportedMethodInfos() {
    if (mExportedMethodInfos != null) {
      return mExportedMethodInfos;
    }

    Map<String, MethodInfo> exportedMethodInfos = new HashMap<>();
    for (Map.Entry<String, Method> entry : getExportedMethods().entrySet()) {
      exportedMethodInfos.put(entry.getKey(), new MethodInfo(entry.getValue()));
    }
    mExportedMethodInfos = exportedMethodInfos;
    return mExportedMethodInfos;
  }

  /**
   * Invokes an exported method
   */
  public Object invokeExportedMethod(String methodName, Collection<Object> arguments) throws NoSuchMethodException, RuntimeException {
    Method method = mExportedMethods.get(methodName);

    if (method == null) {
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
    } catch (IllegalAccessException e) {
      e.printStackTrace();
      throw new RuntimeException("Exception occurred while executing exported method " + methodName
          + " on module " + getName() + ": " + e.getMessage(), e);
    } catch (InvocationTargetException e) {
      e.printStackTrace();
      throw new RuntimeException("Exception occurred while executing exported method " + methodName
          + " on module " + getName() + ": " + e.getCause().getMessage(), e.getCause());
    }
  }

  protected Object transformArgumentToClass(Object argument, Class<?> expectedArgumentClass) {
    return ArgumentsHelper.validatedArgumentForClass(argument, expectedArgumentClass);
  }

  /**
   * Creates or returns a cached String-keyed map of validated methods exported from {@link ExportedModule},
   * i. e. methods annotated with {@link ExpoMethod}, which should be available in client code land.
   */
  public Map<String, Method> getExportedMethods() {
    if (mExportedMethods != null) {
      return mExportedMethods;
    }

    mExportedMethods = new HashMap<>();
    Class klass = getClass();
    while (klass != null && ExportedModule.class.isAssignableFrom(klass)) {
      Map<String, Method> exportedMethods = getExportedMethods(klass);
      for (Map.Entry<String, Method> methodEntry : exportedMethods.entrySet()) {
        // Do not overwrite methods from subclasses with methods from superclasses
        // (We're iterating from the furthest subclass to ExportedModule.)
        if (!mExportedMethods.containsKey(methodEntry.getKey())) {
          mExportedMethods.put(methodEntry.getKey(), methodEntry.getValue());
        }
      }
      klass = klass.getSuperclass();
    }
    return mExportedMethods;
  }

  protected Map<String, Method> getExportedMethods(Class klass) {
    Map<String, Method> exportedMethods = new HashMap<>();
    Method[] declaredMethodsArray = klass.getDeclaredMethods();

    for (Method method : declaredMethodsArray) {
      if (method.getAnnotation(ExpoMethod.class) != null) {
        String methodName = method.getName();
        Class<?>[] methodParameterTypes = method.getParameterTypes();
        if (methodParameterTypes.length < 1) {
          throw new IllegalArgumentException(
              "Method " + methodName + " of Java Module " + getName() + " does not define any arguments - minimum argument set is a Promise"
          );
        }

        Class<?> lastParameterClass = methodParameterTypes[methodParameterTypes.length - 1];

        if (lastParameterClass != org.unimodules.core.Promise.class) {
          throw new IllegalArgumentException(
              "Last argument of method " + methodName + " of Java Module " + getName() + " does not expect a Promise"
          );
        }

        if (exportedMethods.containsKey(methodName)) {
          throw new IllegalArgumentException(
              "Java Module " + getName() + " method name already registered: " + methodName + "."
          );
        }

        exportedMethods.put(methodName, method);
      }
    }

    return exportedMethods;
  }
}
