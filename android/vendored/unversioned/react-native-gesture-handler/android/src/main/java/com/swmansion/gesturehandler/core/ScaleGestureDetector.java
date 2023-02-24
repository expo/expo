/*
 * Copyright (C) 2010 The Android Open Source Project
 *
 * Copied from https://android.googlesource.com/platform/frameworks/base/+/master/core/java/android/view/ScaleGestureDetector.java
 * Modified line 189 to set initial min span to 0 instead of copying it from the system configuration
 */

package com.swmansion.gesturehandler.core;

import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;

/**
 * Detects scaling transformation gestures using the supplied {@link MotionEvent}s.
 * The {@link OnScaleGestureListener} callback will notify users when a particular
 * gesture event has occurred.
 *
 * This class should only be used with {@link MotionEvent}s reported via touch.
 *
 * To use this class:
 * <ul>
 *  <li>Create an instance of the {@code ScaleGestureDetector} for your
 *      {@link View}
 *  <li>In the {@link View#onTouchEvent(MotionEvent)} method ensure you call
 *          {@link #onTouchEvent(MotionEvent)}. The methods defined in your
 *          callback will be executed when the events occur.
 * </ul>
 */
public class ScaleGestureDetector {
    private static final String TAG = "ScaleGestureDetector";

    /**
     * The listener for receiving notifications when gestures occur.
     * If you want to listen for all the different gestures then implement
     * this interface. If you only want to listen for a subset it might
     * be easier to extend {@link SimpleOnScaleGestureListener}.
     *
     * An application will receive events in the following order:
     * <ul>
     *  <li>One {@link OnScaleGestureListener#onScaleBegin(ScaleGestureDetector)}
     *  <li>Zero or more {@link OnScaleGestureListener#onScale(ScaleGestureDetector)}
     *  <li>One {@link OnScaleGestureListener#onScaleEnd(ScaleGestureDetector)}
     * </ul>
     */
    public interface OnScaleGestureListener {
        /**
         * Responds to scaling events for a gesture in progress.
         * Reported by pointer motion.
         *
         * @param detector The detector reporting the event - use this to
         *          retrieve extended info about event state.
         * @return Whether or not the detector should consider this event
         *          as handled. If an event was not handled, the detector
         *          will continue to accumulate movement until an event is
         *          handled. This can be useful if an application, for example,
         *          only wants to update scaling factors if the change is
         *          greater than 0.01.
         */
        public boolean onScale(ScaleGestureDetector detector);

        /**
         * Responds to the beginning of a scaling gesture. Reported by
         * new pointers going down.
         *
         * @param detector The detector reporting the event - use this to
         *          retrieve extended info about event state.
         * @return Whether or not the detector should continue recognizing
         *          this gesture. For example, if a gesture is beginning
         *          with a focal point outside of a region where it makes
         *          sense, onScaleBegin() may return false to ignore the
         *          rest of the gesture.
         */
        public boolean onScaleBegin(ScaleGestureDetector detector);

        /**
         * Responds to the end of a scale gesture. Reported by existing
         * pointers going up.
         *
         * Once a scale has ended, {@link ScaleGestureDetector#getFocusX()}
         * and {@link ScaleGestureDetector#getFocusY()} will return focal point
         * of the pointers remaining on the screen.
         *
         * @param detector The detector reporting the event - use this to
         *          retrieve extended info about event state.
         */
        public void onScaleEnd(ScaleGestureDetector detector);
    }

    /**
     * A convenience class to extend when you only want to listen for a subset
     * of scaling-related events. This implements all methods in
     * {@link OnScaleGestureListener} but does nothing.
     * {@link OnScaleGestureListener#onScale(ScaleGestureDetector)} returns
     * {@code false} so that a subclass can retrieve the accumulated scale
     * factor in an overridden onScaleEnd.
     * {@link OnScaleGestureListener#onScaleBegin(ScaleGestureDetector)} returns
     * {@code true}.
     */
    public static class SimpleOnScaleGestureListener implements OnScaleGestureListener {

