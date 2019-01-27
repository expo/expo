package com.wix.detox;

import android.app.Application;
import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.espresso.IdlingResource;
import android.util.Log;

import com.wix.detox.espresso.UiAutomatorHelper;
import com.wix.detox.systeminfo.Environment;
import com.wix.invoke.MethodInvocation;

import org.joor.Reflect;
import org.joor.ReflectException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;


/**
 * Created by rotemm on 04/01/2017.
 */

class DetoxManager implements WebSocketClient.ActionHandler {

    private static final String LOG_TAG =  "DetoxManager";

    private final static String DETOX_SERVER_ARG_KEY = "detoxServer";
    private final static String DETOX_SESSION_ID_ARG_KEY = "detoxSessionId";
    private String detoxServerUrl;
    private String detoxSessionId;

    private WebSocketClient wsClient;
    private Handler handler;

    private Context reactNativeHostHolder;

    DetoxManager(@NonNull Context context) {
        this.reactNativeHostHolder = context;
        handler = new Handler();

        Bundle arguments = InstrumentationRegistry.getArguments();
        detoxServerUrl = arguments.getString(DETOX_SERVER_ARG_KEY);
        if (detoxServerUrl != null) {
            detoxServerUrl = detoxServerUrl.replace(Environment.DEVICE_LOCALHOST, Environment.getServerHost());
        }
        detoxSessionId = arguments.getString(DETOX_SESSION_ID_ARG_KEY);

        if (detoxServerUrl == null || detoxSessionId == null) {
            Log.i(LOG_TAG, "Missing arguments : detoxServer and/or detoxSession. Detox quits.");
            stop();
            return;
        }

        Log.i(LOG_TAG, "DetoxServerUrl : " + detoxServerUrl);
        Log.i(LOG_TAG, "DetoxSessionId : " + detoxSessionId);
    }

    void start() {
        if (detoxServerUrl != null && detoxSessionId != null) {
            if (ReactNativeSupport.isReactNativeApp()) {
                ReactNativeCompat.waitForReactNativeLoad(reactNativeHostHolder);
            }

            wsClient = new WebSocketClient(this);
            wsClient.connectToServer(detoxServerUrl, detoxSessionId);
        }
    }

    boolean stopping = false;

    void stop() {
        Log.i(LOG_TAG, "Stopping Detox.");
        handler.postAtFrontOfQueue(new Runnable() {
            @Override
            public void run() {
                if (stopping) return;
                stopping = true;
                ReactNativeSupport.currentReactContext = null;
                ReactNativeSupport.removeEspressoIdlingResources(reactNativeHostHolder);
                if (wsClient != null) {
                    wsClient.close();
                }
                Looper.myLooper().quit();
            }
        });
    }

