package expo.modules.ads.admob;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.Nullable;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.reward.RewardItem;
import com.google.android.gms.ads.reward.RewardedVideoAd;
import com.google.android.gms.ads.reward.RewardedVideoAdListener;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.EventEmitter;

public class AdMobRewardedVideoAdModule extends ExportedModule implements RewardedVideoAdListener,
    ModuleRegistryConsumer {
  private RewardedVideoAd mRewardedVideoAd;
  private String mAdUnitID;
  private String mTestDeviceID;
  private Promise mRequestAdPromise;
  private Promise mShowAdPromise;
  private EventEmitter mEventEmitter;
  private ActivityProvider mActivityProvider;

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
    return "ExpoAdsAdMobRewardedVideoAdManager";
  }

  public AdMobRewardedVideoAdModule(Context context) {
    super(context);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
  }

  @Override
  public void onRewarded(RewardItem rewardItem) {
    Bundle reward = new Bundle();

    reward.putInt("amount", rewardItem.getAmount());
    reward.putString("type", rewardItem.getType());

    sendEvent(Events.DID_REWARD.toString(), reward);
  }

  @Override
  public void onRewardedVideoAdLoaded() {
    sendEvent(Events.DID_LOAD.toString(), new Bundle());
    mRequestAdPromise.resolve(null);
  }

  @Override
  public void onRewardedVideoAdOpened() {
    sendEvent(Events.DID_OPEN.toString(), new Bundle());
  }

  @Override
  public void onRewardedVideoStarted() {
    sendEvent(Events.DID_START.toString(), new Bundle());
  }

  @Override
  public void onRewardedVideoAdClosed() {
    sendEvent(Events.DID_CLOSE.toString(), new Bundle());
  }

  @Override
  public void onRewardedVideoAdLeftApplication() {
    sendEvent(Events.WILL_LEAVE_APPLICATION.toString(), new Bundle());
  }

  @Override
  public void onRewardedVideoCompleted() {
    sendEvent(Events.DID_COMPLETE.toString(), new Bundle());
  }

  @Override
  public void onRewardedVideoAdFailedToLoad(int errorCode) {
    sendEvent(
        Events.DID_FAIL_TO_LOAD.toString(),
        AdMobUtils.createEventForAdFailedToLoad(errorCode));
    mRequestAdPromise.reject(
        "E_AD_REQUEST_FAILED",
        AdMobUtils.errorStringForAdFailedCode(errorCode),
        null);
  }

  private void sendEvent(String eventName, Bundle params) {
    mEventEmitter.emit(eventName, params);
  }

  @ExpoMethod
  public void setAdUnitID(String adUnitID, final Promise promise) {
    mAdUnitID = adUnitID;
    promise.resolve(null);
  }

  @ExpoMethod
  public void setTestDeviceID(String testDeviceID, final Promise promise) {
    mTestDeviceID = testDeviceID;
    promise.resolve(null);
  }

  @ExpoMethod
  public void requestAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run () {
        mRewardedVideoAd = MobileAds.getRewardedVideoAdInstance(
            mActivityProvider.getCurrentActivity());

        mRewardedVideoAd.setRewardedVideoAdListener(AdMobRewardedVideoAdModule.this);

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

  @ExpoMethod
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

  @ExpoMethod
  public void getIsReady(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run () {
        promise.resolve(mRewardedVideoAd != null && mRewardedVideoAd.isLoaded());
      }
    });
  }
}