        public boolean onScale(ScaleGestureDetector detector) {
            return false;
        }

        public boolean onScaleBegin(ScaleGestureDetector detector) {
            return true;
        }

        public void onScaleEnd(ScaleGestureDetector detector) {
            // Intentionally empty
        }
    }

    private final Context mContext;
    private final OnScaleGestureListener mListener;

    private float mFocusX;
    private float mFocusY;

    private boolean mQuickScaleEnabled;
    private boolean mStylusScaleEnabled;

    private float mCurrSpan;
    private float mPrevSpan;
    private float mInitialSpan;
    private float mCurrSpanX;
    private float mCurrSpanY;
    private float mPrevSpanX;
    private float mPrevSpanY;
    private long mCurrTime;
    private long mPrevTime;
    private boolean mInProgress;
    private int mSpanSlop;
    private int mMinSpan;

    private final Handler mHandler;

    private float mAnchoredScaleStartX;
    private float mAnchoredScaleStartY;
    private int mAnchoredScaleMode = ANCHORED_SCALE_MODE_NONE;

    private static final long TOUCH_STABILIZE_TIME = 128; // ms
    private static final float SCALE_FACTOR = .5f;
    private static final int ANCHORED_SCALE_MODE_NONE = 0;
    private static final int ANCHORED_SCALE_MODE_DOUBLE_TAP = 1;
    private static final int ANCHORED_SCALE_MODE_STYLUS = 2;


    private GestureDetector mGestureDetector;

    private boolean mEventBeforeOrAboveStartingGestureEvent;

    /**
     * Creates a ScaleGestureDetector with the supplied listener.
     * You may only use this constructor from a {@link android.os.Looper Looper} thread.
     *
     * @param context the application's context
     * @param listener the listener invoked for all the callbacks, this must
     * not be null.
     *
     * @throws NullPointerException if {@code listener} is null.
     */
    public ScaleGestureDetector(Context context, OnScaleGestureListener listener) {
        this(context, listener, null);
    }

    /**
     * Creates a ScaleGestureDetector with the supplied listener.
     * @see android.os.Handler#Handler()
     *
     * @param context the application's context
     * @param listener the listener invoked for all the callbacks, this must
     * not be null.
     * @param handler the handler to use for running deferred listener events.
     *
     * @throws NullPointerException if {@code listener} is null.
     */
    public ScaleGestureDetector(Context context, OnScaleGestureListener listener,
                                Handler handler) {
        mContext = context;
        mListener = listener;
        final ViewConfiguration viewConfiguration = ViewConfiguration.get(context);
        mSpanSlop = viewConfiguration.getScaledTouchSlop() * 2;
        mMinSpan = 0; // set to zero, to allow for scaling when distance between fingers is small
        mHandler = handler;
        // Quick scale is enabled by default after JB_MR2
        final int targetSdkVersion = context.getApplicationInfo().targetSdkVersion;
        if (targetSdkVersion > Build.VERSION_CODES.JELLY_BEAN_MR2) {
            setQuickScaleEnabled(true);
        }
        // Stylus scale is enabled by default after LOLLIPOP_MR1
        if (targetSdkVersion > Build.VERSION_CODES.LOLLIPOP_MR1) {
            setStylusScaleEnabled(true);
        }
    }

