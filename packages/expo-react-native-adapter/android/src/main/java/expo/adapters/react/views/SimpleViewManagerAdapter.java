package expo.adapters.react.views;

import android.view.View;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import javax.annotation.Nullable;

import expo.core.ModuleRegistry;
import expo.core.ViewManager;
import expo.core.interfaces.ModuleRegistryConsumer;

public class SimpleViewManagerAdapter<M extends ViewManager<V>, V extends View> extends SimpleViewManager<V> implements ModuleRegistryConsumer {
  private M mViewManager;

  public SimpleViewManagerAdapter(M viewManager) {
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
    return ViewManagerAdapterUtils.getConstants(mViewManager);
  }

  @Override
  public String getName() {
    return ViewManagerAdapterUtils.getViewManagerAdapterName(mViewManager);
  }

  @ReactProp(name = "proxiedProperties")
  public void setProxiedProperties(V view, ReadableMap proxiedProperties) {
    ViewManagerAdapterUtils.setProxiedProperties(getName(), mViewManager, view, proxiedProperties);
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return ViewManagerAdapterUtils.getExportedCustomDirectEventTypeConstants(mViewManager);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    ViewManagerAdapterUtils.setModuleRegistryOnViewManager(mViewManager, moduleRegistry);
  }
}
