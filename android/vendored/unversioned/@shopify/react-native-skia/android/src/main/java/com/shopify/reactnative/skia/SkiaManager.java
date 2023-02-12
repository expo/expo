package com.shopify.reactnative.skia;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;

@DoNotStrip
public class SkiaManager {

    @DoNotStrip
    private HybridData mHybridData;

    @DoNotStrip
    private ReactContext mContext;

    @DoNotStrip
    private PlatformContext mPlatformContext;

    @DoNotStrip
    SkiaManager(ReactContext context) {
        super();
        mContext = context;

        CallInvokerHolderImpl holder = (CallInvokerHolderImpl) context.getCatalystInstance().getJSCallInvokerHolder();

        mPlatformContext = new PlatformContext(context);

        mHybridData = initHybrid(context.getJavaScriptContextHolder().get(), holder, mPlatformContext);

        initializeRuntime();
    }

    public void destroy() {
        mHybridData.resetNative();
    }

    public float getPixelDensity() {
        return mContext.getResources().getDisplayMetrics().density;
    }

    public PlatformContext getPlatformContext() {
        return mPlatformContext;
    }

    public void onHostResume() { mPlatformContext.onResume(); }

    public void onHostPause() {  mPlatformContext.onPause(); }

    // private C++ functions
    private native HybridData initHybrid(long jsContext, CallInvokerHolderImpl jsCallInvokerHolder,
            PlatformContext platformContext);

    private native void initializeRuntime();
    public native void invalidate();

}