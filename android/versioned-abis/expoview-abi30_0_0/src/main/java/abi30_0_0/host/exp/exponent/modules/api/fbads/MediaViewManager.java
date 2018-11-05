package abi30_0_0.host.exp.exponent.modules.api.fbads;

import com.facebook.ads.MediaView;
import abi30_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi30_0_0.com.facebook.react.uimanager.ThemedReactContext;

import host.exp.exponent.analytics.EXL;

public class MediaViewManager extends SimpleViewManager<MediaView> {
  private static final String REACT_CLASS = "MediaView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected MediaView createViewInstance(ThemedReactContext reactContext) {
    return new MediaView(reactContext);
  }
}
