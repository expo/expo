/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTEventEmitter.h"
#import "ABI7_0_0RCTAssert.h"
#import "ABI7_0_0RCTLog.h"

@implementation ABI7_0_0RCTEventEmitter
{
  NSInteger _listenerCount;
}

+ (NSString *)moduleName
{
  return @"";
}

- (NSArray<NSString *> *)supportedEvents
{
  ABI7_0_0RCTAssert(NO, @"You must override the `supportedEvents` method of %@", [self class]);
  return nil;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  ABI7_0_0RCTAssert(_bridge != nil, @"bridge is not set.");

  if (ABI7_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI7_0_0RCTLogError(@"`%@` is not a supported event type for %@", eventName, [self class]);
  }
  if (_listenerCount > 0) {
    [_bridge enqueueJSCall:@"ABI7_0_0RCTDeviceEventEmitter.emit"
                      args:body ? @[eventName, body] : @[eventName]];
  } else {
    ABI7_0_0RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
  }
}

- (void)startObserving
{
  // Does nothing
}

- (void)stopObserving
{
  // Does nothing
}

- (void)dealloc
{
  if (_listenerCount > 0) {
    [self stopObserving];
  }
}

ABI7_0_0RCT_EXPORT_METHOD(addListener:(NSString *)eventName)
{
  if (ABI7_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI7_0_0RCTLogError(@"`%@` is not a supported event type for %@", eventName, [self class]);
  }
  if (_listenerCount == 0) {
    [self startObserving];
  }
  _listenerCount++;
}

ABI7_0_0RCT_EXPORT_METHOD(removeListeners:(NSInteger)count)
{
  if (ABI7_0_0RCT_DEBUG && count > _listenerCount) {
    ABI7_0_0RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  if (count == _listenerCount) {
    [self stopObserving];
  }
  _listenerCount -= count;
}

@end
