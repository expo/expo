package abi15_0_0.host.exp.exponent.modules.api.fbads;

import android.support.annotation.Nullable;
import android.view.View;

import com.facebook.ads.NativeAdsManager;

import java.util.Map;

import abi15_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi15_0_0.com.facebook.react.common.MapBuilder;
import abi15_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi15_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi15_0_0.com.facebook.react.uimanager.annotations.ReactProp;

public class NativeAdViewManager extends ViewGroupManager<NativeAdView> {
    ReactApplicationContext mReactContext;

    public NativeAdViewManager(ReactApplicationContext reactContext) {
        super();
        mReactContext = reactContext;
    }

    @Override
    public String getName() {
        return "CTKNativeAd";
    }

    @Override
    protected NativeAdView createViewInstance(ThemedReactContext reactContext) {
        return new NativeAdView(reactContext);
    }

    @ReactProp(name = "adsManager")
    public void setAdsManager(NativeAdView view, String adsManagerId) {
        NativeAdManager adManager = mReactContext.getNativeModule(NativeAdManager.class);
        NativeAdsManager adsManager = adManager.getFBAdsManager(adsManagerId);

        view.setNativeAd(adsManager.nextNativeAd());
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
