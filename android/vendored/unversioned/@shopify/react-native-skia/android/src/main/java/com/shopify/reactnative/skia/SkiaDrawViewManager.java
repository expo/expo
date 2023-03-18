package com.shopify.reactnative.skia;

import com.facebook.react.uimanager.ThemedReactContext;
import androidx.annotation.NonNull;

public class SkiaDrawViewManager extends SkiaBaseViewManager {

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