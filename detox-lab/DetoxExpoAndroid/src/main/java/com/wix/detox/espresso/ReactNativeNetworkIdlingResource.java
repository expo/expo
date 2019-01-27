package com.wix.detox.espresso;

import android.support.annotation.NonNull;
import android.support.test.espresso.IdlingResource;
import android.util.Log;
import android.view.Choreographer;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import expolib_v1.okhttp3.Call;
import expolib_v1.okhttp3.Dispatcher;

/**
 * Created by simonracz on 09/10/2017.
 */


/**
 * Idling Resource which monitors React Native's OkHttpClient.
 * <p>
 * Must call stop() on it, before removing it from Espresso.
 */
public class ReactNativeNetworkIdlingResource implements IdlingResource, Choreographer.FrameCallback {

    private static final String LOG_TAG = "Detox";

    private AtomicBoolean stopped = new AtomicBoolean(false);

    private ResourceCallback callback;
    private Dispatcher dispatcher;

    private static final ArrayList<Pattern> blacklist = new ArrayList<>();

    /**
     * Must be called on the UI thread.
     *
     * @param urls list of regexes of blacklisted urls
     */
    public static void setURLBlacklist(ArrayList<String> urls) {
        blacklist.clear();
        if (urls == null) return;

        for (String url : urls) {
            try {
                blacklist.add(Pattern.compile(url));
            } catch (PatternSyntaxException e) {
                Log.e(LOG_TAG, "Couldn't parse regular expression for Black list url: " + url, e);
            }
        }
    }


    public ReactNativeNetworkIdlingResource(@NonNull Dispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @Override
    public String getName() {
        return ReactNativeNetworkIdlingResource.class.getName();
    }

    @Override
    public boolean isIdleNow() {
        if (stopped.get()) {
            if (callback != null) {
                callback.onTransitionToIdle();
            }
            return true;
        }
        boolean idle = true;
        List<Call> calls = dispatcher.runningCalls();
        for (Call call : calls) {
            idle = false;
            String url = call.request().url().toString();
            for (Pattern pattern : blacklist) {
                if (pattern.matcher(url).matches()) {
                    idle = true;
                    break;
                }
            }
            if (!idle) {
                break;
            }
        }
        if (!idle) {
            Choreographer.getInstance().postFrameCallback(this);
            Log.i(LOG_TAG, "Network is busy");
        } else {
            if (callback != null) {
                callback.onTransitionToIdle();
            }
        }
        return idle;
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




