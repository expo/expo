package abi49_0_0.com.shopify.reactnative.skia;

import abi49_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi49_0_0.com.facebook.react.views.view.ReactViewGroup;
import abi49_0_0.com.facebook.react.views.view.ReactViewManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public abstract class SkiaBaseViewManager extends ReactViewManager {

    @Override
    public void setNativeId(@NonNull ReactViewGroup view, @Nullable String nativeId) {
        super.setNativeId(view, nativeId);
        int nativeIdResolved = Integer.parseInt(nativeId);
        ((SkiaBaseView)view).registerView(nativeIdResolved);
    }

    @ReactProp(name = "mode")
    public void setMode(ReactViewGroup view, String mode) {
        ((SkiaBaseView)view).setMode(mode);
    }

    @ReactProp(name = "debug")
    public void setDebug(ReactViewGroup view, boolean show) {
        ((SkiaBaseView)view).setDebugMode(show);
    }

    @Override
    public void onDropViewInstance(@NonNull ReactViewGroup view) {
        super.onDropViewInstance(view);
        ((SkiaBaseView)view).unregisterView();
    }
}