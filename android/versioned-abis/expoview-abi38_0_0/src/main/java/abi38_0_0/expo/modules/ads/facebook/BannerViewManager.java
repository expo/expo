package abi38_0_0.expo.modules.ads.facebook;

import android.content.Context;

import com.facebook.ads.AdSize;

import java.util.Arrays;
import java.util.List;

import abi38_0_0.org.unimodules.core.ModuleRegistry;
import abi38_0_0.org.unimodules.core.ViewManager;
import abi38_0_0.org.unimodules.core.interfaces.ExpoProp;

public class BannerViewManager extends ViewManager<BannerView> {
  private ModuleRegistry mModuleRegistry;

  @ExpoProp(name = "placementId")
  public void setPlacementId(BannerView view, String placementId) {
    view.setPlacementId(placementId);
  }

  @ExpoProp(name = "size")
  public void setSize(BannerView view, int size) {
    AdSize adSize;
    switch (size) {
      case 90:
        adSize = AdSize.BANNER_HEIGHT_90;
        break;
      case 250:
        adSize = AdSize.RECTANGLE_HEIGHT_250;
        break;
      case 50:
      default:
        adSize = AdSize.BANNER_HEIGHT_50;
    }
    view.setSize(adSize);
  }

  @Override
  public BannerView createViewInstance(Context context) {
    return new BannerView(context, mModuleRegistry);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.SIMPLE;
  }

  @Override
  public List<String> getExportedEventNames() {
    return Arrays.asList("onAdPress", "onAdError", "onLoggingImpression");
  }

  @Override
  public String getName() {
    return "CTKBannerView";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
