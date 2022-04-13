package abi44_0_0.expo.modules.ads.admob;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;

import com.google.ads.mediation.admob.AdMobAdapter;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

import abi44_0_0.expo.modules.core.ExportedModule;
import abi44_0_0.expo.modules.core.ModuleRegistry;
import abi44_0_0.expo.modules.core.Promise;
import abi44_0_0.expo.modules.core.arguments.ReadableArguments;
import abi44_0_0.expo.modules.core.interfaces.ActivityProvider;
import abi44_0_0.expo.modules.core.interfaces.ExpoMethod;
import abi44_0_0.expo.modules.core.interfaces.services.EventEmitter;

public class AdMobInterstitialAdModule extends ExportedModule {
  private InterstitialAd mInterstitialAd;
  private String mAdUnitID;
  private Promise mRequestAdPromise;
  private Promise mShowAdPromise;
  private EventEmitter mEventEmitter;
  private ActivityProvider mActivityProvider;

  public enum Events {
    DID_LOAD("interstitialDidLoad"),
    DID_FAIL_TO_LOAD("interstitialDidFailToLoad"),
    DID_OPEN("interstitialDidOpen"),
    DID_CLOSE("interstitialDidClose");

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
    return "ExpoAdsAdMobInterstitialManager";
  }

  public AdMobInterstitialAdModule(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
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
  public void requestAd(final ReadableArguments additionalRequestParams, final Promise promise) {
    new Handler(Looper.getMainLooper()).post(() -> {
      if (mInterstitialAd != null) {
        promise.reject("E_AD_ALREADY_LOADED", "Ad is already loaded.", null);
        return;
      }

      mRequestAdPromise = promise;
      AdRequest adRequest = new AdRequest.Builder()
          .addNetworkExtrasBundle(AdMobAdapter.class, additionalRequestParams.toBundle())
          .build();
      InterstitialAd.load(getContext(), mAdUnitID, adRequest, new InterstitialAdLoadCallback() {
        @Override
        public void onAdLoaded(@NonNull InterstitialAd interstitialAd) {
          mInterstitialAd = interstitialAd;
          mInterstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
              super.onAdFailedToShowFullScreenContent(adError);
            }

            @Override
            public void onAdShowedFullScreenContent() {
              sendEvent(Events.DID_OPEN.toString(), new Bundle());
              if (mShowAdPromise != null) {
                mShowAdPromise.resolve(null);
                mShowAdPromise = null;
              }
            }

            @Override
            public void onAdDismissedFullScreenContent() {
              sendEvent(Events.DID_CLOSE.toString(), new Bundle());
            }
          });

          sendEvent(Events.DID_LOAD.toString(), new Bundle());
          if (mRequestAdPromise != null) {
            mRequestAdPromise.resolve(null);
            mRequestAdPromise = null;
          }
        }

        @Override
        public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
          sendEvent(
              Events.DID_FAIL_TO_LOAD.toString(),
              AdMobUtils.createEventForAdFailedToLoad(loadAdError));
          if (mRequestAdPromise != null) {
            mRequestAdPromise.reject(
                "E_AD_REQUEST_FAILED",
                AdMobUtils.errorStringForAdFailedCode(loadAdError.getCode()),
                null);
            mRequestAdPromise = null;
          }
        }
      });
    });
  }


  @ExpoMethod
  public void showAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(() -> {
      if (mInterstitialAd != null) {
        mShowAdPromise = promise;
        mInterstitialAd.show(mActivityProvider.getCurrentActivity());
      } else {
        promise.reject("E_AD_NOT_READY", "Ad is not ready", null);
      }
    });
  }

  @ExpoMethod
  public void dismissAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(() -> {
      if (mInterstitialAd != null) {
        mShowAdPromise = promise;
        mInterstitialAd = null;
      } else {
        promise.reject("E_AD_NOT_READY", "Ad is not ready", null);
      }
    });
  }

  @ExpoMethod
  public void getIsReady(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(() -> promise.resolve(mInterstitialAd != null));
  }
}
