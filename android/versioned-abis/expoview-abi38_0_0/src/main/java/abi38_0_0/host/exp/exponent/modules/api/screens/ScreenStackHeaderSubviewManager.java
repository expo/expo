package abi38_0_0.host.exp.exponent.modules.api.screens;

import abi38_0_0.com.facebook.react.module.annotations.ReactModule;
import abi38_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi38_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi38_0_0.com.facebook.react.views.view.ReactViewGroup;
import abi38_0_0.com.facebook.react.views.view.ReactViewManager;

@ReactModule(name = ScreenStackHeaderSubviewManager.REACT_CLASS)
public class ScreenStackHeaderSubviewManager extends ReactViewManager {

  protected static final String REACT_CLASS = "RNSScreenStackHeaderSubview";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactViewGroup createViewInstance(ThemedReactContext context) {
    return new ScreenStackHeaderSubview(context);
  }

  @ReactProp(name = "type")
  public void setType(ScreenStackHeaderSubview view, String type) {
    if ("left".equals(type)) {
      view.setType(ScreenStackHeaderSubview.Type.LEFT);
    } else if ("center".equals(type)) {
      view.setType(ScreenStackHeaderSubview.Type.CENTER);
    } else if ("right".equals(type)) {
      view.setType(ScreenStackHeaderSubview.Type.RIGHT);
    } else if ("back".equals(type)) {
      view.setType(ScreenStackHeaderSubview.Type.BACK);
    }
  }
}
