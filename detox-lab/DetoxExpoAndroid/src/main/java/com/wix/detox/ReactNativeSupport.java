package com.wix.detox;

import android.content.Context;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.IdlingRegistry;
import android.support.test.espresso.base.IdlingResourceRegistry;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.wix.detox.espresso.AnimatedModuleIdlingResource;
import com.wix.detox.espresso.ReactNativeNetworkIdlingResource;
import com.wix.detox.espresso.ReactBridgeIdlingResource;
import com.wix.detox.espresso.ReactNativeTimersIdlingResource;
import com.wix.detox.espresso.ReactNativeUIModuleIdlingResource;

import org.joor.Reflect;
import org.joor.ReflectException;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import expolib_v1.okhttp3.OkHttpClient;


/**
 * Created by simonracz on 15/05/2017.
 */

//TODO Dear reader, if you get this far and find this class messy you are not alone. :) It needs a refactor.

public class ReactNativeSupport {
    private static final String LOG_TAG = "Detox";

    private static final String FIELD_UI_BG_MSG_QUEUE = "mUiBackgroundMessageQueueThread";
    private static final String FIELD_NATIVE_MODULES_MSG_QUEUE = "mNativeModulesMessageQueueThread";
    private static final String FIELD_JS_MSG_QUEUE = "mJSMessageQueueThread";
    private static final String METHOD_GET_LOOPER = "getLooper";

    private ReactNativeSupport() {
        // static class
    }

    static boolean isReactNativeApp() {
        Class<?> found = null;
        try {
            found = Class.forName("com.facebook.react.ReactApplication");
        } catch (ClassNotFoundException e) {
            return false;
        }
        return (found != null);
    }

    /**
     * Returns the instanceManager using reflection.
     *
     * @param context the object that has a getReactNativeHost() method
     * @return Returns the instanceManager as an Object or null
     */
    public static ReactInstanceManager getInstanceManager(@NonNull Context context) {
        return Reflect.on("host.exp.exponent.kernel.KernelProvider").call("getInstance").call("getReactInstanceManager").get();
    }

    /**
     * <p>
     * Reloads the React Native application.
     * </p>
     *
     * <p>
     * It is a lot faster to reload a React Native application this way,
     * than to reload the whole Activity or Application.
     * </p>
     *
     * @param reactNativeHostHolder the object that has a getReactNativeHost() method
     */
    static void reloadApp(@NonNull Context reactNativeHostHolder) {
        if (!isReactNativeApp()) {
            return;
        }
        Log.i(LOG_TAG, "Reloading React Native");
        currentReactContext = null;

        removeEspressoIdlingResources(reactNativeHostHolder);

        final ReactInstanceManager instanceManager = getInstanceManager(reactNativeHostHolder);
        if (instanceManager == null) {
            return;
        }

        // Must be called on the UI thread!
        InstrumentationRegistry.getInstrumentation().runOnMainSync(new Runnable() {
            @Override
            public void run() {
                instanceManager.recreateReactContextInBackground();
            }
        });

        ReactNativeCompat.waitForReactNativeLoad(reactNativeHostHolder);
    }

    // Ideally we would not store this at all.
    public static ReactContext currentReactContext = null;

    private static void awaitInstanceManager(int maxSeconds, Context reactNativeHostHolder) {
        final CountDownLatch countDownLatch = new CountDownLatch(1);
        for (int i = 0; ; ) {
            try {
                if (!countDownLatch.await(1, TimeUnit.SECONDS)) {
                    i++;
                    if (i >= maxSeconds) {
                        // First load can take a lot of time. (packager)
                        // Loads afterwards should take less than a second.
                        throw new RuntimeException("waited " + maxSeconds + " seconds for the new reactContext");
                    }
                } else {
                    break;
                }

                // check if the instanceManager was instantiated
                if (getInstanceManager(reactNativeHostHolder) != null){
                    break;
                }
            } catch (InterruptedException e) {
                throw new RuntimeException("waiting for reactContext got interrupted", e);
            }
        }

    }

