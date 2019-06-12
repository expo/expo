package expo.modules.device;

import android.content.Context;

import java.util.Arrays;
import java.util.List;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.ViewManager;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

public class DeviceViewManager extends ViewManager<DeviceView> implements RegistryLifecycleListener {
  private static final String TAG = "ExpoDeviceView";

  private ModuleRegistry mModuleRegistry;

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public DeviceView createViewInstance(Context context) {
    return new DeviceView(context, mModuleRegistry);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.SIMPLE;
  }

  @Override
  public List<String> getExportedEventNames() {
    return Arrays.asList("onSomethingHappened");
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
