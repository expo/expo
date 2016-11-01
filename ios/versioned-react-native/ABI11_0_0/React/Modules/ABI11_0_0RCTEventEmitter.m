/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTEventEmitter.h"
#import "ABI11_0_0RCTAssert.h"
#import "ABI11_0_0RCTUtils.h"
#import "ABI11_0_0RCTLog.h"

@implementation ABI11_0_0RCTEventEmitter
{
  NSInteger _listenerCount;
}

+ (NSString *)moduleName
{
  return @"";
}

+ (void)initialize
{
  if (self != [ABI11_0_0RCTEventEmitter class]) {
    ABI11_0_0RCTAssert(ABI11_0_0RCTClassOverridesInstanceMethod(self, @selector(supportedEvents)),
              @"You must override the `supportedEvents` method of %@", self);
  }
}

- (NSArray<NSString *> *)supportedEvents
{
  return nil;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  ABI11_0_0RCTAssert(_bridge != nil, @"bridge is not set. This is probably because you've "
            "explicitly synthesized the bridge in %@, even though it's inherited "
            "from ABI11_0_0RCTEventEmitter.", [self class]);

  if (ABI11_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI11_0_0RCTLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
                eventName, [self class], [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  if (_listenerCount > 0) {
    [_bridge enqueueJSCall:@"ABI11_0_0RCTDeviceEventEmitter"
                    method:@"emit"
                      args:body ? @[eventName, body] : @[eventName]
                completion:NULL];
  } else {
    ABI11_0_0RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
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

ABI11_0_0RCT_EXPORT_METHOD(addListener:(NSString *)eventName)
{
  if (ABI11_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI11_0_0RCTLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
                eventName, [self class], [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  if (_listenerCount == 0) {
    [self startObserving];
  }
  _listenerCount++;
}

ABI11_0_0RCT_EXPORT_METHOD(removeListeners:(NSInteger)count)
{
  if (ABI11_0_0RCT_DEBUG && count > _listenerCount) {
    ABI11_0_0RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  if (count == _listenerCount) {
    [self stopObserving];
  }
  _listenerCount -= count;
}

@end
