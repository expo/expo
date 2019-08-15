package expo.modules.wallet;

import android.content.Context;

import java.util.Arrays;
import java.util.List;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.ViewManager;

public class WalletViewManager extends ViewManager<WalletView> {
  private static final String TAG = "ExpoWalletView";

  private ModuleRegistry mModuleRegistry;

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public WalletView createViewInstance(Context context) {
    return new WalletView(context, mModuleRegistry);
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
