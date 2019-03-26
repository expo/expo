package expo.modules.ads.facebook;

import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.ads.AdIconView;
import com.facebook.ads.MediaView;
import com.facebook.ads.NativeAd;
import com.facebook.ads.NativeAdLayout;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.services.EventEmitter;

import java.lang.ref.WeakReference;
import java.util.List;

public class NativeAdView extends ViewGroup {
  /**
   * @{NativeAd} received from the ads manager
   **/
  private NativeAd mNativeAd;
  private WeakReference<MediaView> mMediaView;

  /**
   * @{EventEmitter} instance used for sending events back to JS
   **/
  private EventEmitter mEventEmitter;
  private ModuleRegistry mModuleRegistry;

  /**
   * Creates new NativeAdView instance and retrieves event emitter
   *
   * @param context
   */
  public NativeAdView(Context context, ModuleRegistry moduleRegistry) {
    super(context);
    mModuleRegistry = moduleRegistry;
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
  }

  public ModuleRegistry getModuleRegistry() {
    return mModuleRegistry;
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
      mEventEmitter.emit(getId(), "onAdLoaded", null);
      return;
    }

    Bundle event = new Bundle();
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

    mEventEmitter.emit(getId(), "onAdLoaded", event);
  }

  public NativeAd getNativeAd() {
    return mNativeAd;
  }

  public void registerViewsForInteraction(MediaView mediaView, AdIconView adIconView, List<View> clickableViews) {
    mMediaView = new WeakReference<>(mediaView);

    clickableViews.add(mediaView);
    mNativeAd.registerViewForInteraction(this, mediaView, adIconView, clickableViews);
  }

  public void triggerClick() {
    MediaView tempMediaView = mMediaView.get();
    if (tempMediaView != null) {
      tempMediaView.performClick();
    }
  }

  @Override
  protected void onLayout(boolean b, int i, int i1, int i2, int i3) {
    // do nothing
  }
}
