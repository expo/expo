package abi28_0_0.host.exp.exponent.modules.api.fbads;

import android.content.res.Resources;
import android.util.DisplayMetrics;
import android.util.TypedValue;

import com.facebook.ads.Ad;
import com.facebook.ads.AdError;
import com.facebook.ads.AdListener;
import com.facebook.ads.AdSize;
import com.facebook.ads.AdView;
import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi28_0_0.com.facebook.react.bridge.ReactContext;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi28_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import abi28_0_0.com.facebook.react.views.view.ReactViewGroup;


public class BannerView extends ReactViewGroup implements AdListener, LifecycleEventListener {

  private ReactContext mContext;
  private AdView myAdView;
  private String mPlacementId;
  private AdSize mSize;
  private RCTEventEmitter mEventEmitter;

  public BannerView(ThemedReactContext context) {
    super(context);
    mContext = context;
    mContext.addLifecycleEventListener(this);
    mEventEmitter = mContext.getJSModule(RCTEventEmitter.class);
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
    WritableMap event = Arguments.createMap();

    event.putInt("errorCode", adError.getErrorCode());
    event.putString("errorMessage", adError.getErrorMessage());
    mEventEmitter.receiveEvent(getId(), "onAdError", event);

    myAdView = null;
  }

  @Override
  public void onAdLoaded(Ad ad) {
    this.removeAllViews();

    Resources r = mContext.getResources();
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
    mEventEmitter.receiveEvent(getId(), "onAdPress", null);
  }

  @Override
  public void onLoggingImpression(Ad ad) {
    mEventEmitter.receiveEvent(getId(), "onLoggingImpression", null);
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
  }
}
