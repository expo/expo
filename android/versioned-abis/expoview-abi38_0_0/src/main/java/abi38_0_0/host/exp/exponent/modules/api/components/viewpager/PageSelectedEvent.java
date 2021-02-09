/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi38_0_0.host.exp.exponent.modules.api.components.viewpager;

import abi38_0_0.com.facebook.react.bridge.Arguments;
import abi38_0_0.com.facebook.react.bridge.WritableMap;
import abi38_0_0.com.facebook.react.uimanager.events.Event;
import abi38_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by {@link ReactViewPager} when selected page changes.
 *
 * Additional data provided by this event:
 *  - position - index of page that has been selected
 */
/* package */ class PageSelectedEvent extends Event<PageSelectedEvent> {

  public static final String EVENT_NAME = "topPageSelected";

  private final int mPosition;

  protected PageSelectedEvent(int viewTag, int position) {
    super(viewTag);
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
