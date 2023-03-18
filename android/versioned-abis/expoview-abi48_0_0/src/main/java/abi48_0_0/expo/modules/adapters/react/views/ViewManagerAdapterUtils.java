package abi48_0_0.expo.modules.adapters.react.views;

import android.util.Log;
import android.view.View;

import abi48_0_0.com.facebook.react.bridge.Dynamic;
import abi48_0_0.com.facebook.react.bridge.ReadableMap;
import abi48_0_0.com.facebook.react.bridge.ReadableMapKeySetIterator;
import abi48_0_0.com.facebook.react.common.MapBuilder;

import java.util.HashMap;
import java.util.Map;

import abi48_0_0.expo.modules.adapters.react.ArgumentsHelper;
import abi48_0_0.expo.modules.core.ViewManager;

public class ViewManagerAdapterUtils {
  /* package */ static String getViewManagerAdapterName(ViewManager viewManager) {
    return "ViewManagerAdapter_" + viewManager.getName();
  }

  /* package */ static Map<String, Object> getConstants(ViewManager viewManager) {
    Map<String, Object> constants = new HashMap<>();
    constants.put("eventNames", viewManager.getExportedEventNames());
    return constants;
  }

  /* package */ static Map<String, Object> getExportedCustomDirectEventTypeConstants(ViewManager viewManager) {
    MapBuilder.Builder<String, Object> builder = MapBuilder.builder();
    // Somehow Java compiler thinks getExportedEventNames() returns list of Objects.
    // ¯\_(ツ)_/¯
    for (Object eventName : viewManager.getExportedEventNames()) {
      if (eventName instanceof String) {
        builder.put(normalizeEventName((String) eventName), MapBuilder.of("registrationName", eventName));
      }
    }
    return builder.build();
  }

  /* package */ static <V extends View> void setProxiedProperties(String viewManagerAdapterName, ViewManager<V> viewManager, V view, ReadableMap proxiedProperties) {
    ReadableMapKeySetIterator keyIterator = proxiedProperties.keySetIterator();
    while (keyIterator.hasNextKey()) {
      String key = keyIterator.nextKey();
      try {
        ViewManager.PropSetterInfo propSetterInfo = viewManager.getPropSetterInfos().get(key);
        if (propSetterInfo == null) {
          throw new IllegalArgumentException("No setter found for prop " + key + " in " + viewManagerAdapterName);
        }
        Dynamic dynamicPropertyValue = proxiedProperties.getDynamic(key);
        Object castPropertyValue = ArgumentsHelper.getNativeArgumentForExpectedClass(dynamicPropertyValue, propSetterInfo.getExpectedValueClass());
        viewManager.updateProp(view, key, castPropertyValue);
      } catch (Exception e) {
        Log.e(viewManagerAdapterName, "Error when setting prop " + key + ". " + e.getMessage());
      }
    }
  }

  public static String normalizeEventName(final String eventName) {
    if (eventName.startsWith("on")) {
      return "top" + eventName.substring(2);
    }
    return eventName;
  }
}
