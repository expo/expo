package com.wix.detox.espresso;

import android.support.annotation.NonNull;
import android.support.test.espresso.IdlingResource;
import android.util.Log;
import android.view.Choreographer;

import com.wix.detox.ReactNativeCompat;

import org.joor.Reflect;
import org.joor.ReflectException;

/**
 * Created by simonracz on 25/08/2017.
 */

/**
 * <p>
 * Espresso IdlingResource for React Native's Animated Module.
 * </p>
 * <p>
 * <p>
 * Hooks up to React Native internals to monitor the state of the animations.
 * </p>
 * <p>
 * This Idling Resource is inherently tied to the UI Module IR. It must be registered after
 * the UI Module IR. This order is not enforced now.
 *
 * @see <a href="https://github.com/facebook/react-native/blob/259eac8c30b536abddab7925f4c51f0bf7ced58d/ReactAndroid/src/main/java/com/facebook/react/animated/NativeAnimatedModule.java#L143">AnimatedModule</a>
 */
public class AnimatedModuleIdlingResource implements IdlingResource, Choreographer.FrameCallback {
    private static final String LOG_TAG = "Detox";

    private final static String CLASS_ANIMATED_MODULE = "com.facebook.react.animated.NativeAnimatedModule";
    private final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    private final static String METHOD_HAS_NATIVE_MODULE = "hasNativeModule";
    private final static String METHOD_IS_EMPTY = "isEmpty";

    private final static String LOCK_OPERATIONS = "mOperationsCopyLock";
    private final static String FIELD_OPERATIONS = "mReadyOperations";
    private final static String FIELD_NODES_MANAGER = "mNodesManager";

    private final static String FIELD_ITERATIONS = "mIterations";
    private final static String FIELD_ACTIVE_ANIMATIONS = "mActiveAnimations";
    private final static String FIELD_UPDATED_NODES = "mUpdatedNodes";
    private final static String FIELD_CATALYST_INSTANCE = "mCatalystInstance";

    private final static String METHOD_SIZE = "size";
    private final static String METHOD_VALUE_AT = "valueAt";

    private final static String METHOD_HAS_ACTIVE_ANIMATIONS = "hasActiveAnimations";

    private ResourceCallback callback = null;
    private Object reactContext = null;

    public AnimatedModuleIdlingResource(@NonNull Object reactContext) {
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return AnimatedModuleIdlingResource.class.getName();
    }

    @Override
    public boolean isIdleNow() {
        Class<?> animModuleClass = null;
        try {
            animModuleClass = Class.forName(CLASS_ANIMATED_MODULE);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "Animated Module is not on classpath.");
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

            if (!(boolean) Reflect.on(reactContext).call(METHOD_HAS_NATIVE_MODULE, animModuleClass).get()) {
                Log.e(LOG_TAG, "Can't find Animated Module.");
                if (callback != null) {
                    callback.onTransitionToIdle();
                }
                return true;
            }

            if (ReactNativeCompat.getMinor() >= 51) {
                if(isIdleRN51(animModuleClass)) {
                    return true;
                }
            } else {
                if (isIdleRNOld(animModuleClass)) {
                    return true;
                }
            }

            Log.i(LOG_TAG, "AnimatedModule is busy.");
            Choreographer.getInstance().postFrameCallback(this);
            return false;
        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Couldn't set up RN AnimatedModule listener, old RN version?");
            Log.e(LOG_TAG, "Can't set up RN AnimatedModule listener", e.getCause());
        }

        if (callback != null) {
            callback.onTransitionToIdle();
        }
//        Log.i(LOG_TAG, "AnimatedModule is idle.");
        return true;
    }

    private boolean isIdleRN51(Object animModuleClass) {
        Object animModule = Reflect.on(reactContext).call(METHOD_GET_NATIVE_MODULE, animModuleClass).get();
        Object nodesManager = Reflect.on(animModule).call("getNodesManager").get();
        boolean hasActiveAnimations = Reflect.on(nodesManager).call("hasActiveAnimations").get();
        if (!hasActiveAnimations) {
            if (callback != null) {
                callback.onTransitionToIdle();
            }
//            Log.i(LOG_TAG, "AnimatedModule is idle, no operations");
            return true;
        }
        return false;
    }

    private boolean isIdleRNOld(Object animModuleClass) {
        Object animModule = Reflect.on(reactContext).call(METHOD_GET_NATIVE_MODULE, animModuleClass).get();
        Object operationsLock = Reflect.on(animModule).field(LOCK_OPERATIONS).get();
        boolean operationsAreEmpty;
        boolean animationsConsideredIdle;
        synchronized (operationsLock) {
            Object operations = Reflect.on(animModule).field(FIELD_OPERATIONS).get();
            if (operations == null) {
                operationsAreEmpty = true;
            } else {
                operationsAreEmpty = Reflect.on(operations).call(METHOD_IS_EMPTY).get();
            }
        }
        Object nodesManager = Reflect.on(animModule).field(FIELD_NODES_MANAGER).get();

        // We do this in this complicated way
        // to not consider looped animations
        // as a busy state.
        int updatedNodesSize = Reflect.on(nodesManager).field(FIELD_UPDATED_NODES).call(METHOD_SIZE).get();
        if (updatedNodesSize > 0) {
            animationsConsideredIdle = false;
        } else {
            Object activeAnims = Reflect.on(nodesManager).field(FIELD_ACTIVE_ANIMATIONS).get();
            int activeAnimsSize = Reflect.on(activeAnims).call(METHOD_SIZE).get();
            if (activeAnimsSize == 0) {
                animationsConsideredIdle = true;
            } else {
                animationsConsideredIdle = true;
                for (int i = 0; i < activeAnimsSize; ++i) {
                    int iterations = Reflect.on(activeAnims).call(METHOD_VALUE_AT, i).field(FIELD_ITERATIONS).get();
                    // -1 means it is looped
                    if (iterations != -1) {
                        animationsConsideredIdle = false;
                        break;
                    }
                }
            }
        }

        if (operationsAreEmpty && animationsConsideredIdle) {
            if (callback != null) {
                callback.onTransitionToIdle();
            }
//            Log.i(LOG_TAG, "AnimatedModule is idle.");
            return true;
        }
        return false;
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

