package expo.modules.ads.admob;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Bundle;
import androidx.annotation.NonNull;
import android.widget.FrameLayout;

import com.google.ads.mediation.admob.AdMobAdapter;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;

import expo.modules.core.interfaces.services.EventEmitter;

@SuppressLint("ViewConstructor")
public class AdMobBannerView extends FrameLayout {

  private final EventEmitter mEventEmitter;
  private Bundle mAdditionalRequestParams;

  public AdMobBannerView(@NonNull Context context, EventEmitter eventEmitter) {
    super(context);
    this.mEventEmitter = eventEmitter;
    attachNewAdView();
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
        sendEvent(
          AdMobBannerViewManager.Events.EVENT_SIZE_CHANGE,
          AdMobUtils.createEventForSizeChange(getContext(), adView.getAdSize()));
        sendEvent(AdMobBannerViewManager.Events.EVENT_RECEIVE_AD);
      }

      @Override
      public void onAdFailedToLoad(@NonNull LoadAdError errorCode) {
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
        sendEvent(AdMobBannerViewManager.Events.EVENT_DID_DISMISS);
      }
    });
  }

  public void setBannerSize(final String sizeString) {
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

  public void setAdditionalRequestParams(final Bundle additionalRequestParams) {
    if (!additionalRequestParams.equals(mAdditionalRequestParams)) {
      mAdditionalRequestParams = additionalRequestParams;
      loadAd((AdView) getChildAt(0));
    }
  }

  private void loadAd(final AdView adView) {
    if (adView.getAdSize() != null && mAdditionalRequestParams != null) {
      AdRequest adRequest = new AdRequest.Builder()
          .addNetworkExtrasBundle(AdMobAdapter.class, mAdditionalRequestParams)
          .build();
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
