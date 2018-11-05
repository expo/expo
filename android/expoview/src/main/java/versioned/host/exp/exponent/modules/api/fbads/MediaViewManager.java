package versioned.host.exp.exponent.modules.api.fbads;

import com.facebook.ads.MediaView;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

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