    private static void awaitReactContext(int maxSeconds, final ReactInstanceManager instanceManager){
        final CountDownLatch countDownLatch = new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(
                new Runnable() {
                    @Override
                    public void run() {
                        ReactContext reactContext = instanceManager.getCurrentReactContext();
                        if (reactContext != null) {
                            Log.d(LOG_TAG, "Got reactContext directly");
                            countDownLatch.countDown();
                            return;
                        }

                        instanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
                            @Override
                            public void onReactContextInitialized(ReactContext context) {
                                Log.i(LOG_TAG, "Got react context through listener.");
                                instanceManager.removeReactInstanceEventListener(this);
                                countDownLatch.countDown();
                            }
                        });
                    }
                });


        for (int i = 0; ; ) {
            try {
                if (!countDownLatch.await(1, TimeUnit.SECONDS)) {
                    i++;
                    if (i >= maxSeconds) {
                        // First load can take a lot of time. (packager)
                        // Loads afterwards should take less than a second.
                        throw new RuntimeException("waited a minute for the new reactContext");
                    }
                } else {
                    break;
                }
                // Due to an ugly timing issue in RN
                // it is possible that our listener won't be ever called
                // That's why we have to check the reactContext regularly.
                ReactContext reactContext = instanceManager.getCurrentReactContext();
                if (reactContext != null) {
                    Log.d(LOG_TAG, "Got reactContext directly");
                    break;
                }
            } catch (InterruptedException e) {
                throw new RuntimeException("waiting for reactContext got interrupted", e);
            }
        }
    }

    /**
     * <p>
     * Waits for a ReactContext to be created. Can be called any time.
     * </p>
     * @param reactNativeHostHolder the object that has a getReactNativeHost() method
     */
    static void waitForReactNativeLoad(@NonNull Context reactNativeHostHolder) {

        if (!isReactNativeApp()) {
            return;
        }

        int maxSeconds = 60;
        awaitInstanceManager(maxSeconds, reactNativeHostHolder);

        ReactInstanceManager instanceManager = getInstanceManager(reactNativeHostHolder);
        if (instanceManager == null) {
            throw new RuntimeException("ReactInstanceManager is null");
        }

        awaitReactContext(maxSeconds, instanceManager);
        currentReactContext = instanceManager.getCurrentReactContext();
        setupEspressoIdlingResources(currentReactContext);
    }

    private static ReactNativeTimersIdlingResource rnTimerIdlingResource = null;
    private static ReactBridgeIdlingResource rnBridgeIdlingResource = null;
    private static ReactNativeUIModuleIdlingResource rnUIModuleIdlingResource = null;
    private static AnimatedModuleIdlingResource animIdlingResource = null;

    private static void setupEspressoIdlingResources(@NonNull ReactContext reactContext) {
        removeEspressoIdlingResources(reactContext);
        Log.i(LOG_TAG, "Setting up Espresso Idling Resources for React Native.");

        setupReactNativeQueueInterrogators(reactContext);


        rnBridgeIdlingResource = new ReactBridgeIdlingResource(reactContext);
        rnTimerIdlingResource = new ReactNativeTimersIdlingResource(reactContext);
        rnUIModuleIdlingResource = new ReactNativeUIModuleIdlingResource(reactContext);
        animIdlingResource = new AnimatedModuleIdlingResource(reactContext);

        IdlingRegistry.getInstance().register(rnTimerIdlingResource);
        IdlingRegistry.getInstance().register(rnBridgeIdlingResource);
        IdlingRegistry.getInstance().register(rnUIModuleIdlingResource);
        IdlingRegistry.getInstance().register(animIdlingResource);

        if (networkSyncEnabled) {
            setupNetworkIdlingResource();
        }
    }

    private static void setupReactNativeQueueInterrogators(@NonNull Object reactContext) {
        Looper UIBackgroundMessageQueue = getLooperFromQueue(reactContext, FIELD_UI_BG_MSG_QUEUE);
        Looper JSMessageQueue = getLooperFromQueue(reactContext, FIELD_JS_MSG_QUEUE);
        Looper JMativeModulesMessageQueue = getLooperFromQueue(reactContext, FIELD_NATIVE_MODULES_MSG_QUEUE);

//        IdlingRegistry.getInstance().registerLooperAsIdlingResource(UIBackgroundMessageQueue);
        IdlingRegistry.getInstance().registerLooperAsIdlingResource(JSMessageQueue);
        IdlingRegistry.getInstance().registerLooperAsIdlingResource(JMativeModulesMessageQueue);

        IdlingResourceRegistry irr = Reflect.on("android.support.test.espresso.Espresso").field("baseRegistry").get();
        irr.sync(IdlingRegistry.getInstance().getResources(), IdlingRegistry.getInstance().getLoopers());
    }

    private static Looper getLooperFromQueue(@NonNull Object reactContext, String queueName) {
        Object queue;
        Looper looper = null;

        try {
            queue = Reflect.on(reactContext).field(queueName).get();
            if (queue != null) {
                looper = Reflect.on(queue).call(METHOD_GET_LOOPER).get();
            }
        } catch (ReflectException e) {
            return null;
        }
        return looper;
    }

    static void removeEspressoIdlingResources(@NonNull Context reactNativeHostHolder) {
        final ReactInstanceManager instanceManager = getInstanceManager(reactNativeHostHolder);
        removeNetworkIdlingResource();
        removeEspressoIdlingResources(instanceManager.getCurrentReactContext());
    }

    private static void removeEspressoIdlingResources(ReactContext reactContext) {

        Log.i(LOG_TAG, "Removing Espresso IdlingResources for React Native.");

        IdlingRegistry.getInstance().unregister(rnTimerIdlingResource);
        IdlingRegistry.getInstance().unregister(rnBridgeIdlingResource);
        IdlingRegistry.getInstance().unregister(rnUIModuleIdlingResource);
        IdlingRegistry.getInstance().unregister(animIdlingResource);

        reactContext.getCatalystInstance().removeBridgeIdleDebugListener(rnBridgeIdlingResource);
    }

    private static boolean networkSyncEnabled = true;
    public static void enableNetworkSynchronization(boolean enable) {
        if (!isReactNativeApp()) return;
        if (networkSyncEnabled == enable) return;

        if (enable) {
            setupNetworkIdlingResource();
        } else {
            removeNetworkIdlingResource();
        }
        networkSyncEnabled = enable;
    }

    private static ReactNativeNetworkIdlingResource networkIR = null;
    private final static String CLASS_NETWORK_MODULE = "com.facebook.react.modules.network.NetworkingModule";
    private final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    private final static String METHOD_HAS_NATIVE_MODULE = "hasNativeModule";
    private final static String FIELD_OKHTTP_CLIENT = "mClient";

    private static void setupNetworkIdlingResource() {
        Class<?> networkModuleClass;
        try {
            networkModuleClass = Class.forName(CLASS_NETWORK_MODULE);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "NetworkingModule is not on classpath.");
            return;
        }

        if (currentReactContext == null) {
            return;
        }

        try {
            if (!(boolean) Reflect.on(currentReactContext).call(METHOD_HAS_NATIVE_MODULE, networkModuleClass).get()) {
                Log.e(LOG_TAG, "Can't find Networking Module.");
                return;
            }

            OkHttpClient client = Reflect.on(currentReactContext)
                    .call(METHOD_GET_NATIVE_MODULE, networkModuleClass)
                    .field(FIELD_OKHTTP_CLIENT)
                    .get();
            networkIR = new ReactNativeNetworkIdlingResource(client.dispatcher());
            IdlingRegistry.getInstance().register(networkIR);

        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Can't set up Networking Module listener", e.getCause());
        }
    }

    private static void removeNetworkIdlingResource() {
        if (networkIR != null) {
            networkIR.stop();
            IdlingRegistry.getInstance().unregister(networkIR);
            networkIR = null;
        }
    }
}
