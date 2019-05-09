package expo.modules.ads.admob;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.InterstitialAd;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.EventEmitter;

public class AdMobInterstitialAdModule extends ExportedModule implements ModuleRegistryConsumer {
  private InterstitialAd mInterstitialAd;
  private String mTestDeviceID;
  private String mAdUnitID;
  private Promise mRequestAdPromise;
  private Promise mShowAdPromise;
  private EventEmitter mEventEmitter;
  private ActivityProvider mActivityProvider;

  public enum Events {
    DID_LOAD("interstitialDidLoad"),
    DID_FAIL_TO_LOAD("interstitialDidFailToLoad"),
    DID_OPEN("interstitialDidOpen"),
    DID_CLOSE("interstitialDidClose"),
    WILL_LEAVE_APPLICATION("interstitialWillLeaveApplication");

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
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
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
  public void setTestDeviceID(String testDeviceID, final Promise promise) {
    mTestDeviceID = testDeviceID;
    promise.resolve(null);
  }

  @ExpoMethod
  public void requestAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        recreateInterstitialAdWithAdUnitID(mAdUnitID);
        if (mInterstitialAd.isLoaded() || mInterstitialAd.isLoading()) {
          promise.reject("E_AD_ALREADY_LOADED", "Ad is already loaded.", null);
        } else {
          mRequestAdPromise = promise;
          AdRequest.Builder adRequestBuilder = new AdRequest.Builder();
          if (mTestDeviceID != null) {
            if (mTestDeviceID.equals("EMULATOR")) {
              adRequestBuilder = adRequestBuilder.addTestDevice(AdRequest.DEVICE_ID_EMULATOR);
            } else {
              adRequestBuilder = adRequestBuilder.addTestDevice(mTestDeviceID);
            }
          }
          AdRequest adRequest = adRequestBuilder.build();
          mInterstitialAd.loadAd(adRequest);
        }
      }
    });
  }

  @ExpoMethod
  public void showAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        if (mInterstitialAd != null && mInterstitialAd.isLoaded()) {
          mShowAdPromise = promise;
          mInterstitialAd.show();
        } else {
          promise.reject("E_AD_NOT_READY", "Ad is not ready", null);
        }
      }
    });
  }

  @ExpoMethod
  public void dismissAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        if (mInterstitialAd != null && mInterstitialAd.isLoaded()) {
          mShowAdPromise = promise;

          recreateInterstitialAdWithAdUnitID(mAdUnitID);
        } else {
          promise.reject("E_AD_NOT_READY", "Ad is not ready", null);
        }
      }
    });
  }

  @ExpoMethod
  public void getIsReady(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        promise.resolve(mInterstitialAd != null && mInterstitialAd.isLoaded());
      }
    });
  }

  private void recreateInterstitialAdWithAdUnitID(String adUnitID) {
    if (mInterstitialAd != null) {
      mInterstitialAd = null;
    }

    mInterstitialAd = new InterstitialAd(mActivityProvider.getCurrentActivity());
    mInterstitialAd.setAdUnitId(adUnitID);

    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        mInterstitialAd.setAdListener(new AdListener() {
          @Override
          public void onAdClosed() {
            sendEvent(Events.DID_CLOSE.toString(), new Bundle());
          }

          @Override
          public void onAdFailedToLoad(int errorCode) {
            sendEvent(
                Events.DID_FAIL_TO_LOAD.toString(),
                AdMobUtils.createEventForAdFailedToLoad(errorCode));
            if (mRequestAdPromise != null) {
              mRequestAdPromise.reject(
                  "E_AD_REQUEST_FAILED",
                  AdMobUtils.errorStringForAdFailedCode(errorCode),
                  null);
              mRequestAdPromise = null;
            }
          }

          @Override
          public void onAdLeftApplication() {
            sendEvent(Events.WILL_LEAVE_APPLICATION.toString(), new Bundle());
          }

          @Override
          public void onAdLoaded() {
            sendEvent(Events.DID_LOAD.toString(), new Bundle());
            if (mRequestAdPromise != null) {
              mRequestAdPromise.resolve(null);
              mRequestAdPromise = null;
            }
          }

          @Override
          public void onAdOpened() {
            sendEvent(Events.DID_OPEN.toString(), new Bundle());
            if (mShowAdPromise != null) {
              mShowAdPromise.resolve(null);
              mShowAdPromise = null;
            }
          }
        });
      }
    });
  }
}
