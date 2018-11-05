package abi29_0_0.host.exp.exponent.modules.api.fbads;

import android.content.Context;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.View;

import com.facebook.ads.NativeAdsManager;
import abi29_0_0.com.facebook.react.bridge.ReactContext;
import abi29_0_0.com.facebook.react.common.MapBuilder;
import abi29_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi29_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi29_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class NativeAdViewManager extends ViewGroupManager<NativeAdView> {
  private static String NAME = "CTKNativeAd";

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  protected NativeAdView createViewInstance(ThemedReactContext reactContext) {
    return new NativeAdView(reactContext);
  }

  @ReactProp(name = "adsManager")
  public void setAdsManager(NativeAdView view, String adsManagerId) {
    Context viewContext = view.getContext();
    if (viewContext instanceof ReactContext) {
      ReactContext reactContext = (ReactContext) viewContext;
      NativeAdManager adManager = reactContext.getNativeModule(NativeAdManager.class);
      NativeAdsManager adsManager = adManager.getFBAdsManager(adsManagerId);

      view.setNativeAd(adsManager.nextNativeAd());
    } else {
      Log.e("E_NOT_RCT_CONTEXT", "View's context is not a ReactContext, so it's not possible to get NativeAdManager.");
    }
  }

  @Override
  @Nullable
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>of(
        "onAdLoaded",
        MapBuilder.of("registrationName", "onAdLoaded"),
        "onAdFailed",
        MapBuilder.of("registrationName", "onAdFailed")
    );
  }

  @Override
  public void addView(NativeAdView parent, View child, int index) {
    parent.addView(child, index);
  }

  @Override
  public int getChildCount(NativeAdView parent) {
    return parent.getChildCount();
  }

  @Override
  public View getChildAt(NativeAdView parent, int index) {
    return parent.getChildAt(index);
  }

  @Override
  public void removeViewAt(NativeAdView parent, int index) {
    parent.removeViewAt(index);
  }
}
