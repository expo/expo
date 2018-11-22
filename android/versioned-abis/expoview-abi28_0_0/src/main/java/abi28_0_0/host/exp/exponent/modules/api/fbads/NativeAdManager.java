package abi28_0_0.host.exp.exponent.modules.api.fbads;

import android.util.Log;

import com.facebook.ads.AdError;
import com.facebook.ads.NativeAdsManager;
import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.UiThreadUtil;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.modules.core.RCTNativeAppEventEmitter;

import java.util.HashMap;
import java.util.Map;

public class NativeAdManager extends ReactContextBaseJavaModule implements NativeAdsManager.Listener {
    /** @{Map} with all registered fb ads managers **/
    private Map<String, NativeAdsManager> mAdsManagers = new HashMap<>();

    public NativeAdManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CTKNativeAdManager";
    }

    /**
     * Initialises native ad manager for a given placement id and ads to request.
     * This method is run on the UI thread
     *
     * @param placementId
     * @param adsToRequest
     */
    @ReactMethod
    public void init(final String placementId, final int adsToRequest) {
        final ReactApplicationContext reactContext = this.getReactApplicationContext();

        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                final NativeAdsManager adsManager = new NativeAdsManager(reactContext, placementId, adsToRequest);

                adsManager.setListener(NativeAdManager.this);

                mAdsManagers.put(placementId, adsManager);

                adsManager.loadAds();
            }
        });
    }

    /**
     * Disables auto refresh
     *
     * @param placementId
     */
    @ReactMethod
    public void disableAutoRefresh(String placementId) {
        mAdsManagers.get(placementId).disableAutoRefresh();
    }

    /**
     * Sets media cache policy
     *
     * @param placementId
     * @param cachePolicy
     */
    @ReactMethod
    public void setMediaCachePolicy(String placementId, String cachePolicy) {
        Log.w("NativeAdManager", "This method is not supported on Android");
    }

    /**
     * Called when one of the registered ads managers loads ads. Sends state of all
     * managers back to JS
     */
    @Override
    public void onAdsLoaded() {
        WritableMap adsManagersState = Arguments.createMap();

        for (String key : mAdsManagers.keySet()) {
            NativeAdsManager adsManager = mAdsManagers.get(key);
            adsManagersState.putBoolean(key, adsManager.isLoaded());
        }

        sendAppEvent("CTKNativeAdsManagersChanged", adsManagersState);
    }

    @Override
    public void onAdError(AdError adError) {
        // @todo handle errors here
    }

    /**
     * Returns FBAdsManager for a given placement id
     *
     * @param placementId
     * @return
     */
    public NativeAdsManager getFBAdsManager(String placementId) {
        return mAdsManagers.get(placementId);
    }

    /**
     * Helper for sending events back to Javascript.
     *
     * @param eventName
     * @param params
     */
    private void sendAppEvent(String eventName, Object params) {
        ReactApplicationContext context = this.getReactApplicationContext();

        if (context == null || !context.hasActiveCatalystInstance()) {
            return;
        }

        context
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit(eventName, params);
    }
}
