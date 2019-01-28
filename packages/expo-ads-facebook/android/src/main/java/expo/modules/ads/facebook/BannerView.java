package expo.modules.ads.facebook;

import android.content.Context;
import android.content.res.Resources;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.ViewGroup;

import com.facebook.ads.Ad;
import com.facebook.ads.AdError;
import com.facebook.ads.AdListener;
import com.facebook.ads.AdSize;
import com.facebook.ads.AdView;

import expo.core.ModuleRegistry;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.services.EventEmitter;
import expo.core.interfaces.services.UIManager;


public class BannerView extends ViewGroup implements AdListener, LifecycleEventListener {
  private AdView myAdView;
  private String mPlacementId;
  private AdSize mSize;
  private EventEmitter mEventEmitter;
  private UIManager mUIManager;

  public BannerView(Context context, ModuleRegistry moduleRegistry) {
    super(context);
    mUIManager = moduleRegistry.getModule(UIManager.class);
    mUIManager.registerLifecycleEventListener(this);
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
  }

  public void setPlacementId(String placementId) {
    mPlacementId = placementId;
    createAdViewIfCan();
  }

  public void setSize(AdSize size) {
    mSize = size;
    createAdViewIfCan();
  }

  @Override
  public void onError(Ad ad, AdError adError) {
    Bundle event = new Bundle();

    event.putInt("errorCode", adError.getErrorCode());
    event.putString("errorMessage", adError.getErrorMessage());
    mEventEmitter.emit(getId(), "onAdError", event);

    myAdView = null;
  }

  @Override
  public void onAdLoaded(Ad ad) {
    this.removeAllViews();

    Resources r = getContext().getResources();
    DisplayMetrics dm = r.getDisplayMetrics();
    int pxW = mSize.getWidth() > 0 ?
        dp2px(mSize.getWidth(), dm)
        : r.getDisplayMetrics().widthPixels;
    int pxH = dp2px(mSize.getHeight(), dm);

    myAdView.measure(pxW, pxH);
    myAdView.layout(0, 0, pxW, pxH);

    addView(myAdView);
  }

  @Override
  public void onAdClicked(Ad ad) {
    mEventEmitter.emit(getId(), "onAdPress", null);
  }

  @Override
  public void onLoggingImpression(Ad ad) {
    mEventEmitter.emit(getId(), "onLoggingImpression", null);
  }

  private void createAdViewIfCan() {
    if (myAdView == null && mPlacementId != null && mSize != null) {
      myAdView = new AdView(this.getContext(), mPlacementId, mSize);
      myAdView.setAdListener(this);

      myAdView.loadAd();
    }
  }

  private int dp2px(int dp, DisplayMetrics dm) {
    return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, dm));
  }

  @Override
  public void onHostResume() {

  }

  @Override
  public void onHostPause() {

  }

  @Override
  public void onHostDestroy() {
    if (myAdView != null) {
      myAdView.destroy();
    }
    mUIManager.unregisterLifecycleEventListener(this);
    mUIManager = null;
  }

  @Override
  protected void onLayout(boolean b, int i, int i1, int i2, int i3) {
    // TODO: Platform should handle this for us?
  }
}
