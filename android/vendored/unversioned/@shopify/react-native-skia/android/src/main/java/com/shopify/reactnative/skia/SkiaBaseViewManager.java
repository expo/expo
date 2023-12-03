package com.shopify.reactnative.skia;

import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public abstract class SkiaBaseViewManager<T extends SkiaBaseView> extends ReactViewManager {

    @Override
    public void setNativeId(@NonNull ReactViewGroup view, @Nullable String nativeId) {
        super.setNativeId(view, nativeId);
        int nativeIdResolved = Integer.parseInt(nativeId);
        ((SkiaBaseView)view).registerView(nativeIdResolved);
    }

    @ReactProp(name = "mode")
    public void setMode(T view, String mode) {
        ((SkiaBaseView)view).setMode(mode);
    }

    @ReactProp(name = "debug")
    public void setDebug(T view, boolean show) {
        ((SkiaBaseView)view).setDebugMode(show);
    }

    @Override
    public void onDropViewInstance(@NonNull ReactViewGroup view) {
        super.onDropViewInstance(view);
        ((SkiaBaseView)view).destroySurface();
        ((SkiaBaseView)view).unregisterView();
    }
}