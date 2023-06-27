package abi49_0_0.com.shopify.reactnative.skia;

import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext;
import androidx.annotation.NonNull;

public class SkiaPictureViewManager extends SkiaBaseViewManager {

    @NonNull
    @Override
    public String getName() {
        return "SkiaPictureView";
    }

    @NonNull
    @Override
    public SkiaPictureView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new SkiaPictureView(reactContext);
    }
}