package com.wix.detox.espresso;

import android.support.annotation.NonNull;
import android.support.test.espresso.IdlingResource;
import android.util.Log;
import android.view.Choreographer;

import org.joor.Reflect;
import org.joor.ReflectException;

/**
 * Created by simonracz on 26/07/2017.
 */

/**
 * <p>
 * Espresso IdlingResource for React Native's UI Module.
 * </p>
 *
 * <p>
 * Hooks up to React Native internals to grab the pending ui operations from it.
 * </p>
 */
public class ReactNativeUIModuleIdlingResource implements IdlingResource, Choreographer.FrameCallback {
    private static final String LOG_TAG = "Detox";

    private final static String CLASS_UI_MANAGER_MODULE = "com.facebook.react.uimanager.UIManagerModule";
    private final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    private final static String METHOD_HAS_NATIVE_MODULE = "hasNativeModule";
    private final static String METHOD_GET_UI_IMPLEMENTATION = "getUIImplementation";
    private final static String METHOD_GET_UI_OPERATION_QUEUE = "getUIViewOperationQueue";
    private final static String METHOD_IS_EMPTY = "isEmpty";
    private final static String FIELD_DISPATCH_RUNNABLES = "mDispatchUIRunnables";
    private final static String FIELD_NON_BATCHES_OPERATIONS = "mNonBatchedOperations";
    private final static String FIELD_CATALYST_INSTANCE = "mCatalystInstance";
    private final static String LOCK_RUNNABLES = "mDispatchRunnablesLock";
    private final static String LOCK_OPERATIONS = "mNonBatchedOperationsLock";

    private ResourceCallback callback = null;
    private Object reactContext = null;

    public ReactNativeUIModuleIdlingResource(@NonNull Object reactContext) {
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return ReactNativeUIModuleIdlingResource.class.getName();
    }

    @Override
    public boolean isIdleNow() {
        Class<?> uiModuleClass = null;
        try {
            uiModuleClass = Class.forName(CLASS_UI_MANAGER_MODULE);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "UIManagerModule is not on classpath.");
            if (callback != null) {
                callback.onTransitionToIdle();
            }
            return true;
        }

        try {
            // reactContext.hasActiveCatalystInstance() should be always true here
            // if called right after onReactContextInitialized(...)
            if (Reflect.on(reactContext).field(FIELD_CATALYST_INSTANCE).get() == null) {
                Log.e(LOG_TAG, "No active CatalystInstance. Should never see this.");
                return false;
            }

            if (!(boolean)Reflect.on(reactContext).call(METHOD_HAS_NATIVE_MODULE, uiModuleClass).get()) {
                Log.e(LOG_TAG, "Can't find UIManagerModule.");
                if (callback != null) {
                    callback.onTransitionToIdle();
                }
                return true;
            }

            Object uiOperationQueue = Reflect.on(reactContext)
                    .call(METHOD_GET_NATIVE_MODULE, uiModuleClass)
                    .call(METHOD_GET_UI_IMPLEMENTATION)
                    .call(METHOD_GET_UI_OPERATION_QUEUE)
                    .get();
            Object runnablesLock = Reflect.on(uiOperationQueue).field(LOCK_RUNNABLES).get();
            Object operationsLock = Reflect.on(uiOperationQueue).field(LOCK_OPERATIONS).get();

            boolean runnablesAreEmpty;
            boolean nonBatchesOpsEmpty;
            synchronized (runnablesLock) {
                runnablesAreEmpty = (boolean) Reflect.on(uiOperationQueue)
                        .field(FIELD_DISPATCH_RUNNABLES)
                        .call(METHOD_IS_EMPTY).get();
            }
            synchronized (operationsLock) {
                nonBatchesOpsEmpty = (boolean) Reflect.on(uiOperationQueue)
                        .field(FIELD_NON_BATCHES_OPERATIONS)
                        .call(METHOD_IS_EMPTY).get();
            }

            boolean isOperationQueueEmpty = (Boolean) Reflect.on(uiOperationQueue).call(METHOD_IS_EMPTY).get();

            if (runnablesAreEmpty && nonBatchesOpsEmpty && isOperationQueueEmpty) {
                if (callback != null) {
                    callback.onTransitionToIdle();
                }
                // Log.i(LOG_TAG, "UIManagerModule is idle.");
                return true;
            }

            Log.i(LOG_TAG, "UIManagerModule is busy.");
            Choreographer.getInstance().postFrameCallback(this);
            return false;
        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Can't set up RN UIModule listener", e.getCause());
        }

        if (callback != null) {
            callback.onTransitionToIdle();
        }
        return true;
    }

    @Override
    public void registerIdleTransitionCallback(ResourceCallback callback) {
        this.callback = callback;

        Choreographer.getInstance().postFrameCallback(this);
    }

    @Override
    public void doFrame(long frameTimeNanos) {
        isIdleNow();
    }
}
