/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi28_0_0.host.exp.exponent.modules.api.components.svg;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Point;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;

import abi28_0_0.com.facebook.react.ReactRootView;
import abi28_0_0.com.facebook.react.bridge.ReactContext;
import abi28_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi28_0_0.com.facebook.react.uimanager.events.TouchEvent;
import abi28_0_0.com.facebook.react.uimanager.events.TouchEventCoalescingKeyHelper;
import abi28_0_0.com.facebook.react.uimanager.events.TouchEventType;
import abi28_0_0.com.facebook.react.uimanager.events.EventDispatcher;

import javax.annotation.Nullable;

/**
 * Custom {@link View} implementation that draws an RNSVGSvg React view and its \childrn.
 */
@SuppressLint("ViewConstructor")
public class SvgView extends View {
    public enum Events {
        @SuppressWarnings("unused")
        EVENT_DATA_URL("onDataURL");

        private final String mName;

        @SuppressWarnings({"unused", "SameParameterValue"})
        Events(final String name) {
            mName = name;
        }

        @Override
        public String toString() {
            return mName;
        }
    }

    private @Nullable Bitmap mBitmap;
    private final EventDispatcher mEventDispatcher;
    private long mGestureStartTime = TouchEvent.UNSET;
    private int mTargetTag;

    private final TouchEventCoalescingKeyHelper mTouchEventCoalescingKeyHelper =
            new TouchEventCoalescingKeyHelper();

    public SvgView(ReactContext reactContext) {
        super(reactContext);
        mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    }

    @Override
    public void setId(int id) {
        super.setId(id);
        SvgViewManager.setSvgView(this);
    }

    public void setBitmap(Bitmap bitmap) {
        if (mBitmap != null) {
            mBitmap.recycle();
        }
        mBitmap = bitmap;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (mBitmap != null) {
            canvas.drawBitmap(mBitmap, 0, 0, null);
        }
    }

    private SvgViewShadowNode getShadowNode() {
        return SvgViewManager.getShadowNodeByTag(getId());
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        mTargetTag = getShadowNode().hitTest(new Point((int) ev.getX(), (int) ev.getY()));

        if (mTargetTag != -1) {
            handleTouchEvent(ev);
            return true;
        }

        return super.dispatchTouchEvent(ev);
    }

    private int getAbsoluteLeft(View view) {
        int left = view.getLeft() - view.getScrollX();

        if (view.getParent() == view.getRootView() || view.getParent() instanceof ReactRootView) {
            return left;
        }

        View parent = (View) view.getParent();
        return left + getAbsoluteLeft(parent);
    }

    private int getAbsoluteTop(View view) {
        int top = view.getTop() - view.getScrollY();

        if (view.getParent() == view.getRootView() || view.getParent() instanceof ReactRootView) {
            return top;
        }

        View parent = (View) view.getParent();
        return top + getAbsoluteTop(parent);
    }

    private void dispatch(MotionEvent ev, TouchEventType type) {
        ev.offsetLocation(getAbsoluteLeft(this), getAbsoluteTop(this));
        mEventDispatcher.dispatchEvent(
            TouchEvent.obtain(
                mTargetTag,
                type,
                ev,
                mGestureStartTime,
                ev.getX(),
                ev.getY(),
                mTouchEventCoalescingKeyHelper));
    }

    private void handleTouchEvent(MotionEvent ev) {
        int action = ev.getAction() & MotionEvent.ACTION_MASK;
        if (action == MotionEvent.ACTION_DOWN) {
            mGestureStartTime = ev.getEventTime();
            dispatch(ev, TouchEventType.START);
        } else if (mTargetTag == -1) {
            // All the subsequent action types are expected to be called after ACTION_DOWN thus target
            // is supposed to be set for them.
            Log.e(
                "error",
                "Unexpected state: received touch event but didn't get starting ACTION_DOWN for this " +
                    "gesture before");
        } else if (action == MotionEvent.ACTION_UP) {
            // End of the gesture. We reset target tag to -1 and expect no further event associated with
            // this gesture.
            dispatch(ev, TouchEventType.END);
            mTargetTag = -1;
            mGestureStartTime = TouchEvent.UNSET;
        } else if (action == MotionEvent.ACTION_MOVE) {
            // Update pointer position for current gesture
            dispatch(ev, TouchEventType.MOVE);
        } else if (action == MotionEvent.ACTION_POINTER_DOWN) {
            // New pointer goes down, this can only happen after ACTION_DOWN is sent for the first pointer
            dispatch(ev, TouchEventType.START);
        } else if (action == MotionEvent.ACTION_POINTER_UP) {
            // Exactly onw of the pointers goes up
            dispatch(ev, TouchEventType.END);
        } else if (action == MotionEvent.ACTION_CANCEL) {
            dispatchCancelEvent(ev);
            mTargetTag = -1;
            mGestureStartTime = TouchEvent.UNSET;
        } else {
            Log.w(
                "IGNORE",
                "Warning : touch event was ignored. Action=" + action + " Target=" + mTargetTag);
        }
    }

    private void dispatchCancelEvent(MotionEvent ev) {
        // This means the gesture has already ended, via some other CANCEL or UP event. This is not
        // expected to happen very often as it would mean some child View has decided to intercept the
        // touch stream and start a native gesture only upon receiving the UP/CANCEL event.
        if (mTargetTag == -1) {
            Log.w(
                "error",
                "Can't cancel already finished gesture. Is a child View trying to start a gesture from " +
                    "an UP/CANCEL event?");
            return;
        }

        dispatch(ev, TouchEventType.CANCEL);
    }
}
