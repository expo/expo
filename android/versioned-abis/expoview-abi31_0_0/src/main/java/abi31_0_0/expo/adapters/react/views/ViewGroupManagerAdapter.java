package abi31_0_0.expo.adapters.react.views;

import android.view.ViewGroup;

import abi31_0_0.com.facebook.react.bridge.ReadableMap;
import abi31_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi31_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi31_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import javax.annotation.Nullable;

import abi31_0_0.expo.core.ModuleRegistry;
import abi31_0_0.expo.core.interfaces.ModuleRegistryConsumer;
import abi31_0_0.expo.core.ViewManager;

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
