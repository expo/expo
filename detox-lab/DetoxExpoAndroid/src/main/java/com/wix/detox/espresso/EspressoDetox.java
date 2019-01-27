package com.wix.detox.espresso;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.pm.ActivityInfo;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.ViewInteraction;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;

import com.wix.detox.ReactNativeSupport;

import org.hamcrest.Matcher;
import org.joor.Reflect;

import java.util.ArrayList;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.matcher.ViewMatchers.isRoot;

/**
 * Created by rotemm on 26/12/2016.
 */

public class EspressoDetox {
    private static final String LOG_TAG = "detox";

    private static final String METHOD_GET_ACTIVITY = "getCurrentActivity";

    public static ViewInteraction perform(ViewInteraction interaction, ViewAction action) {
        return interaction.perform(action);
    }

    public static Activity getActivity(Context context) {
        if (context instanceof Activity) {
            return (Activity) context;
        }
        while (context instanceof ContextWrapper) {
            if (context instanceof Activity) {
                return (Activity) context;
            }
            context = ((ContextWrapper) context).getBaseContext();
        }
        return null;
    }

    public static void changeOrientation(final int orientation) {
        onView(isRoot()).perform(new ViewAction() {
            @Override
            public Matcher<View> getConstraints() {
                return isRoot();
            }

            @Override
            public String getDescription() {
                return "changing orientation to " + orientation;
            }

            @Override
            public void perform(UiController uiController, View view) {
                Activity activity;
                if (ReactNativeSupport.currentReactContext != null) {
                    activity = Reflect.on(ReactNativeSupport.currentReactContext).call(METHOD_GET_ACTIVITY).get();
                } else {
                    activity = getActivity(view.getContext());
                    if (activity == null && view instanceof ViewGroup) {
                        ViewGroup v = (ViewGroup)view;
                        int c = v.getChildCount();
                        for (int i = 0; i < c && activity == null; ++i) {
                            activity = getActivity(v.getChildAt(i).getContext());
                        }
                    }
                }
                if (activity == null) {
                    throw new RuntimeException("Couldn't get a hold of the Activity");
                }
                switch (orientation) {
                    case 0:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                        break;
                    case 1:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                        break;
                    case 2:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT);
                        break;
                    case 3:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE);
                        break;
                    default:
                        Log.e(LOG_TAG, "Not supported orientation: " + orientation);
                }
                uiController.loopMainThreadUntilIdle();
            }
        });
    }

    public static void setSynchronization(boolean enabled) {
        ReactNativeSupport.enableNetworkSynchronization(enabled);
    }

    public static void setURLBlacklist(final ArrayList<String> urls) {
        InstrumentationRegistry.getInstrumentation().runOnMainSync(new Runnable() {
            @Override
            public void run() {
                ReactNativeNetworkIdlingResource.setURLBlacklist(urls);
            }
        });
    }
}

