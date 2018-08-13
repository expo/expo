package abi29_0_0.host.exp.exponent.modules.api.components.admob;

import android.os.Handler;
import android.os.Looper;
import android.support.annotation.Nullable;

import abi29_0_0.com.facebook.react.bridge.Arguments;
import abi29_0_0.com.facebook.react.bridge.Promise;
import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi29_0_0.com.facebook.react.bridge.ReactMethod;
import abi29_0_0.com.facebook.react.bridge.WritableMap;
import abi29_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.InterstitialAd;

public class RNAdMobInterstitialAdModule extends ReactContextBaseJavaModule {
  private InterstitialAd mInterstitialAd;
  private String mTestDeviceID;
  private String mAdUnitID;
  private Promise mRequestAdPromise;
  private Promise mShowAdPromise;

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
    return "RNAdMobInterstitial";
  }

  public RNAdMobInterstitialAdModule(ReactApplicationContext reactContext) {
    super(reactContext);
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

  @ReactMethod
  public void showAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run () {
        if (mInterstitialAd != null && mInterstitialAd.isLoaded()) {
          mShowAdPromise = promise;
          mInterstitialAd.show();
        } else {
          promise.reject("E_AD_NOT_READY", "Ad is not ready", null);
        }
      }
    });
  }

  @ReactMethod
  public void dismissAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run () {
        if (mInterstitialAd != null && mInterstitialAd.isLoaded()) {
          mShowAdPromise = promise;

          recreateInterstitialAdWithAdUnitID(mAdUnitID);
        } else {
          promise.reject("E_AD_NOT_READY", "Ad is not ready", null);
        }
      }
    });
  }

  @ReactMethod
  public void getIsReady(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run () {
        promise.resolve(mInterstitialAd != null && mInterstitialAd.isLoaded());
      }
    });
  }

  private void recreateInterstitialAdWithAdUnitID(String adUnitID) {
    if (mInterstitialAd != null) {
      mInterstitialAd = null;
    }

    mInterstitialAd = new InterstitialAd(getReactApplicationContext());
    mInterstitialAd.setAdUnitId(adUnitID);

    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        mInterstitialAd.setAdListener(new AdListener() {
          @Override
          public void onAdClosed() {
            sendEvent(Events.DID_CLOSE.toString(), null);
          }

          @Override
          public void onAdFailedToLoad(int errorCode) {
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
            if (mRequestAdPromise != null) {
              mRequestAdPromise.reject("E_AD_REQUEST_FAILED", errorString, null);
              mRequestAdPromise = null;
            }
          }

          @Override
          public void onAdLeftApplication() {
            sendEvent(Events.WILL_LEAVE_APPLICATION.toString(), null);
          }

          @Override
          public void onAdLoaded() {
            sendEvent(Events.DID_LOAD.toString(), null);
            if (mRequestAdPromise != null) {
              mRequestAdPromise.resolve(null);
              mRequestAdPromise = null;
            }
          }

          @Override
          public void onAdOpened() {
            sendEvent(Events.DID_OPEN.toString(), null);
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