    /**
     * Accepts MotionEvents and dispatches events to a {@link OnScaleGestureListener}
     * when appropriate.
     *
     * <p>Applications should pass a complete and consistent event stream to this method.
     * A complete and consistent event stream involves all MotionEvents from the initial
     * ACTION_DOWN to the final ACTION_UP or ACTION_CANCEL.</p>
     *
     * @param event The event to process
     * @return true if the event was processed and the detector wants to receive the
     *         rest of the MotionEvents in this event stream.
     */
    public boolean onTouchEvent(MotionEvent event) {
        mCurrTime = event.getEventTime();

        final int action = event.getActionMasked();

        // Forward the event to check for double tap gesture
        if (mQuickScaleEnabled) {
            mGestureDetector.onTouchEvent(event);
        }

        final int count = event.getPointerCount();
        final boolean isStylusButtonDown =
                (event.getButtonState() & MotionEvent.BUTTON_STYLUS_PRIMARY) != 0;

        final boolean anchoredScaleCancelled =
                mAnchoredScaleMode == ANCHORED_SCALE_MODE_STYLUS && !isStylusButtonDown;
        final boolean streamComplete = action == MotionEvent.ACTION_UP ||
                action == MotionEvent.ACTION_CANCEL || anchoredScaleCancelled;

        if (action == MotionEvent.ACTION_DOWN || streamComplete) {
            // Reset any scale in progress with the listener.
            // If it's an ACTION_DOWN we're beginning a new event stream.
            // This means the app probably didn't give us all the events. Shame on it.
            if (mInProgress) {
                mListener.onScaleEnd(this);
                mInProgress = false;
                mInitialSpan = 0;
                mAnchoredScaleMode = ANCHORED_SCALE_MODE_NONE;
            } else if (inAnchoredScaleMode() && streamComplete) {
                mInProgress = false;
                mInitialSpan = 0;
                mAnchoredScaleMode = ANCHORED_SCALE_MODE_NONE;
            }

            if (streamComplete) {
                return true;
            }
        }

        if (!mInProgress && mStylusScaleEnabled && !inAnchoredScaleMode()
                && !streamComplete && isStylusButtonDown) {
            // Start of a button scale gesture
            mAnchoredScaleStartX = event.getX();
            mAnchoredScaleStartY = event.getY();
            mAnchoredScaleMode = ANCHORED_SCALE_MODE_STYLUS;
            mInitialSpan = 0;
        }

        final boolean configChanged = action == MotionEvent.ACTION_DOWN ||
                action == MotionEvent.ACTION_POINTER_UP ||
                action == MotionEvent.ACTION_POINTER_DOWN || anchoredScaleCancelled;

        final boolean pointerUp = action == MotionEvent.ACTION_POINTER_UP;
        final int skipIndex = pointerUp ? event.getActionIndex() : -1;

        // Determine focal point
        float sumX = 0, sumY = 0;
        final int div = pointerUp ? count - 1 : count;
        final float focusX;
        final float focusY;
        if (inAnchoredScaleMode()) {
            // In anchored scale mode, the focal pt is always where the double tap
            // or button down gesture started
            focusX = mAnchoredScaleStartX;
            focusY = mAnchoredScaleStartY;
            if (event.getY() < focusY) {
                mEventBeforeOrAboveStartingGestureEvent = true;
            } else {
                mEventBeforeOrAboveStartingGestureEvent = false;
            }
        } else {
            for (int i = 0; i < count; i++) {
                if (skipIndex == i) continue;
                sumX += event.getX(i);
                sumY += event.getY(i);
            }

            focusX = sumX / div;
            focusY = sumY / div;
        }

        // Determine average deviation from focal point
        float devSumX = 0, devSumY = 0;
        for (int i = 0; i < count; i++) {
            if (skipIndex == i) continue;

            // Convert the resulting diameter into a radius.
            devSumX += Math.abs(event.getX(i) - focusX);
            devSumY += Math.abs(event.getY(i) - focusY);
        }
        final float devX = devSumX / div;
        final float devY = devSumY / div;

        // Span is the average distance between touch points through the focal point;
        // i.e. the diameter of the circle with a radius of the average deviation from
        // the focal point.
        final float spanX = devX * 2;
        final float spanY = devY * 2;
        final float span;
        if (inAnchoredScaleMode()) {
            span = spanY;
        } else {
            span = (float) Math.hypot(spanX, spanY);
        }

        // Dispatch begin/end events as needed.
        // If the configuration changes, notify the app to reset its current state by beginning
        // a fresh scale event stream.
        final boolean wasInProgress = mInProgress;
        mFocusX = focusX;
        mFocusY = focusY;
        if (!inAnchoredScaleMode() && mInProgress && (span < mMinSpan || configChanged)) {
            mListener.onScaleEnd(this);
            mInProgress = false;
            mInitialSpan = span;
        }
        if (configChanged) {
            mPrevSpanX = mCurrSpanX = spanX;
            mPrevSpanY = mCurrSpanY = spanY;
            mInitialSpan = mPrevSpan = mCurrSpan = span;
        }

        final int minSpan = inAnchoredScaleMode() ? mSpanSlop : mMinSpan;
        if (!mInProgress && span >=  minSpan &&
                (wasInProgress || Math.abs(span - mInitialSpan) > mSpanSlop)) {
            mPrevSpanX = mCurrSpanX = spanX;
            mPrevSpanY = mCurrSpanY = spanY;
            mPrevSpan = mCurrSpan = span;
            mPrevTime = mCurrTime;
            mInProgress = mListener.onScaleBegin(this);
        }

        // Handle motion; focal point and span/scale factor are changing.
        if (action == MotionEvent.ACTION_MOVE) {
            mCurrSpanX = spanX;
            mCurrSpanY = spanY;
            mCurrSpan = span;

            boolean updatePrev = true;

            if (mInProgress) {
                updatePrev = mListener.onScale(this);
            }

            if (updatePrev) {
                mPrevSpanX = mCurrSpanX;
                mPrevSpanY = mCurrSpanY;
                mPrevSpan = mCurrSpan;
                mPrevTime = mCurrTime;
            }
        }

        return true;
    }

