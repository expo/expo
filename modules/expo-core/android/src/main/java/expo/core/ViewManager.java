package expo.core;

import android.content.Context;
import android.view.View;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.interfaces.ExpoProp;

public abstract class ViewManager<V extends View> {
  private Map<String, Method> mPropSetters;

  public abstract String getName();
  public abstract V createViewInstance(Context context);

  public List<String> getExportedEventNames() {
    return Collections.emptyList();
  }

  public void onDropViewInstance(V view) {
    // by default do nothing
  }

  public Map<String, Method> getPropSetters() {
    if (mPropSetters != null) {
      return mPropSetters;
    }

    mPropSetters = new HashMap<>();
    Method[] declaredMethodsArray = getClass().getDeclaredMethods();

    for (Method method : declaredMethodsArray) {
      if (method.getAnnotation(ExpoProp.class) != null) {
        ExpoProp propAnnotation = method.getAnnotation(ExpoProp.class);
        String propName = propAnnotation.name();
        Class<?>[] methodParameterTypes = method.getParameterTypes();
        if (methodParameterTypes.length != 2) {
          throw new IllegalArgumentException("Expo prop setter should define at least two arguments: view and prop value. Propsetter for " + propName + " of module " + getName() + " does not define these arguments.");
        }

        if (mPropSetters.containsKey(propName)) {
          throw new IllegalArgumentException(
                  "View manager " + getName() + " prop setter name already registered: " + propName + "."
          );
        }

        mPropSetters.put(propName, method);
      }
    }

    return mPropSetters;
  }

  public void updateProp(V view, String propName, Object propValue) throws RuntimeException {
    Method propSetter = getPropSetters().get(propName);
    if (propSetter == null) {
      throw new IllegalArgumentException("There is no propSetter in " + getName() + " for prop of name " + propName + ".");
    }

    // We've validated parameter types length in getPropSetters()
    Object transformedPropertyValue = transformArgumentToClass(propValue, propSetter.getParameterTypes()[1]);

    try {
      propSetter.invoke(this, view, transformedPropertyValue);
    } catch (IllegalAccessException | InvocationTargetException e) {
      throw new RuntimeException("Exception occurred while updating property " + propName
              + " on module " + getName() + ": " + e.getMessage(), e);
    }
  }

  protected Object transformArgumentToClass(Object argument, Class<?> expectedArgumentClass) {
    return ArgumentsHelper.transformArgumentToClass(argument, expectedArgumentClass);
  }
}
