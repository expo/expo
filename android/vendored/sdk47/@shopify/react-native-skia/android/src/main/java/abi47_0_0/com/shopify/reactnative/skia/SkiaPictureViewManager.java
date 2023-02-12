package abi47_0_0.com.shopify.reactnative.skia;

import abi47_0_0.com.facebook.react.bridge.ReactContext;
import abi47_0_0.com.facebook.react.uimanager.BaseViewManager;
import abi47_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi47_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi47_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.HashMap;

public class SkiaPictureViewManager extends BaseViewManager<SkiaPictureView, LayoutShadowNode> {

    @NonNull
    @Override
    public String getName() {
        return "SkiaPictureView";
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
    public void updateExtraData(SkiaPictureView root, Object extraData) {
    }

    @Override
    public void setNativeId(@NonNull SkiaPictureView view, @Nullable String nativeId) {
        super.setNativeId(view, nativeId);
        int nativeIdResolved = Integer.parseInt(nativeId);
        view.registerView(nativeIdResolved);
    }

    @ReactProp(name = "mode")
    public void setMode(SkiaPictureView view, String mode) {
        view.setMode(mode);
    }

    @ReactProp(name = "debug")
    public void setDebug(SkiaPictureView view, boolean show) {
        view.setDebugMode(show);
    }

    @Override
    public void onDropViewInstance(@NonNull SkiaPictureView view) {
        super.onDropViewInstance(view);
        view.unregisterView();
    }

    @NonNull
    @Override
    protected SkiaPictureView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new SkiaPictureView(reactContext);
    }
}