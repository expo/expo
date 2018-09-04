package abi30_0_0.host.exp.exponent.modules.api.screens;

import abi30_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi30_0_0.com.facebook.react.uimanager.annotations.ReactProp;

public class ScreenStackViewManager extends ScreenContainerViewManager {

  protected static final String REACT_CLASS = "RNSScreenStack";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ScreenContainer createViewInstance(ThemedReactContext reactContext) {
    return new ScreenStack(reactContext);
  }

  @ReactProp(name = "transitioning", defaultFloat = 0)
  public void setTransitioning(ScreenStack view, float transitioning) {
    view.setTransitioning(transitioning);
  }
}
