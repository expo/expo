package abi28_0_0.host.exp.exponent.modules.api.fbads;

import android.view.MotionEvent;

import com.facebook.ads.NativeAd;
import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi28_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import abi28_0_0.com.facebook.react.views.view.ReactViewGroup;

public class NativeAdView extends ReactViewGroup {
    /** @{NativeAd} received from the ads manager **/
    private NativeAd mNativeAd;

    /** @{RCTEventEmitter} instance used for sending events back to JS **/
    private RCTEventEmitter mEventEmitter;

    /** @{float} x coordinate where the touch event started **/
    private float startX;

    /** @{float} y coordinate where the touche event started **/
    private float startY;

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
     * Automatically registers current view for interactions on an ad so that
     * it becomes clickable.
     *
     * @param nativeAd
     */
    public void setNativeAd(NativeAd nativeAd) {
        mNativeAd = nativeAd;

        if (nativeAd == null) {
            mEventEmitter.receiveEvent(getId(), "onAdLoaded", null);
            return;
        }

        NativeAd.Image coverImage = nativeAd.getAdCoverImage();
        NativeAd.Image iconImage = nativeAd.getAdIcon();

        WritableMap event = Arguments.createMap();
        event.putString("title", nativeAd.getAdTitle());
        event.putString("subtitle", nativeAd.getAdSubtitle());
        event.putString("description", nativeAd.getAdBody());
        event.putString("callToActionText", nativeAd.getAdCallToAction());

        // Check as they might be null because of memory issues on low-end devices
        if (coverImage != null) {
            event.putString("coverImage", coverImage.getUrl());
        }

        if (iconImage != null) {
            event.putString("icon", iconImage.getUrl());
        }

        mEventEmitter.receiveEvent(getId(), "onAdLoaded", event);

        mNativeAd.registerViewForInteraction(this);
    }

    /**
     * If touch event is a click, simulate native event so that `FBAds` can
     * trigger its listener
     *
     * @param {MotionEvent} ev
     *
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
                if (deltaX < 200 & deltaY < 200) {
                    performClick();
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
