package expo.modules.ads.facebook;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Bundle;
import android.widget.LinearLayout;

import com.facebook.ads.Ad;
import com.facebook.ads.AdError;
import com.facebook.ads.AdListener;
import com.facebook.ads.AdSize;
import com.facebook.ads.AdView;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.core.interfaces.services.EventEmitter;
import org.unimodules.core.interfaces.services.UIManager;

@SuppressLint("ViewConstructor")
public class BannerView extends LinearLayout implements AdListener, LifecycleEventListener {
  private AdView myAdView;
  private String mPlacementId;
  private AdSize mSize;
  private EventEmitter mEventEmitter;
  private UIManager mUIManager;

  private final Runnable mLayoutRunnable = new Runnable() {
    @Override
    public void run() {
      measure(
          MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
      layout(getLeft(), getTop(), getRight(), getBottom());
    }
  };

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
    // do nothing
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
      removeAllViews();
      addView(myAdView);
      myAdView.loadAd();
    }
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
  public void requestLayout() {
    super.requestLayout();

    // Code borrowed from:
    // https://github.com/facebook/react-native/blob/d19afc73f5048f81656d0b4424232ce6d69a6368/ReactAndroid/src/main/java/com/facebook/react/views/toolbar/ReactToolbar.java#L166
    // Thanks to it, the ad is visible when it loads and isn't laid out with (0, 0, 0, 0).
    post(mLayoutRunnable);
  }
}
