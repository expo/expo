package abi31_0_0.host.exp.exponent.modules.api.fbads;

import android.graphics.drawable.Icon;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.ads.AdChoicesView;
import com.facebook.ads.AdIconView;
import com.facebook.ads.MediaView;
import com.facebook.ads.NativeAd;
import abi31_0_0.com.facebook.react.bridge.Arguments;
import abi31_0_0.com.facebook.react.bridge.WritableMap;
import abi31_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi31_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import abi31_0_0.com.facebook.react.views.view.ReactViewGroup;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.analytics.EXL;

public class NativeAdView extends ReactViewGroup {
  /**
   * @{NativeAd} received from the ads manager
   **/
  private NativeAd mNativeAd;
  private WeakReference<MediaView> mMediaView;

  /**
   * @{RCTEventEmitter} instance used for sending events back to JS
   **/
  private RCTEventEmitter mEventEmitter;

  /**
   * Creates new NativeAdView instance and retrieves event emitter
   *
   * @param context
   */
  public NativeAdView(ThemedReactContext context) {
    super(context);

    mEventEmitter = context.getJSModule(RCTEventEmitter.class);
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
    event.putString("headline", nativeAd.getAdHeadline());
    event.putString("linkDescription", nativeAd.getAdLinkDescription());
    event.putString("advertiserName", nativeAd.getAdvertiserName());
    event.putString("socialContext", nativeAd.getAdSocialContext());
    event.putString("callToActionText", nativeAd.getAdCallToAction());
    event.putString("bodyText", nativeAd.getAdBodyText());
    // TODO: Remove this deprecated field in SDK 32+
    event.putString("translation", nativeAd.getAdTranslation());
    event.putString("adTranslation", nativeAd.getAdTranslation());
    event.putString("promotedTranslation", nativeAd.getPromotedTranslation());
    event.putString("sponsoredTranslation", nativeAd.getSponsoredTranslation());

    mEventEmitter.receiveEvent(getId(), "onAdLoaded", event);
  }

  public void registerViewsForInteraction(MediaView mediaView, AdIconView adIconView, List<View> clickableViews) {
    clickableViews.add(mediaView);
    mNativeAd.registerViewForInteraction(this, mediaView, adIconView, clickableViews);
    mMediaView = new WeakReference<MediaView>(mediaView);
  }

  public void triggerClick() {
    MediaView tempMediaView = mMediaView.get();
    if (tempMediaView != null) {
      tempMediaView.performClick();
    }
  }
}
