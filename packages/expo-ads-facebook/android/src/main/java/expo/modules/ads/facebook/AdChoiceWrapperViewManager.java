package expo.modules.ads.facebook;
import android.content.Context;
import expo.core.ModuleRegistry;
import expo.core.ViewManager;
import expo.core.interfaces.ExpoProp;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;

public class AdChoiceWrapperViewManager extends ViewManager<AdChoiceWrapperView> implements ModuleRegistryConsumer {

  ModuleRegistry mModuleRegistry;

  @Override
  public String getName() {
    return "AdChoiceWrapper";
  }

  @Override
  public AdChoiceWrapperView createViewInstance(Context context) {
    return new AdChoiceWrapperView(context);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.GROUP;
  }

  @ExpoProp(name = "nativeAdViewTag")
  public void setNativeAdViewTag(final AdChoiceWrapperView view, final int nativeAdTag) {
    if (nativeAdTag == -1) {
      return;
    }
    mModuleRegistry.getModule(UIManager.class).addUIBlock(new UIManager.GroupUIBlock() {
      @Override
      public void execute(UIManager.ViewHolder viewHolder) {
        NativeAdView nativeAdView = null;

        if (nativeAdTag != -1) {
          nativeAdView = (NativeAdView) viewHolder.get(nativeAdTag);
        }

        view.setNativeAdView(nativeAdView);
      }
    });
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
