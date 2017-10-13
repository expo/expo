/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTEventEmitter.h"
#import "ABI22_0_0RCTAssert.h"
#import "ABI22_0_0RCTUtils.h"
#import "ABI22_0_0RCTLog.h"

@implementation ABI22_0_0RCTEventEmitter
{
  NSInteger _listenerCount;
}

+ (NSString *)moduleName
{
  return @"";
}

+ (void)initialize
{
  if (self != [ABI22_0_0RCTEventEmitter class]) {
    ABI22_0_0RCTAssert(ABI22_0_0RCTClassOverridesInstanceMethod(self, @selector(supportedEvents)),
              @"You must override the `supportedEvents` method of %@", self);
  }
}

- (NSArray<NSString *> *)supportedEvents
{
  return nil;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  ABI22_0_0RCTAssert(_bridge != nil, @"bridge is not set. This is probably because you've "
            "explicitly synthesized the bridge in %@, even though it's inherited "
            "from ABI22_0_0RCTEventEmitter.", [self class]);

  if (ABI22_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI22_0_0RCTLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
                eventName, [self class], [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  if (_listenerCount > 0) {
    [_bridge enqueueJSCall:@"ABI22_0_0RCTDeviceEventEmitter"
                    method:@"emit"
                      args:body ? @[eventName, body] : @[eventName]
                completion:NULL];
  } else {
    ABI22_0_0RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
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

ABI22_0_0RCT_EXPORT_METHOD(addListener:(NSString *)eventName)
{
  if (ABI22_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI22_0_0RCTLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
                eventName, [self class], [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  _listenerCount++;
  if (_listenerCount == 1) {
    [self startObserving];
  }
}

ABI22_0_0RCT_EXPORT_METHOD(removeListeners:(NSInteger)count)
{
  if (ABI22_0_0RCT_DEBUG && count > _listenerCount) {
    ABI22_0_0RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  _listenerCount = MAX(_listenerCount - count, 0);
  if (_listenerCount == 0) {
    [self stopObserving];
  }
}

@end
