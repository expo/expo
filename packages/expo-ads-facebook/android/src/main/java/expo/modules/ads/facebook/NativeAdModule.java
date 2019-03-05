package expo.modules.ads.facebook;

import android.content.Context;
import android.util.Log;

import java.util.List;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;

public class NativeAdModule extends ExportedModule implements ModuleRegistryConsumer {
  private ModuleRegistry mModuleRegistry;

  public NativeAdModule(Context context) {
    super(context);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
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