    @Override
    public void onAction(final String type, final String params, final long messageId) {
        Log.i(LOG_TAG, "onAction: type: " + type + " params: " + params);
        handler.post(new Runnable() {
            @Override
            public void run() {
                switch (type) {
                    case "invoke":
                        try {
                            Object retVal = MethodInvocation.invoke(params);
                            Log.d(LOG_TAG, "Invocation result: " + retVal);
                            String retStr = "(null)";
                            if (retVal != null) {
                                // TODO
                                // handle supported return types
                            }
                            HashMap m = new HashMap();
                            m.put("result", retStr);
                            wsClient.sendAction("invokeResult", m, messageId);
                        } catch (InvocationTargetException e) {
                                Log.e(LOG_TAG, "Exception", e);
                                HashMap m = new HashMap();
                                m.put("error", e.getTargetException().getMessage());
                                wsClient.sendAction("error", m, messageId);
                        } catch (Exception e) {
                            Log.i(LOG_TAG, "Test exception", e);
                            HashMap m = new HashMap();
                            m.put("details", e.getMessage());
                            wsClient.sendAction("testFailed", m, messageId);
                        }
                        break;
                    case "isReady":
                        wsClient.sendAction("ready", Collections.emptyMap(), messageId);
                        break;
                    case "cleanup":
                        ReactNativeSupport.currentReactContext = null;
                        try {
                            boolean stopRunner = new JSONObject(params).getBoolean("stopRunner");
                            if (stopRunner) {
                                stop();
                            } else {
                                ReactNativeSupport.removeEspressoIdlingResources(reactNativeHostHolder);
                            }
                        } catch (JSONException e) {
                            Log.e(LOG_TAG, "cleanup cmd doesn't have stopRunner param");
                        }
                        wsClient.sendAction("cleanupDone", Collections.emptyMap(), messageId);
                        break;
                    case "reactNativeReload":
                        UiAutomatorHelper.espressoSync();
                        ReactNativeSupport.reloadApp(reactNativeHostHolder);
                        wsClient.sendAction("ready", Collections.emptyMap(), messageId);
                        break;
                    case "currentStatus":
                        // Ugly, deeply nested, because have to follow
                        // EarlGrey/Detox iOS here.
                        ArrayList<IdlingResource> l = getBusyEspressoResources();
                        HashMap m = new HashMap();
                        if (l.isEmpty()) {
                            m.put("state", "idle");
                            wsClient.sendAction("currentStatusResult", m, messageId);
                            break;
                        }
                        m.put("state", "busy");
                        JSONArray resources = new JSONArray();
                        for (IdlingResource res : l) {
                            JSONObject obj = new JSONObject();
                            try {
                                obj.put("name", res.getClass().getSimpleName());
                                JSONObject prettyPrint = new JSONObject();
                                prettyPrint.put("prettyPrint", res.getName());
                                obj.put("info", prettyPrint);
                                resources.put(obj);
                            } catch (JSONException je) {
                                Log.d(LOG_TAG, "Couldn't collect busy resources.", je);
                            }
                        }
                        m.put("resources", resources);
                        wsClient.sendAction("currentStatusResult", m, messageId);
                        break;
                }
            }
        });
    }

    private ArrayList<IdlingResource> getBusyEspressoResources() {
        // We do this in this complicated way for two reasons
        // 1. we want to use postAtFrontOfQueue()
        // 2. we want it to be synchronous
        final ArrayList<IdlingResource> busyResources = new ArrayList<>();
        Handler handler = new Handler(InstrumentationRegistry.getTargetContext().getMainLooper());
        SyncRunnable sr = new SyncRunnable(new Runnable() {
            @Override
            public void run() {
                // The following snippet works only in Espresso 3.0
                try {
                    ArrayList<Object> idlingStates = Reflect.on(Espresso.class)
                            .field("baseRegistry")
                            .field("idlingStates")
                            .get();
                    for (int i = 0; i < idlingStates.size(); ++i) {
                        if (!(boolean)Reflect.on(idlingStates.get(i)).field("idle").get()) {
                            busyResources.add((IdlingResource)Reflect.on(idlingStates.get(i)).field("resource").get());
                        }
                    }
                } catch (ReflectException e) {
                    Log.d(LOG_TAG, "Couldn't get busy resources", e);
                }
            }
        });
        handler.postAtFrontOfQueue(sr);
        sr.waitForComplete();
        return busyResources;
    }

    @Override
    public void onConnect() {
        wsClient.sendAction("ready", Collections.emptyMap(), -1000L);
    }

    @Override
    public void onClosed() {
        stop();
    }

    private static final class SyncRunnable implements Runnable {
        private final Runnable mTarget;
        private boolean mComplete;

        public SyncRunnable(Runnable target) {
            mTarget = target;
        }

        public void run() {
            mTarget.run();
            synchronized (this) {
                mComplete = true;
                notifyAll();
            }
        }

        public void waitForComplete() {
            synchronized (this) {
                while (!mComplete) {
                    try {
                        wait();
                    } catch (InterruptedException e) {
                    }
                }
            }
        }
    }
}
