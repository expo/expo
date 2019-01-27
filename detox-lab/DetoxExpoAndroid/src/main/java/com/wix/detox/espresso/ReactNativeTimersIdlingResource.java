package com.wix.detox.espresso;

import android.support.annotation.NonNull;
import android.support.test.espresso.IdlingResource;
import android.util.Log;
import android.view.Choreographer;

import org.joor.Reflect;
import org.joor.ReflectException;

import java.util.PriorityQueue;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Created by simonracz on 23/05/2017.
 */

/**
 * <p>
 * Espresso IdlingResource for React Native js timers.
 * </p>
 *
 * <p>
 * Hooks up to React Native internals to grab the timers queue from it.
 * </p>
 * <p>
 * This resource is considered idle if the Timers priority queue is empty or
 * the one scheduled the soonest is still too far in the future.
 * </p>
 */
public class ReactNativeTimersIdlingResource implements IdlingResource, Choreographer.FrameCallback {
    private static final String LOG_TAG = "Detox";

    private final static String CLASS_TIMING = "com.facebook.react.modules.core.Timing";
    private final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    private final static String METHOD_HAS_NATIVE_MODULE = "hasNativeModule";
    private final static String FIELD_TIMERS = "mTimers";
    private final static String FIELD_TARGET_TIME = "mTargetTime";
    private final static String FIELD_CATALYST_INSTANCE = "mCatalystInstance";
    private final static String LOCK_TIMER = "mTimerGuard";

    private AtomicBoolean stopped = new AtomicBoolean(false);

    private static final long LOOK_AHEAD_MS = 15;

    private ResourceCallback callback = null;
    private Object reactContext = null;

    public ReactNativeTimersIdlingResource(@NonNull Object reactContext) {
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return ReactNativeTimersIdlingResource.class.getName();
    }

    @Override
    public boolean isIdleNow() {
        if (stopped.get()) {
            if (callback != null) {
                callback.onTransitionToIdle();
            }
            return true;
        }
        Class<?> timingClass;
        try {
            timingClass = Class.forName(CLASS_TIMING);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "Can't find Timing or Timing$Timer classes");
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

            if (!(boolean)Reflect.on(reactContext).call(METHOD_HAS_NATIVE_MODULE, timingClass).get()) {
                Log.e(LOG_TAG, "Can't find Timing NativeModule");
                if (callback != null) {
                    callback.onTransitionToIdle();
                }
                return true;
            }

            Object timingModule = Reflect.on(reactContext).call(METHOD_GET_NATIVE_MODULE, timingClass).get();
            Object timerLock = Reflect.on(timingModule).field(LOCK_TIMER).get();
            synchronized (timerLock) {
                PriorityQueue<?> timers = Reflect.on(timingModule).field(FIELD_TIMERS).get();
                if (timers.isEmpty()) {
                    if (callback != null) {
                        callback.onTransitionToIdle();
                    }
                    return true;
                }

                // Log.i(LOG_TAG, "Num of Timers : " + timers.size());

                long targetTime = Reflect.on(timers.peek()).field(FIELD_TARGET_TIME).get();
                long currentTimeMS = System.nanoTime() / 1000000;

                // Log.i(LOG_TAG, "targetTime " + targetTime + " currentTime " + currentTimeMS);

                if (targetTime - currentTimeMS > LOOK_AHEAD_MS || targetTime < currentTimeMS) {
                    // Timer is too far in the future. Mark it as OK for now.
                    // This is similar to what Espresso does internally.
                    if (callback != null) {
                        callback.onTransitionToIdle();
                    }
                    // Log.i(LOG_TAG, "JS Timer is idle: true");
                    return true;
                }
            }

            Choreographer.getInstance().postFrameCallback(this);
            Log.i(LOG_TAG, "JS Timer is busy");
            return false;
        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Can't set up RN timer listener", e.getCause());
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

    public void stop() {
        stopped.set(true);
    }
}
