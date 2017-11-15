package abi23_0_0.host.exp.exponent.modules.api.gl;

import abi23_0_0.com.facebook.react.common.MapBuilder;
import abi23_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi23_0_0.com.facebook.react.uimanager.ThemedReactContext;

import java.util.Map;

import javax.annotation.Nullable;

public class GLViewManager extends SimpleViewManager<GLView> {
  public static final String REACT_CLASS = "ExponentGLView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public GLView createViewInstance(ThemedReactContext context) {
    return new GLView(context);
  }

  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
            "surfaceCreate",
            MapBuilder.of("registrationName", "onSurfaceCreate"));
  }
}
