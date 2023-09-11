/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi47_0_0.host.exp.exponent.modules.api.components.picker;

import abi47_0_0.com.facebook.react.bridge.Arguments;
import abi47_0_0.com.facebook.react.bridge.WritableMap;
import abi47_0_0.com.facebook.react.uimanager.events.Event;
import abi47_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

public class PickerItemSelectEvent extends Event<PickerItemSelectEvent> {
  public static final String EVENT_NAME = "topSelect";

  private final int mPosition;

  public PickerItemSelectEvent(int id, int position) {
    super(id);
    mPosition = position;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("position", mPosition);
    return eventData;
  }
}
