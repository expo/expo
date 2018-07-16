package expo.adapters.react;

import android.util.Log;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

import expo.core.ModuleRegistry;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.ViewManager;

public class ViewGroupManagerAdapter<M extends ViewManager<V>, V extends ViewGroup> extends ViewGroupManager<V> implements ModuleRegistryConsumer {
  private M mViewManager;

  public ViewGroupManagerAdapter(M viewManager) {
    mViewManager = viewManager;
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
      try {
        ViewManager.PropSetterInfo propSetterInfo = mViewManager.getPropSetterInfos().get(key);
        if (propSetterInfo == null) {
          throw new IllegalArgumentException("No setter found for prop " + key + " in " + getName());
        }
        Dynamic dynamicPropertyValue = proxiedProperties.getDynamic(key);
        Object castPropertyValue = ArgumentsHelper.getNativeArgumentForExpectedClass(dynamicPropertyValue, propSetterInfo.getExpectedValueClass());
        mViewManager.updateProp(view, key, castPropertyValue);
      } catch (Exception e) {
        Log.e(getName(), "Error when setting prop " + key + ". " + e.getMessage());
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

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    if (mViewManager instanceof ModuleRegistryConsumer) {
      ((ModuleRegistryConsumer) mViewManager).setModuleRegistry(moduleRegistry);
    }
  }
}
