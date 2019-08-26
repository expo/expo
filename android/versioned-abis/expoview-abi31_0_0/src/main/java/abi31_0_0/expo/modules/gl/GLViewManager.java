package abi31_0_0.expo.modules.gl;

import android.content.Context;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import abi31_0_0.expo.core.ModuleRegistry;
import abi31_0_0.expo.core.ViewManager;
import abi31_0_0.expo.core.interfaces.ExpoProp;
import abi31_0_0.expo.core.interfaces.ModuleRegistryConsumer;

public class GLViewManager extends ViewManager<GLView> implements ModuleRegistryConsumer {
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
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
