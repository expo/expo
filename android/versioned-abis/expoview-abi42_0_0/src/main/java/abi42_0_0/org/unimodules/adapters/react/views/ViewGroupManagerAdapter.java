package abi42_0_0.org.unimodules.adapters.react.views;

import android.view.ViewGroup;

import abi42_0_0.com.facebook.react.bridge.ReadableMap;
import abi42_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi42_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi42_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import javax.annotation.Nullable;

import abi42_0_0.org.unimodules.core.ModuleRegistry;
import abi42_0_0.org.unimodules.core.ViewManager;
import abi42_0_0.org.unimodules.core.interfaces.RegistryLifecycleListener;

public class ViewGroupManagerAdapter<M extends ViewManager<V>, V extends ViewGroup> extends ViewGroupManager<V> implements RegistryLifecycleListener {
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
  public void onCreate(ModuleRegistry moduleRegistry) {
    mViewManager.onCreate(moduleRegistry);
  }
}
