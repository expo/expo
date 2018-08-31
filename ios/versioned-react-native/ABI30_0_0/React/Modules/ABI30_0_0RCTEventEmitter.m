/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTEventEmitter.h"
#import "ABI30_0_0RCTAssert.h"
#import "ABI30_0_0RCTUtils.h"
#import "ABI30_0_0RCTLog.h"

@implementation ABI30_0_0RCTEventEmitter
{
  NSInteger _listenerCount;
}

+ (NSString *)moduleName
{
  return @"";
}

+ (void)initialize
{
  if (self != [ABI30_0_0RCTEventEmitter class]) {
    ABI30_0_0RCTAssert(ABI30_0_0RCTClassOverridesInstanceMethod(self, @selector(supportedEvents)),
              @"You must override the `supportedEvents` method of %@", self);
  }
}

- (NSArray<NSString *> *)supportedEvents
{
  return nil;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  ABI30_0_0RCTAssert(_bridge != nil, @"Error when sending event: %@ with body: %@. "
            "Bridge is not set. This is probably because you've "
            "explicitly synthesized the bridge in %@, even though it's inherited "
            "from ABI30_0_0RCTEventEmitter.", eventName, body, [self class]);

  if (ABI30_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI30_0_0RCTLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
                eventName, [self class], [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  if (_listenerCount > 0) {
    [_bridge enqueueJSCall:@"ABI30_0_0RCTDeviceEventEmitter"
                    method:@"emit"
                      args:body ? @[eventName, body] : @[eventName]
                completion:NULL];
  } else {
    ABI30_0_0RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
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

ABI30_0_0RCT_EXPORT_METHOD(addListener:(NSString *)eventName)
{
  if (ABI30_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI30_0_0RCTLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
                eventName, [self class], [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  _listenerCount++;
  if (_listenerCount == 1) {
    [self startObserving];
  }
}

ABI30_0_0RCT_EXPORT_METHOD(removeListeners:(double)count)
{
  int currentCount = (int)count;
  if (ABI30_0_0RCT_DEBUG && currentCount > _listenerCount) {
    ABI30_0_0RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  _listenerCount = MAX(_listenerCount - currentCount, 0);
  if (_listenerCount == 0) {
    [self stopObserving];
  }
}

@end
