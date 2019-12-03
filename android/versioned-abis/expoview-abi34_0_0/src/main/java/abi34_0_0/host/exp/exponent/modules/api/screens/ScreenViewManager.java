package abi34_0_0.host.exp.exponent.modules.api.screens;

import abi34_0_0.com.facebook.react.module.annotations.ReactModule;
import abi34_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi34_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi34_0_0.com.facebook.react.uimanager.annotations.ReactProp;

@ReactModule(name = ScreenViewManager.REACT_CLASS)
public class ScreenViewManager extends ViewGroupManager<Screen> {

  protected static final String REACT_CLASS = "RNSScreen";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected Screen createViewInstance(ThemedReactContext reactContext) {
    return new Screen(reactContext);
  }

  @ReactProp(name = "active", defaultFloat = 0)
  public void setActive(Screen view, float active) {
    view.setActive(active != 0);
  }
}
