package abi25_0_0.host.exp.exponent.modules.api.components.admob;

import android.os.Handler;
import android.os.Looper;
import android.support.annotation.Nullable;

import abi25_0_0.com.facebook.react.bridge.Arguments;
import abi25_0_0.com.facebook.react.bridge.Callback;
import abi25_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi25_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi25_0_0.com.facebook.react.bridge.ReactMethod;
import abi25_0_0.com.facebook.react.bridge.WritableMap;
import abi25_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.reward.RewardedVideoAd;
import com.google.android.gms.ads.reward.RewardedVideoAdListener;
import com.google.android.gms.ads.reward.RewardItem;
import com.google.android.gms.ads.AdRequest;

public class RNAdMobRewardedVideoAdModule extends ReactContextBaseJavaModule implements RewardedVideoAdListener {
    RewardedVideoAd mRewardedVideoAd;
    String adUnitID;
    String testDeviceID;
    Callback requestAdCallback;
    Callback showAdCallback;

    @Override
    public String getName() {
        return "RNAdMobRewarded";
    }

    public RNAdMobRewardedVideoAdModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public void onRewarded(RewardItem rewardItem) {
        WritableMap reward = Arguments.createMap();

        reward.putInt("amount", rewardItem.getAmount());
        reward.putString("type", rewardItem.getType());

        sendEvent("rewardedVideoDidRewardUser", reward);
    }

    @Override
    public void onRewardedVideoAdLoaded() {
        sendEvent("rewardedVideoDidLoad", null);
        requestAdCallback.invoke();
    }

    @Override
    public void onRewardedVideoAdOpened() {
        sendEvent("rewardedVideoDidOpen", null);
    }

    @Override
    public void onRewardedVideoStarted() {
        sendEvent("rewardedVideoDidStart", null);
    }

    @Override
    public void onRewardedVideoAdClosed() {
        sendEvent("rewardedVideoDidClose", null);
    }

    @Override
    public void onRewardedVideoAdLeftApplication() {
        sendEvent("rewardedVideoWillLeaveApplication", null);
    }

    @Override
    public void onRewardedVideoCompleted() {
        sendEvent("rewardedVideoDidComplete", null);
    }

    @Override
    public void onRewardedVideoAdFailedToLoad(int errorCode) {
        WritableMap event = Arguments.createMap();
        String errorString = null;

        switch (errorCode) {
            case AdRequest.ERROR_CODE_INTERNAL_ERROR:
            errorString = "ERROR_CODE_INTERNAL_ERROR";
            break;
            case AdRequest.ERROR_CODE_INVALID_REQUEST:
            errorString = "ERROR_CODE_INVALID_REQUEST";
            break;
            case AdRequest.ERROR_CODE_NETWORK_ERROR:
            errorString = "ERROR_CODE_NETWORK_ERROR";
            break;
            case AdRequest.ERROR_CODE_NO_FILL:
            errorString = "ERROR_CODE_NO_FILL";
            break;
        }

        event.putString("error", errorString);
        sendEvent("rewardedVideoDidFailToLoad", event);
        requestAdCallback.invoke(errorString);
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    }

    @ReactMethod
    public void setAdUnitID(String adUnitID) {
        this.adUnitID = adUnitID;
    }

    @ReactMethod
    public void setTestDeviceID(String testDeviceID) {
        this.testDeviceID = testDeviceID;
    }

    @ReactMethod
    public void requestAd(final Callback callback) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run () {
                RNAdMobRewardedVideoAdModule.this.mRewardedVideoAd = MobileAds.getRewardedVideoAdInstance(getCurrentActivity());

                RNAdMobRewardedVideoAdModule.this.mRewardedVideoAd.setRewardedVideoAdListener(RNAdMobRewardedVideoAdModule.this);

                if (mRewardedVideoAd.isLoaded()) {
                    callback.invoke("Ad is already loaded."); // TODO: make proper error
                } else {
                    requestAdCallback = callback;

                    AdRequest.Builder adRequestBuilder = new AdRequest.Builder();

                    if (testDeviceID != null){
                        if (testDeviceID.equals("EMULATOR")) {
                            adRequestBuilder = adRequestBuilder.addTestDevice(AdRequest.DEVICE_ID_EMULATOR);
                        } else {
                            adRequestBuilder = adRequestBuilder.addTestDevice(testDeviceID);
                        }
                    }

                    AdRequest adRequest = adRequestBuilder.build();
                    mRewardedVideoAd.loadAd(adUnitID, adRequest);
                }
            }
        });
    }

    @ReactMethod
    public void showAd(final Callback callback) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run () {
                if (mRewardedVideoAd.isLoaded()) {
                    showAdCallback = callback;
                    mRewardedVideoAd.show();
                } else {
                    callback.invoke("Ad is not ready."); // TODO: make proper error
                }
            }
        });
    }

    @ReactMethod
    public void isReady(final Callback callback) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run () {
                callback.invoke(mRewardedVideoAd.isLoaded());
            }
        });
    }
}
