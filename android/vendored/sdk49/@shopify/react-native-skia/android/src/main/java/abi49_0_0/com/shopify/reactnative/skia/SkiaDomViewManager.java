package abi49_0_0.com.shopify.reactnative.skia;

import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext;
import androidx.annotation.NonNull;

public class SkiaDomViewManager extends SkiaBaseViewManager {

    @NonNull
    @Override
    public String getName() {
        return "SkiaDomView";
    }

    @NonNull
    @Override
    public SkiaDomView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new SkiaDomView(reactContext);
    }
}