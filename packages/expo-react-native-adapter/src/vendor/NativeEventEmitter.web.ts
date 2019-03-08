/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule NativeEventEmitter
 * @flow
 */
'use strict';
import invariant from 'fbjs/lib/invariant';

import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
import RCTDeviceEventEmitter from './RCTDeviceEventEmitter.web';

/**
 * Abstract base class for implementing event-emitting modules. This implements
 * a subset of the standard EventEmitter node module API.
 */
class NativeEventEmitter extends EventEmitter {
  _nativeModule?: any;

  constructor(nativeModule?: any) {
    super(RCTDeviceEventEmitter.sharedSubscriber);
  }

  addListener(eventType: string, listener: (...props: any[]) => any, context?: any): any {
    if (this._nativeModule != null) {
      this._nativeModule.addListener(eventType);
    }
    return super.addListener(eventType, listener, context);
  }

  removeAllListeners(eventType: string) {
    invariant(eventType, 'eventType argument is required.');
    const count = (this as any).listeners(eventType).length;
    if (this._nativeModule != null) {
      this._nativeModule.removeListeners(count);
    }
    super.removeAllListeners(eventType);
  }

  removeSubscription(subscription) {
    if (this._nativeModule != null) {
      this._nativeModule.removeListeners(1);
    }
    super.removeSubscription(subscription);
  }
}

export default NativeEventEmitter;
