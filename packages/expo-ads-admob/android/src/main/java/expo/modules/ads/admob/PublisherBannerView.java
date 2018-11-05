package expo.modules.ads.admob;

import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;
import android.widget.FrameLayout;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.doubleclick.AppEventListener;
import com.google.android.gms.ads.doubleclick.PublisherAdRequest;
import com.google.android.gms.ads.doubleclick.PublisherAdView;

import expo.core.interfaces.services.EventEmitter;

public class PublisherBannerView extends FrameLayout implements AppEventListener {
  private String testDeviceID = null;

  private EventEmitter mEventEmitter;

  public PublisherBannerView(@NonNull Context context, EventEmitter eventEmitter) {
    super(context);
    mEventEmitter = eventEmitter;
    attachNewAdView();
  }

  @Override
  public void onAppEvent(String name, String info) {
    String message = String.format("Received app event (%s, %s)", name, info);
    Log.d("PublisherAdBanner", message);
    Bundle event = new Bundle();
    event.putString(name, info);
    sendEvent(PublisherBannerViewManager.Events.EVENT_ADMOB_EVENT_RECEIVED, event);
  }

  protected void attachNewAdView() {
    final PublisherAdView adView = new PublisherAdView(getContext());
    adView.setAppEventListener(this);
    // destroy old AdView if present
    PublisherAdView oldAdView = (PublisherAdView) getChildAt(0);
    removeAllViews();
    if (oldAdView != null) {
      oldAdView.destroy();
    }
    addView(adView, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    attachEvents();
  }

  protected void attachEvents() {
    final PublisherAdView adView = (PublisherAdView) getChildAt(0);
    adView.setAdListener(new AdListener() {
      @Override
      public void onAdLoaded() {
        int width = adView.getAdSize().getWidthInPixels(getContext());
        int height = adView.getAdSize().getHeightInPixels(getContext());
        int left = adView.getLeft();
        int top = adView.getTop();
        adView.measure(width, height);
        adView.layout(left, top, left + width, top + height);

        sendEvent(PublisherBannerViewManager.Events.EVENT_RECEIVE_AD);
      }

      @Override
      public void onAdFailedToLoad(int errorCode) {
        sendEvent(
            PublisherBannerViewManager.Events.EVENT_ERROR,
            AdMobUtils.createEventForAdFailedToLoad(errorCode));
      }

      @Override
      public void onAdOpened() {
        sendEvent(PublisherBannerViewManager.Events.EVENT_WILL_PRESENT);
      }

      @Override
      public void onAdClosed() {
        sendEvent(PublisherBannerViewManager.Events.EVENT_WILL_DISMISS);
      }

      @Override
      public void onAdLeftApplication() {
        sendEvent(PublisherBannerViewManager.Events.EVENT_WILL_LEAVE_APP);
      }
    });
  }

  public void setBannerSize(final String sizeString) {
    AdSize adSize = AdMobUtils.getAdSizeFromString(sizeString);
    AdSize[] adSizes = new AdSize[1];
    adSizes[0] = adSize;

    // store old ad unit ID (even if not yet present and thus null)
    PublisherAdView oldAdView = (PublisherAdView) getChildAt(0);
    String adUnitId = oldAdView.getAdUnitId();

    attachNewAdView();
    PublisherAdView newAdView = (PublisherAdView) getChildAt(0);
    newAdView.setAdSizes(adSizes);
    newAdView.setAdUnitId(adUnitId);

    // send measurements to js to style the AdView in react
    sendEvent(
        PublisherBannerViewManager.Events.EVENT_SIZE_CHANGE,
        AdMobUtils.createEventForSizeChange(getContext(), adSize));

    loadAd(newAdView);
  }

  public void setAdUnitID(final String adUnitID) {
    // store old banner size (even if not yet present and thus null)
    PublisherAdView oldAdView = (PublisherAdView) getChildAt(0);
    AdSize[] adSizes = oldAdView.getAdSizes();

    attachNewAdView();
    PublisherAdView newAdView = (PublisherAdView) getChildAt(0);
    newAdView.setAdUnitId(adUnitID);
    newAdView.setAdSizes(adSizes);
    loadAd(newAdView);
  }

  public void setPropTestDeviceID(final String testDeviceID) {
    this.testDeviceID = testDeviceID;
  }

  private void loadAd(final PublisherAdView adView) {
    if (adView.getAdSizes() != null && adView.getAdUnitId() != null) {
      PublisherAdRequest.Builder adRequestBuilder = new PublisherAdRequest.Builder();
      if (testDeviceID != null) {
        if (testDeviceID.equals("EMULATOR")) {
          adRequestBuilder = adRequestBuilder.addTestDevice(PublisherAdRequest.DEVICE_ID_EMULATOR);
        } else {
          adRequestBuilder = adRequestBuilder.addTestDevice(testDeviceID);
        }
      }
      PublisherAdRequest adRequest = adRequestBuilder.build();
      adView.loadAd(adRequest);
    }
  }

  private void sendEvent(PublisherBannerViewManager.Events event) {
    sendEvent(event, new Bundle());
  }

  private void sendEvent(final PublisherBannerViewManager.Events event, final Bundle eventBody) {
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
