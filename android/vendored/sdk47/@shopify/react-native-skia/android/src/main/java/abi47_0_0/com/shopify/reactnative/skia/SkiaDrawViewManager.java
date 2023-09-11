package abi47_0_0.com.shopify.reactnative.skia;

import abi47_0_0.com.facebook.react.uimanager.BaseViewManager;
import abi47_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi47_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi47_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class SkiaDrawViewManager extends BaseViewManager<SkiaDrawView, LayoutShadowNode> {

    @NonNull
    @Override
    public String getName() {
        return "SkiaDrawView";
    }

    @Override
    public LayoutShadowNode createShadowNodeInstance() {
        return new LayoutShadowNode();
    }

    @Override
    public Class<? extends LayoutShadowNode> getShadowNodeClass() {
        return LayoutShadowNode.class;
    }

    @Override
    public void updateExtraData(SkiaDrawView root, Object extraData) {
    }

    @Override
    public void setNativeId(@NonNull SkiaDrawView view, @Nullable String nativeId) {
        super.setNativeId(view, nativeId);
        int nativeIdResolved = Integer.parseInt(nativeId);
        view.registerView(nativeIdResolved);
    }

    @ReactProp(name = "mode")
    public void setMode(SkiaDrawView view, String mode) {
        view.setMode(mode);
    }

    @ReactProp(name = "debug")
    public void setDebug(SkiaDrawView view, boolean show) {
        view.setDebugMode(show);
    }

    @Override
    public void onDropViewInstance(@NonNull SkiaDrawView view) {
        super.onDropViewInstance(view);
        view.unregisterView();
    }

    @NonNull
    @Override
    protected SkiaDrawView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new SkiaDrawView(reactContext);
    }
}