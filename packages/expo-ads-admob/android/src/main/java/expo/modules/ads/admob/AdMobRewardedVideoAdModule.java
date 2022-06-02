package expo.modules.ads.admob;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.google.ads.mediation.admob.AdMobAdapter;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.core.interfaces.ActivityProvider;
import expo.modules.core.interfaces.ExpoMethod;
import expo.modules.core.interfaces.services.EventEmitter;

import androidx.annotation.NonNull;

public class AdMobRewardedVideoAdModule extends ExportedModule {
  private RewardedAd mRewardedAd;
  private String mAdUnitID;
  private Promise mRequestAdPromise;
  private Promise mShowAdPromise;
  private EventEmitter mEventEmitter;
  private ActivityProvider mActivityProvider;

  public enum Event {
    DID_REWARD("rewardedVideoUserDidEarnReward"),
    DID_LOAD("rewardedVideoDidLoad"),
    DID_FAIL_TO_LOAD("rewardedVideoDidFailToLoad"),
    DID_PRESENT("rewardedVideoDidPresent"),
    DID_FAIL_TO_PRESENT("rewardedVideoDidFailToPresent"),
    DID_DISMISS("rewardedVideoDidDismiss");

    private final String mName;

    Event(final String name) {
      mName = name;
    }

    @Override
    public @NonNull
    String toString() {
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
  public void onCreate(ModuleRegistry moduleRegistry) {
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
  }

  private void sendEvent(Event event) {
    this.sendEvent(event, new Bundle());
  }

  private void sendEvent(Event event, Bundle params) {
    mEventEmitter.emit(event.toString(), params);
  }

  @ExpoMethod
  public void setAdUnitID(String adUnitID, final Promise promise) {
    mAdUnitID = adUnitID;
    promise.resolve(null);
  }

  @ExpoMethod
  public void requestAd(final ReadableArguments additionalRequestParams, final Promise promise) {
    new Handler(Looper.getMainLooper()).post(() -> {
      if (mRewardedAd != null) {
        promise.reject("E_AD_ALREADY_LOADED", "Ad is already loaded.", null);
        return;
      }

      mRequestAdPromise = promise;

      AdRequest adRequest = new AdRequest.Builder()
          .addNetworkExtrasBundle(AdMobAdapter.class, additionalRequestParams.toBundle())
          .build();

      RewardedAd.load(mActivityProvider.getCurrentActivity(), mAdUnitID, adRequest, new RewardedAdLoadCallback() {
        @Override
        public void onAdLoaded(@NonNull RewardedAd rewardedAd) {
          mRewardedAd = rewardedAd;

          mRewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
              sendEvent(Event.DID_FAIL_TO_LOAD, AdMobUtils.createEventForAdFailedToLoad(adError));
              mShowAdPromise.reject("E_AD_SHOW_FAILED", adError.getMessage());
              mRewardedAd = null;
              mShowAdPromise = null;
            }

            @Override
            public void onAdShowedFullScreenContent() {
              sendEvent(Event.DID_PRESENT);
              mShowAdPromise.resolve(null);
              mShowAdPromise = null;
            }

            @Override
            public void onAdDismissedFullScreenContent() {
              sendEvent(Event.DID_DISMISS);
              mRewardedAd = null;
            }
          });

          sendEvent(Event.DID_LOAD);
          mRequestAdPromise.resolve(null);
          mRequestAdPromise = null;
        }

        @Override
        public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
          sendEvent(Event.DID_FAIL_TO_LOAD, AdMobUtils.createEventForAdFailedToLoad(loadAdError));
          mRewardedAd = null;
          mRequestAdPromise.reject("E_AD_REQUEST_FAILED", loadAdError.getMessage());
          mRequestAdPromise = null;
        }
      });
    });
  }

  @ExpoMethod
  public void showAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(() -> {
      if (mRewardedAd == null) {
        promise.reject("E_AD_NOT_READY", "Ad is not ready.", null);
        return;
      }

      mShowAdPromise = promise;
      mRewardedAd.show(mActivityProvider.getCurrentActivity(), rewardItem -> {
        Bundle reward = new Bundle();
        reward.putInt("amount", rewardItem.getAmount());
        reward.putString("type", rewardItem.getType());
        sendEvent(Event.DID_REWARD, reward);
      });
    });
  }

  @ExpoMethod
  public void getIsReady(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(() -> promise.resolve(mRewardedAd != null));
  }
}
