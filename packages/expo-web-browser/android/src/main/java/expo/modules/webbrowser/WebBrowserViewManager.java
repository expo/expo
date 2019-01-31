package expo.modules.webbrowser;

import android.content.Context;

import java.util.Arrays;
import java.util.List;

import expo.core.ModuleRegistry;
import expo.core.ViewManager;
import expo.core.interfaces.ModuleRegistryConsumer;

public class WebBrowserViewManager extends ViewManager<WebBrowserView> implements ModuleRegistryConsumer {
  private static final String TAG = "ExpoWebBrowserView";

  private ModuleRegistry mModuleRegistry;

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public WebBrowserView createViewInstance(Context context) {
    return new WebBrowserView(context, mModuleRegistry);
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
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
