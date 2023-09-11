/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi48_0_0.com.reactnativecommunity.slider;

import androidx.annotation.Nullable;
import abi48_0_0.com.facebook.react.bridge.Arguments;
import abi48_0_0.com.facebook.react.bridge.WritableMap;
import abi48_0_0.com.facebook.react.uimanager.events.Event;

/**
 * Event emitted when the user starts dragging the slider.
 */

public class ReactSlidingStartEvent extends Event<ReactSlidingStartEvent> {
    public static final String EVENT_NAME = "topSlidingStart";

    private final double mValue;

    public ReactSlidingStartEvent(int viewId, double value) {
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

    @Nullable
    @Override
    protected WritableMap getEventData() {
        return serializeEventData();
    }

    private WritableMap serializeEventData() {
        WritableMap eventData = Arguments.createMap();
        eventData.putInt("target", getViewTag());
        eventData.putDouble("value", getValue());
        return eventData;
    }

}