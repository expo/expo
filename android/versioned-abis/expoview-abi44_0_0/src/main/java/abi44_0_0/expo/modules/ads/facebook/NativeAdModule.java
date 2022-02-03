package abi44_0_0.expo.modules.ads.facebook;

import android.content.Context;
import android.util.Log;

import java.util.List;

import abi44_0_0.expo.modules.core.ExportedModule;
import abi44_0_0.expo.modules.core.ModuleRegistry;
import abi44_0_0.expo.modules.core.Promise;
import abi44_0_0.expo.modules.core.interfaces.ExpoMethod;

public class NativeAdModule extends ExportedModule {
  private ModuleRegistry mModuleRegistry;

  public NativeAdModule(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }


  @Override
  public String getName() {
    return "CTKNativeAdManager";
  }

  @ExpoMethod
  public void init(final String placementId, final int adsToRequest, final Promise promise) {
    mModuleRegistry.getModule(NativeAdManager.class).init(placementId, adsToRequest, promise);
  }

  @ExpoMethod
  public void disableAutoRefresh(String placementId, Promise promise) {
    mModuleRegistry.getModule(NativeAdManager.class).disableAutoRefresh(placementId, promise);
  }

  @ExpoMethod
  public void setMediaCachePolicy(String placementId, String cachePolicy, Promise promise) {
    Log.w("NativeAdManager", "This method is not supported on Android");
    promise.resolve(null);
  }

  @ExpoMethod
  public void triggerEvent(final int nativeAdView, final Promise promise) {
    mModuleRegistry.getModule(NativeAdManager.class).triggerEvent(nativeAdView, promise);
  }

  @ExpoMethod
  public void registerViewsForInteraction(final int adTag,
                                          final int mediaViewTag,
                                          final int adIconViewTag,
                                          final List<Object> clickableViewsTags,
                                          final Promise promise) {
    mModuleRegistry.getModule(NativeAdManager.class).registerViewsForInteraction(adTag, mediaViewTag, adIconViewTag, clickableViewsTags, promise);
  }
}
