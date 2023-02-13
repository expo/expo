package abi48_0_0.com.shopify.reactnative.skia;

import abi48_0_0.com.facebook.react.uimanager.ThemedReactContext;
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