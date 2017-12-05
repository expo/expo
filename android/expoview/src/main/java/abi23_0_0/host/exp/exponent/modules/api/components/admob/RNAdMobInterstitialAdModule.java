package abi23_0_0.host.exp.exponent.modules.api.components.admob;

import android.os.Handler;
import android.os.Looper;
import android.support.annotation.Nullable;

import abi23_0_0.com.facebook.react.bridge.Arguments;
import abi23_0_0.com.facebook.react.bridge.Callback;
import abi23_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi23_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi23_0_0.com.facebook.react.bridge.ReactMethod;
import abi23_0_0.com.facebook.react.bridge.WritableMap;
import abi23_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.InterstitialAd;

public class RNAdMobInterstitialAdModule extends ReactContextBaseJavaModule {
  InterstitialAd mInterstitialAd;
  String adUnitID;
  String testDeviceID;
  Callback requestAdCallback;
  Callback showAdCallback;

  @Override
  public String getName() {
    return "RNAdMobInterstitial";
  }

  public RNAdMobInterstitialAdModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mInterstitialAd = new InterstitialAd(reactContext);

    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        mInterstitialAd.setAdListener(new AdListener() {
          @Override
          public void onAdClosed() {
            sendEvent("interstitialDidClose", null);
            showAdCallback.invoke();
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
            sendEvent("interstitialDidFailToLoad", event);
            requestAdCallback.invoke(errorString);
          }
          @Override
          public void onAdLeftApplication() {
            sendEvent("interstitialWillLeaveApplication", null);
          }
          @Override
          public void onAdLoaded() {
            sendEvent("interstitialDidLoad", null);
            requestAdCallback.invoke();
          }
          @Override
          public void onAdOpened() {
            sendEvent("interstitialDidOpen", null);
          }
        });
      }
    });
  }
  private void sendEvent(String eventName, @Nullable WritableMap params) {
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
  }

  @ReactMethod
  public void setAdUnitID(String adUnitID) {
    mInterstitialAd.setAdUnitId(adUnitID);
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
        if (mInterstitialAd.isLoaded() || mInterstitialAd.isLoading()) {
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
          mInterstitialAd.loadAd(adRequest);
        }
      }
    });
  }

  @ReactMethod
  public void showAd(final Callback callback) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run () {
        if (mInterstitialAd.isLoaded()) {
          showAdCallback = callback;
          mInterstitialAd.show();
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
        callback.invoke(mInterstitialAd.isLoaded());
      }
    });
  }
}
