package abi47_0_0.expo.modules.gl;

import android.content.Context;

import java.util.Arrays;
import java.util.List;

import abi47_0_0.expo.modules.core.ModuleRegistry;
import abi47_0_0.expo.modules.core.ViewManager;

public class GLViewManager extends ViewManager<GLView> {
  private ModuleRegistry mModuleRegistry;

  @Override
  public String getName() {
    return "ExponentGLView";
  }

  @Override
  public GLView createViewInstance(Context context) {
    return new GLView(context, mModuleRegistry);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.SIMPLE;
  }

  @Override
  public List<String> getExportedEventNames() {
    return Arrays.asList("onSurfaceCreate");
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
