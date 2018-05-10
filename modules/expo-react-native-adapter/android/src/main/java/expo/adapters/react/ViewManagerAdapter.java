package expo.adapters.react;

import android.util.Log;
import android.view.ViewGroup;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

import expo.core.interfaces.ExpoProp;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.ViewManager;

public class ViewManagerAdapter<M extends ViewManager<V>, V extends ViewGroup> extends ViewGroupManager<V> implements ModuleRegistryConsumer {
  private M mViewManager;
  private Map<String, Method> mPropertiesMethods;

  public ViewManagerAdapter(M viewManager) {
    mViewManager = viewManager;
    mPropertiesMethods = getPropertiesMethods();
  }

  @Override
  protected V createViewInstance(ThemedReactContext reactContext) {
    return mViewManager.createViewInstance(reactContext);
  }

  @Override
  public void onDropViewInstance(V view) {
    mViewManager.onDropViewInstance(view);
    super.onDropViewInstance(view);
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();
    constants.put("eventNames", mViewManager.getExportedEventNames());
    return constants;
  }

  @Override
  public String getName() {
    return "ViewManagerAdapter_" + mViewManager.getName();
  }

  @ReactProp(name = "proxiedProperties")
  public void setProxiedProperties(V view, ReadableMap proxiedProperties) {
    ReadableMapKeySetIterator keyIterator = proxiedProperties.keySetIterator();
    while (keyIterator.hasNextKey()) {
      String key = keyIterator.nextKey();
      if (!mPropertiesMethods.containsKey(key)) {
        Log.e(getName(), "No setter found for prop " + key);
      } else {
        try {
          Class<?> propertyParameterType = mPropertiesMethods.get(key).getParameterTypes()[1];
          Dynamic dynamicPropertyValue = proxiedProperties.getDynamic(key);
          Object castPropertyValue = NativeModulesProxy.getNativeArgumentForExpectedClass(dynamicPropertyValue, propertyParameterType);
          mPropertiesMethods.get(key).invoke(mViewManager, view, castPropertyValue);
        } catch (Exception e) {
          Log.e(getName(), "Error when setting prop " + key + ". " + e.getMessage());
        }
      }
    }
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    MapBuilder.Builder<String, Object> builder = MapBuilder.builder();
    for(String eventName : mViewManager.getExportedEventNames()) {
      builder.put(eventName, MapBuilder.of("registrationName", eventName));
    }
    return builder.build();
  }

  private Map<String, Method> getPropertiesMethods() {
    Map<String, Method> propertiesMethods = new HashMap<>();
    Method[] methods = mViewManager.getClass().getDeclaredMethods();
    for (Method method : methods) {
      ExpoProp annotation = getExpoPropAnnotation(method);
      if (annotation != null) {
        propertiesMethods.put(annotation.name(), method);
      }
    }
    return propertiesMethods;
  }

  private ExpoProp getExpoPropAnnotation(Method method) {
    Annotation[] methodAnnotations = method.getDeclaredAnnotations();
    for (Annotation methodAnnotation : methodAnnotations) {
      if (methodAnnotation.annotationType() == ExpoProp.class) {
        return (ExpoProp) methodAnnotation;
      }
    }
    return null;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mViewManager.setModuleRegistry(moduleRegistry);
  }
}
