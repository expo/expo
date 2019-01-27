package com.wix.detox.espresso;

import android.os.Build;
import android.support.test.espresso.UiController;
import android.support.test.espresso.action.MotionEvents;
import android.support.test.espresso.action.MotionEvents.DownResultHolder;
import android.support.test.espresso.action.Tapper;
import android.util.Log;
import android.view.ViewConfiguration;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import static android.support.test.espresso.core.internal.deps.guava.base.Preconditions.checkNotNull;


public class MultiTap implements Tapper {

    int times;

    MultiTap(int times) {
        this.times = times;
    }

    @Override
    public Tapper.Status sendTap(UiController uiController, float[] coordinates, float[] precision) {
        return sendTap(uiController, coordinates, precision, 0, 0);
    }

    @Override
    public Tapper.Status sendTap(UiController uiController, float[] coordinates, float[] precision, int inputDevice, int buttonState) {
        checkNotNull(uiController);
        checkNotNull(coordinates);
        checkNotNull(precision);
        boolean gotWarning = false;
        for (int i = 0; i < times; i++) {
            Tapper.Status tapStatus = sendSingleTap(uiController, coordinates, precision, inputDevice, buttonState);
            if (tapStatus == Tapper.Status.FAILURE) {
                return Tapper.Status.FAILURE;
            }
            if (tapStatus == Tapper.Status.WARNING) {
                gotWarning = true;
            }

            if (i < times - 1) {
                if (0 < DOUBLE_TAP_MIN_TIMEOUT) {
                    uiController.loopMainThreadForAtLeast(DOUBLE_TAP_MIN_TIMEOUT);
                }
            }

        }

        if (gotWarning) {
            return Tapper.Status.WARNING;
        } else {
            return Tapper.Status.SUCCESS;
        }
    }


    private static final String TAG = MultiTap.class.getSimpleName();
    private static final int DOUBLE_TAP_MIN_TIMEOUT;

    static {
        int timeVal = 0;
        if (Build.VERSION.SDK_INT > 18) {
            try {
                Method getDoubleTapMinTimeMethod = ViewConfiguration.class.getDeclaredMethod("getDoubleTapMinTime");
                timeVal = (Integer) getDoubleTapMinTimeMethod.invoke(null);
            } catch (NoSuchMethodException nsme) {
                Log.w(TAG, "Expected to find getDoubleTapMinTime", nsme);
            } catch (InvocationTargetException ite) {
                Log.w(TAG, "Unable to query double tap min time!", ite);
            } catch (IllegalAccessException iae) {
                Log.w(TAG, "Unable to query double tap min time!", iae);
            }
        }
        DOUBLE_TAP_MIN_TIMEOUT = timeVal;
    }

    private static Tapper.Status sendSingleTap(UiController uiController, float[] coordinates, float[] precision, int inputDevice, int buttonState) {
        checkNotNull(uiController);
        checkNotNull(coordinates);
        checkNotNull(precision);
        DownResultHolder res = MotionEvents.sendDown(uiController, coordinates, precision, inputDevice, buttonState);
        try {
            if (!MotionEvents.sendUp(uiController, res.down)) {
                Log.d(TAG, "Injection of up event as part of the click failed. Send cancel event.");
                MotionEvents.sendCancel(uiController, res.down);
                return Tapper.Status.FAILURE;
            }
        } finally {
            res.down.recycle();
        }
        return res.longPress ? Tapper.Status.WARNING : Tapper.Status.SUCCESS;
    }
}
