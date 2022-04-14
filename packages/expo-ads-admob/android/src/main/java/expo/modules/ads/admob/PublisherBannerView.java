package expo.modules.ads.admob;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Bundle;
import androidx.annotation.NonNull;
import android.util.Log;
import android.widget.FrameLayout;

import com.google.ads.mediation.admob.AdMobAdapter;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.admanager.AppEventListener;
import com.google.android.gms.ads.admanager.AdManagerAdRequest;
import com.google.android.gms.ads.admanager.AdManagerAdView;

import expo.modules.core.interfaces.services.EventEmitter;

@SuppressLint("ViewConstructor")
public class PublisherBannerView extends FrameLayout implements AppEventListener {
  private Bundle mAdditionalRequestParams;

  private final EventEmitter mEventEmitter;

  public PublisherBannerView(@NonNull Context context, EventEmitter eventEmitter) {
    super(context);
    mEventEmitter = eventEmitter;
    attachNewAdView();
  }

  @Override
  public void onAppEvent(@NonNull String name, @NonNull String info) {
    String message = String.format("Received app event (%s, %s)", name, info);
    Log.d("PublisherAdBanner", message);
    Bundle event = new Bundle();
    event.putString(name, info);
    sendEvent(PublisherBannerViewManager.Events.EVENT_ADMOB_EVENT_RECEIVED, event);
  }

  protected void attachNewAdView() {
    final AdManagerAdView adView = new AdManagerAdView(getContext());
    adView.setAppEventListener(this);
    // destroy old AdView if present
    AdManagerAdView oldAdView = (AdManagerAdView) getChildAt(0);
    removeAllViews();
    if (oldAdView != null) {
      oldAdView.destroy();
    }
    addView(adView, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    attachEvents();
  }

  protected void attachEvents() {
    final AdManagerAdView adView = (AdManagerAdView) getChildAt(0);
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
          PublisherBannerViewManager.Events.EVENT_SIZE_CHANGE,
          AdMobUtils.createEventForSizeChange(getContext(), adView.getAdSize()));
        sendEvent(PublisherBannerViewManager.Events.EVENT_RECEIVE_AD);
      }

      @Override
      public void onAdFailedToLoad(@NonNull LoadAdError errorCode) {
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
        sendEvent(PublisherBannerViewManager.Events.EVENT_DID_DISMISS);
      }
    });
  }

  public void setBannerSize(final String sizeString) {
    AdSize adSize = AdMobUtils.getAdSizeFromString(sizeString);
    AdSize[] adSizes = new AdSize[1];
    adSizes[0] = adSize;

    // store old ad unit ID (even if not yet present and thus null)
    AdManagerAdView oldAdView = (AdManagerAdView) getChildAt(0);
    String adUnitId = oldAdView.getAdUnitId();

    attachNewAdView();
    AdManagerAdView newAdView = (AdManagerAdView) getChildAt(0);
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
    AdManagerAdView oldAdView = (AdManagerAdView) getChildAt(0);
    AdSize[] adSizes = oldAdView.getAdSizes();

    attachNewAdView();
    AdManagerAdView newAdView = (AdManagerAdView) getChildAt(0);
    newAdView.setAdUnitId(adUnitID);
    newAdView.setAdSizes(adSizes);
    loadAd(newAdView);
  }

  public void setAdditionalRequestParams(Bundle additionalRequestParams) {
    if (!additionalRequestParams.equals(mAdditionalRequestParams)) {
      mAdditionalRequestParams = additionalRequestParams;
      loadAd((AdManagerAdView) getChildAt(0));
    }
  }

  private void loadAd(final AdManagerAdView adView) {
    if (adView.getAdSizes() != null && adView.getAdUnitId() != null && mAdditionalRequestParams != null) {
      AdRequest adRequest = new AdManagerAdRequest.Builder()
          .addNetworkExtrasBundle(AdMobAdapter.class, mAdditionalRequestParams)
          .build();
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
