package expo.modules.ads.facebook;

import android.content.Context;

import com.facebook.ads.NativeAdsManager;

import java.util.Arrays;
import java.util.List;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.ViewManager;
import org.unimodules.core.interfaces.ExpoProp;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;

public class NativeAdViewManager extends ViewManager<NativeAdView> implements ModuleRegistryConsumer {
  private static String NAME = "CTKNativeAd";
  private ModuleRegistry mModuleRegistry;

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public NativeAdView createViewInstance(Context context) {
    return new NativeAdView(context, mModuleRegistry);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.GROUP;
  }

  @ExpoProp(name = "adsManager")
  public void setAdsManager(NativeAdView view, String adsManagerId) {
    NativeAdsManager adsManager = view.getModuleRegistry().getModule(NativeAdManager.class).getFBAdsManager(adsManagerId);
    view.setNativeAd(adsManager.nextNativeAd());
  }

  @Override
  public List<String> getExportedEventNames() {
    return Arrays.asList("onAdLoaded", "onAdFailed");
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
