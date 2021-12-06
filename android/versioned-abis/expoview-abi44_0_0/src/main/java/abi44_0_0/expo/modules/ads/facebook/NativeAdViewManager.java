package abi44_0_0.expo.modules.ads.facebook;

import android.content.Context;

import com.facebook.ads.NativeAdsManager;

import java.util.Arrays;
import java.util.List;

import abi44_0_0.expo.modules.core.ModuleRegistry;
import abi44_0_0.expo.modules.core.ViewManager;
import abi44_0_0.expo.modules.core.interfaces.ExpoProp;

public class NativeAdViewManager extends ViewManager<NativeAdView> {
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
    return Arrays.asList("onAdLoaded");
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
