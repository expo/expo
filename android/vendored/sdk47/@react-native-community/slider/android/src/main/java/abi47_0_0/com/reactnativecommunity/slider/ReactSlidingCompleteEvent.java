/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi47_0_0.com.reactnativecommunity.slider;

import abi47_0_0.com.facebook.react.bridge.Arguments;
import abi47_0_0.com.facebook.react.bridge.WritableMap;
import abi47_0_0.com.facebook.react.uimanager.events.Event;
import abi47_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted when the user finishes dragging the slider.
 */
public class ReactSlidingCompleteEvent extends Event<ReactSlidingCompleteEvent> {

    public static final String EVENT_NAME = "topSlidingComplete";

    private final double mValue;

    public ReactSlidingCompleteEvent(int viewId, double value) {
        super(viewId);
        mValue = value;
    }

    public double getValue() {
        return mValue;
    }

    @Override
    public String getEventName() {
        return EVENT_NAME;
    }

    @Override
    public short getCoalescingKey() {
        return 0;
    }

    @Override
    public boolean canCoalesce() {
        return false;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
    }

    private WritableMap serializeEventData() {
        WritableMap eventData = Arguments.createMap();
        eventData.putInt("target", getViewTag());
        eventData.putDouble("value", getValue());
        return eventData;
    }

}
