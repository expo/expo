package com.swmansion.reanimated;

import android.util.Log;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.swmansion.reanimated.layoutReanimation.AnimationsManager;
import com.swmansion.reanimated.layoutReanimation.LayoutAnimations;
import com.swmansion.reanimated.layoutReanimation.NativeMethodsHolder;
import com.swmansion.reanimated.nativeProxy.NativeProxyCommon;

import java.lang.ref.WeakReference;
import java.util.HashMap;

public class NativeProxy extends NativeProxyCommon {
    @DoNotStrip
    @SuppressWarnings("unused")
    private final HybridData mHybridData;

    public NativeProxy(ReactApplicationContext context) {
        super(context);

        CallInvokerHolderImpl holder =
                (CallInvokerHolderImpl) context.getCatalystInstance().getJSCallInvokerHolder();

        FabricUIManager fabricUIManager =
                (FabricUIManager) UIManagerHelper.getUIManager(context, UIManagerType.FABRIC);

        LayoutAnimations LayoutAnimations = new LayoutAnimations(context);

        mHybridData =
                initHybrid(
                        context.getJavaScriptContextHolder().get(),
                        holder,
                        mScheduler,
                        LayoutAnimations,
                        fabricUIManager);
        prepareLayoutAnimations(LayoutAnimations);
        ReanimatedMessageQueueThread messageQueueThread = new ReanimatedMessageQueueThread();
        installJSIBindings(messageQueueThread, fabricUIManager);
    }

    private native HybridData initHybrid(
            long jsContext,
            CallInvokerHolderImpl jsCallInvokerHolder,
            Scheduler scheduler,
            LayoutAnimations LayoutAnimations,
            FabricUIManager fabricUIManager);

    private native void installJSIBindings(
            MessageQueueThread messageQueueThread,
            FabricUIManager fabricUIManager);

    public native boolean isAnyHandlerWaitingForEvent(String eventName);

    public native void performOperations();

    @Override
    protected HybridData getHybridData() {
        return mHybridData;
    }

    public static NativeMethodsHolder createNativeMethodsHolder(LayoutAnimations layoutAnimations) {
        return new NativeMethodsHolder() {
            @Override
            public void startAnimation(int tag, int type, HashMap<String, Object> values) {}

            @Override
            public boolean isLayoutAnimationEnabled() {
                return false;
            }

            @Override
            public int findPrecedingViewTagForTransition(int tag) {
                return -1;
            }

            @Override
            public boolean hasAnimation(int tag, int type) {
                return false;
            }

            @Override
            public void clearAnimationConfig(int tag) {}

            @Override
            public void cancelAnimation(int tag, int type, boolean cancelled, boolean removeView) {}
        };
    }
}
