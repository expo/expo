package abi27_0_0.host.exp.exponent.modules.api.components.admob;

import android.os.Handler;
import android.os.Looper;
import android.support.annotation.Nullable;

import abi27_0_0.com.facebook.react.bridge.Arguments;
import abi27_0_0.com.facebook.react.bridge.Callback;
import abi27_0_0.com.facebook.react.bridge.Promise;
import abi27_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi27_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi27_0_0.com.facebook.react.bridge.ReactMethod;
import abi27_0_0.com.facebook.react.bridge.WritableMap;
import abi27_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.reward.RewardedVideoAd;
import com.google.android.gms.ads.reward.RewardedVideoAdListener;
import com.google.android.gms.ads.reward.RewardItem;
import com.google.android.gms.ads.AdRequest;

public class RNAdMobRewardedVideoAdModule extends ReactContextBaseJavaModule implements RewardedVideoAdListener {
  private RewardedVideoAd mRewardedVideoAd;
  private String mAdUnitID;
  private String mTestDeviceID;
  private Promise mRequestAdPromise;
  private Promise mShowAdPromise;

  public enum Events {
    DID_REWARD("rewardedVideoDidRewardUser"),
    DID_LOAD("rewardedVideoDidLoad"),
    DID_FAIL_TO_LOAD("rewardedVideoDidFailToLoad"),
    DID_OPEN("rewardedVideoDidOpen"),
    DID_START("rewardedVideoDidStart"),
    DID_COMPLETE("rewardedVideoDidComplete"),
    DID_CLOSE("rewardedVideoDidClose"),
    WILL_LEAVE_APPLICATION("rewardedVideoWillLeaveApplication");

    private final String mName;

    Events(final String name) {
      mName = name;
    }

    @Override
    public String toString() {
      return mName;
    }
  }

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

    sendEvent(Events.DID_REWARD.toString(), reward);
  }

  @Override
  public void onRewardedVideoAdLoaded() {
    sendEvent(Events.DID_LOAD.toString(), null);
    mRequestAdPromise.resolve(null);
  }

  @Override
  public void onRewardedVideoAdOpened() {
    sendEvent(Events.DID_OPEN.toString(), null);
  }

  @Override
  public void onRewardedVideoStarted() {
    sendEvent(Events.DID_START.toString(), null);
  }

  @Override
  public void onRewardedVideoAdClosed() {
    sendEvent(Events.DID_CLOSE.toString(), null);
  }

  @Override
  public void onRewardedVideoAdLeftApplication() {
    sendEvent(Events.WILL_LEAVE_APPLICATION.toString(), null);
  }

  @Override
  public void onRewardedVideoCompleted() {
    sendEvent(Events.DID_COMPLETE.toString(), null);
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
    sendEvent(Events.DID_FAIL_TO_LOAD.toString(), event);
    mRequestAdPromise.reject("E_AD_REQUEST_FAILED", errorString, null);
  }

  private void sendEvent(String eventName, @Nullable WritableMap params) {
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
  }

  @ReactMethod
  public void setAdUnitID(String adUnitID) {
    mAdUnitID = adUnitID;
  }

  @ReactMethod
  public void setTestDeviceID(String testDeviceID) {
    mTestDeviceID = testDeviceID;
  }

  @ReactMethod
  public void requestAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run () {
        mRewardedVideoAd = MobileAds.getRewardedVideoAdInstance(getCurrentActivity());

        mRewardedVideoAd.setRewardedVideoAdListener(RNAdMobRewardedVideoAdModule.this);

        if (mRewardedVideoAd.isLoaded()) {
          promise.reject("E_AD_ALREADY_LOADED", "Ad is already loaded.", null);
        } else {
          mRequestAdPromise = promise;

          AdRequest.Builder adRequestBuilder = new AdRequest.Builder();

          if (mTestDeviceID != null){
            if (mTestDeviceID.equals("EMULATOR")) {
              adRequestBuilder = adRequestBuilder.addTestDevice(AdRequest.DEVICE_ID_EMULATOR);
            } else {
              adRequestBuilder = adRequestBuilder.addTestDevice(mTestDeviceID);
            }
          }

          AdRequest adRequest = adRequestBuilder.build();
          mRewardedVideoAd.loadAd(mAdUnitID, adRequest);
        }
      }
    });
  }

  @ReactMethod
  public void showAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run () {
        if (mRewardedVideoAd != null && mRewardedVideoAd.isLoaded()) {
          mShowAdPromise = promise;
          mRewardedVideoAd.show();
        } else {
          promise.reject("E_AD_NOT_READY", "Ad is not ready.", null);
        }
      }
    });
  }

  @ReactMethod
  public void getIsReady(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run () {
        promise.resolve(mRewardedVideoAd != null && mRewardedVideoAd.isLoaded());
      }
    });
  }
}