    private boolean inAnchoredScaleMode() {
        return mAnchoredScaleMode != ANCHORED_SCALE_MODE_NONE;
    }

    /**
     * Set whether the associated {@link OnScaleGestureListener} should receive onScale callbacks
     * when the user performs a doubleTap followed by a swipe. Note that this is enabled by default
     * if the app targets API 19 and newer.
     * @param scales true to enable quick scaling, false to disable
     */
    public void setQuickScaleEnabled(boolean scales) {
        mQuickScaleEnabled = scales;
        if (mQuickScaleEnabled && mGestureDetector == null) {
            GestureDetector.SimpleOnGestureListener gestureListener =
                    new GestureDetector.SimpleOnGestureListener() {
                        @Override
                        public boolean onDoubleTap(MotionEvent e) {
                            // Double tap: start watching for a swipe
                            mAnchoredScaleStartX = e.getX();
                            mAnchoredScaleStartY = e.getY();
                            mAnchoredScaleMode = ANCHORED_SCALE_MODE_DOUBLE_TAP;
                            return true;
                        }
                    };
            mGestureDetector = new GestureDetector(mContext, gestureListener, mHandler);
        }
    }

    /**
     * Return whether the quick scale gesture, in which the user performs a double tap followed by a
     * swipe, should perform scaling. {@see #setQuickScaleEnabled(boolean)}.
     */
    public boolean isQuickScaleEnabled() {
        return mQuickScaleEnabled;
    }

    /**
     * Sets whether the associates {@link OnScaleGestureListener} should receive
     * onScale callbacks when the user uses a stylus and presses the button.
     * Note that this is enabled by default if the app targets API 23 and newer.
     *
     * @param scales true to enable stylus scaling, false to disable.
     */
    public void setStylusScaleEnabled(boolean scales) {
        mStylusScaleEnabled = scales;
    }

    /**
     * Return whether the stylus scale gesture, in which the user uses a stylus and presses the
     * button, should perform scaling. {@see #setStylusScaleEnabled(boolean)}
     */
    public boolean isStylusScaleEnabled() {
        return mStylusScaleEnabled;
    }

