package abi27_0_0.host.exp.exponent.modules.api.fbads;

import android.view.MotionEvent;
import android.view.View;

import com.facebook.ads.MediaView;
import com.facebook.ads.NativeAd;

import java.util.Arrays;
import java.util.List;

import abi27_0_0.com.facebook.react.bridge.Arguments;
import abi27_0_0.com.facebook.react.bridge.WritableMap;
import abi27_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi27_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import abi27_0_0.com.facebook.react.views.view.ReactViewGroup;
import host.exp.exponent.fbads.FacebookAdDataExtractor;

public class NativeAdView extends ReactViewGroup {
  /**
   * @{NativeAd} received from the ads manager
   **/
  private NativeAd mNativeAd;

  private MediaView mMediaView;

  private List<View> mTriggerableViews;

  /**
   * @{RCTEventEmitter} instance used for sending events back to JS
   **/
  private RCTEventEmitter mEventEmitter;

  /**
   * @{float} x coordinate where the touch event started
   **/
  private float startX;

  /**
   * @{float} y coordinate where the touche event started
   **/
  private float startY;

  /**
   * Creates new NativeAdView instance and retrieves event emitter
   *
   * @param context
   */
  public NativeAdView(ThemedReactContext context) {
    super(context);
    mEventEmitter = context.getJSModule(RCTEventEmitter.class);

    mMediaView = new MediaView(context);
    addView(mMediaView);

    mTriggerableViews = Arrays.<View>asList(this, mMediaView);
  }

  /**
   * Called by the view manager when adsManager prop is set. Sends serialised
   * version of a native ad back to Javascript.
   *
   * @param nativeAd
   */
  public void setNativeAd(NativeAd nativeAd) {
    if (mNativeAd != null) {
      mNativeAd.unregisterView();
    }

    mNativeAd = nativeAd;

    if (nativeAd == null) {
      mEventEmitter.receiveEvent(getId(), "onAdLoaded", null);
      return;
    }

    WritableMap event = Arguments.createMap();
    event.putString("title", FacebookAdDataExtractor.getTitle(nativeAd));
    event.putString("subtitle", nativeAd.getAdHeadline());
    event.putString("description", nativeAd.getAdBodyText());
    event.putString("callToActionText", nativeAd.getAdCallToAction());

    NativeAd.Image coverImage = nativeAd.getAdCoverImage();
    NativeAd.Image iconImage = nativeAd.getAdIcon();

    // Check as they might be null because of memory issues on low-end devices
    if (coverImage != null) {
      event.putString("coverImage", FacebookAdDataExtractor.getUrl(coverImage));
    }

    if (iconImage != null) {
      event.putString("icon", FacebookAdDataExtractor.getUrl(iconImage));
    }

    mEventEmitter.receiveEvent(getId(), "onAdLoaded", event);
    mNativeAd.registerViewForInteraction(this, mMediaView, null, mTriggerableViews);
  }

  /**
   * If touch event is a click, simulate native event so that `FBAds` can
   * trigger its listener
   *
   * @param {MotionEvent} ev
   * @return
   */
  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    switch (ev.getActionMasked()) {
      case MotionEvent.ACTION_DOWN:
        startX = ev.getX();
        startY = ev.getY();
        break;
      case MotionEvent.ACTION_UP:
        float deltaX = Math.abs(startX - ev.getX());
        float deltaY = Math.abs(startY - ev.getY());
        if (deltaX < 200 && deltaY < 200) {
          mMediaView.performClick();
        }
        break;
    }
    return true;
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    return true;
  }
}
