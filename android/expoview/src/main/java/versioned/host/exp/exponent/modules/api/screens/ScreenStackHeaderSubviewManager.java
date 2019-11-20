package versioned.host.exp.exponent.modules.api.screens;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;

@ReactModule(name = ScreenStackHeaderSubviewManager.REACT_CLASS)
public class ScreenStackHeaderSubviewManager extends ReactViewManager {

  private static class SubviewShadowNode extends LayoutShadowNode {
    @Override
    public void setLocalData(Object data) {
      ScreenStackHeaderSubview.Measurements measurements = (ScreenStackHeaderSubview.Measurements) data;
      setStyleWidth(measurements.width);
      setStyleHeight(measurements.height);
    }
  }

  protected static final String REACT_CLASS = "RNSScreenStackHeaderSubview";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactViewGroup createViewInstance(ThemedReactContext context) {
    return new ScreenStackHeaderSubview(context);
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance(ReactApplicationContext context) {
    return new SubviewShadowNode();
  }

  @ReactProp(name = "type")
  public void setType(ScreenStackHeaderSubview view, String type) {
    if ("left".equals(type)) {
      view.setType(ScreenStackHeaderSubview.Type.LEFT);
    } else if ("center".equals(type)) {
      view.setType(ScreenStackHeaderSubview.Type.CENTER);
    } else if ("title".equals(type)) {
      view.setType(ScreenStackHeaderSubview.Type.TITLE);
    } else if ("right".equals(type)) {
      view.setType(ScreenStackHeaderSubview.Type.RIGHT);
    }
  }
}