    /**
     * Returns {@code true} if a scale gesture is in progress.
     */
    public boolean isInProgress() {
        return mInProgress;
    }

    /**
     * Get the X coordinate of the current gesture's focal point.
     * If a gesture is in progress, the focal point is between
     * each of the pointers forming the gesture.
     *
     * If {@link #isInProgress()} would return false, the result of this
     * function is undefined.
     *
     * @return X coordinate of the focal point in pixels.
     */
    public float getFocusX() {
        return mFocusX;
    }

    /**
     * Get the Y coordinate of the current gesture's focal point.
     * If a gesture is in progress, the focal point is between
     * each of the pointers forming the gesture.
     *
     * If {@link #isInProgress()} would return false, the result of this
     * function is undefined.
     *
     * @return Y coordinate of the focal point in pixels.
     */
    public float getFocusY() {
        return mFocusY;
    }

    /**
     * Return the average distance between each of the pointers forming the
     * gesture in progress through the focal point.
     *
     * @return Distance between pointers in pixels.
     */
    public float getCurrentSpan() {
        return mCurrSpan;
    }

    /**
     * Return the average X distance between each of the pointers forming the
     * gesture in progress through the focal point.
     *
     * @return Distance between pointers in pixels.
     */
    public float getCurrentSpanX() {
        return mCurrSpanX;
    }

    /**
     * Return the average Y distance between each of the pointers forming the
     * gesture in progress through the focal point.
     *
     * @return Distance between pointers in pixels.
     */
    public float getCurrentSpanY() {
        return mCurrSpanY;
    }

    /**
     * Return the previous average distance between each of the pointers forming the
     * gesture in progress through the focal point.
     *
     * @return Previous distance between pointers in pixels.
     */
    public float getPreviousSpan() {
        return mPrevSpan;
    }

    /**
     * Return the previous average X distance between each of the pointers forming the
     * gesture in progress through the focal point.
     *
     * @return Previous distance between pointers in pixels.
     */
    public float getPreviousSpanX() {
        return mPrevSpanX;
    }

    /**
     * Return the previous average Y distance between each of the pointers forming the
     * gesture in progress through the focal point.
     *
     * @return Previous distance between pointers in pixels.
     */
    public float getPreviousSpanY() {
        return mPrevSpanY;
    }

    /**
     * Return the scaling factor from the previous scale event to the current
     * event. This value is defined as
     * ({@link #getCurrentSpan()} / {@link #getPreviousSpan()}).
     *
     * @return The current scaling factor.
     */
    public float getScaleFactor() {
        if (inAnchoredScaleMode()) {
            // Drag is moving up; the further away from the gesture
            // start, the smaller the span should be, the closer,
            // the larger the span, and therefore the larger the scale
            final boolean scaleUp =
                    (mEventBeforeOrAboveStartingGestureEvent && (mCurrSpan < mPrevSpan)) ||
                            (!mEventBeforeOrAboveStartingGestureEvent && (mCurrSpan > mPrevSpan));
            final float spanDiff = (Math.abs(1 - (mCurrSpan / mPrevSpan)) * SCALE_FACTOR);
            return mPrevSpan <= mSpanSlop ? 1 : scaleUp ? (1 + spanDiff) : (1 - spanDiff);
        }
        return mPrevSpan > 0 ? mCurrSpan / mPrevSpan : 1;
    }

    /**
     * Return the time difference in milliseconds between the previous
     * accepted scaling event and the current scaling event.
     *
     * @return Time difference since the last scaling event in milliseconds.
     */
    public long getTimeDelta() {
        return mCurrTime - mPrevTime;
    }

    /**
     * Return the event time of the current event being processed.
     *
     * @return Current event time in milliseconds.
     */
    public long getEventTime() {
        return mCurrTime;
    }
}
