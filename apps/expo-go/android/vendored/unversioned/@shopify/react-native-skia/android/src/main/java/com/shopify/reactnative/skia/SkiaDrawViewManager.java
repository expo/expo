package com.shopify.reactnative.skia;

import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.viewmanagers.SkiaDrawViewManagerDelegate;
import com.facebook.react.viewmanagers.SkiaDrawViewManagerInterface;

import androidx.annotation.NonNull;

public class SkiaDrawViewManager extends SkiaBaseViewManager<SkiaDrawView> implements SkiaDrawViewManagerInterface<SkiaDrawView> {


    protected SkiaDrawViewManagerDelegate mDelegate;

    SkiaDrawViewManager() {
        mDelegate = new SkiaDrawViewManagerDelegate(this);
    }

    protected SkiaDrawViewManagerDelegate getDelegate() {
        return mDelegate;
    }

    @NonNull
    @Override
    public String getName() {
        return "SkiaDrawView";
    }

    @NonNull
    @Override
    public SkiaDrawView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new SkiaDrawView(reactContext);
    }

}