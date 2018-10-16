package expo.modules.ads.admob;

import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.view.View;
import android.widget.FrameLayout;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;

import expo.core.interfaces.services.EventEmitter;

public class AdMobBannerView extends FrameLayout {
  private String testDeviceID = null;

  private EventEmitter mEventEmitter;
  private String mSizeString;

  public AdMobBannerView(@NonNull Context context, EventEmitter eventEmitter) {
    super(context);
    this.mEventEmitter = eventEmitter;
    init();
  }

  private void init() {
    attachNewAdView();

    addOnLayoutChangeListener(new OnLayoutChangeListener() {
      public void onLayoutChange(View view, int left, int top, int right, int bottom, int oldLeft, int oldTop, int oldRight, int oldBottom) {
        if (left != oldLeft || right != oldRight || top != oldTop || bottom != oldBottom) {
          setBannerSize(mSizeString);
        }
      }
    });
  }

  protected void attachNewAdView() {
    final AdView adView = new AdView(getContext());

    // destroy old AdView if present
    AdView oldAdView = (AdView) getChildAt(0);
    removeAllViews();
    if (oldAdView != null) {
      oldAdView.destroy();
    }

    addView(adView, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    attachEvents();
  }

  protected void attachEvents() {
    final AdView adView = (AdView) getChildAt(0);
    adView.setAdListener(new AdListener() {
      @Override
      public void onAdLoaded() {
        int width = adView.getAdSize().getWidthInPixels(getContext());
        int height = adView.getAdSize().getHeightInPixels(getContext());
        int left = adView.getLeft();
        int top = adView.getTop();
        adView.measure(width, height);
        adView.layout(left, top, left + width, top + height);

        sendEvent(AdMobBannerViewManager.Events.EVENT_RECEIVE_AD);
      }

      @Override
      public void onAdFailedToLoad(int errorCode) {
        sendEvent(
            AdMobBannerViewManager.Events.EVENT_ERROR,
            AdMobUtils.createEventForAdFailedToLoad(errorCode));
      }

      @Override
      public void onAdOpened() {
        sendEvent(AdMobBannerViewManager.Events.EVENT_WILL_PRESENT);
      }

      @Override
      public void onAdClosed() {
        sendEvent(AdMobBannerViewManager.Events.EVENT_WILL_DISMISS);
      }

      @Override
      public void onAdLeftApplication() {
        sendEvent(AdMobBannerViewManager.Events.EVENT_WILL_LEAVE_APP);
      }
    });
  }

  public void setBannerSize(final String sizeString) {
    mSizeString = sizeString;
    AdSize adSize = AdMobUtils.getAdSizeFromString(sizeString);

    // store old ad unit ID (even if not yet present and thus null)
    AdView oldAdView = (AdView) getChildAt(0);
    String adUnitId = oldAdView.getAdUnitId();

    attachNewAdView();
    AdView newAdView = (AdView) getChildAt(0);
    newAdView.setAdSize(adSize);
    newAdView.setAdUnitId(adUnitId);

    // send measurements to js to style the AdView in react
    sendEvent(
        AdMobBannerViewManager.Events.EVENT_SIZE_CHANGE,
        AdMobUtils.createEventForSizeChange(getContext(), adSize));

    loadAd(newAdView);
  }

  public void setAdUnitID(final String adUnitID) {
    // store old banner size (even if not yet present and thus null)
    AdView oldAdView = (AdView) getChildAt(0);
    AdSize adSize = oldAdView.getAdSize();

    attachNewAdView();
    AdView newAdView = (AdView) getChildAt(0);
    newAdView.setAdUnitId(adUnitID);
    newAdView.setAdSize(adSize);
    loadAd(newAdView);
  }

  public void setPropTestDeviceID(final String testDeviceID) {
    this.testDeviceID = testDeviceID;
  }

  private void loadAd(final AdView adView) {
    if (adView.getAdSize() != null && adView.getAdUnitId() != null) {
      AdRequest.Builder adRequestBuilder = new AdRequest.Builder();
      if (testDeviceID != null){
        if (testDeviceID.equals("EMULATOR")) {
          adRequestBuilder = adRequestBuilder.addTestDevice(AdRequest.DEVICE_ID_EMULATOR);
        } else {
          adRequestBuilder = adRequestBuilder.addTestDevice(testDeviceID);
        }
      }
      AdRequest adRequest = adRequestBuilder.build();
      adView.loadAd(adRequest);
    }
  }

  private void sendEvent(AdMobBannerViewManager.Events event) {
    sendEvent(event, new Bundle());
  }

  private void sendEvent(final AdMobBannerViewManager.Events event, final Bundle eventBody) {
    mEventEmitter.emit(getId(), new EventEmitter.BaseEvent() {
      @Override
      public String getEventName() {
        return event.toString();
      }

      @Override
      public Bundle getEventBody() {
        return eventBody;
      }
    });
  }
}
