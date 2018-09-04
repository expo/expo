package abi30_0_0.host.exp.exponent.modules.api.fbads;

import com.facebook.ads.AdIconView;
import abi30_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi30_0_0.com.facebook.react.uimanager.ThemedReactContext;

public class AdIconViewManager extends SimpleViewManager<AdIconView> {
  private static final String REACT_CLASS = "AdIconView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected AdIconView createViewInstance(ThemedReactContext reactContext) {
    return new AdIconView(reactContext);
  }
}
