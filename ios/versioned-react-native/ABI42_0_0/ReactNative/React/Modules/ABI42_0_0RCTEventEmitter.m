/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTEventEmitter.h"
#import "ABI42_0_0RCTAssert.h"
#import "ABI42_0_0RCTLog.h"
#import "ABI42_0_0RCTUtils.h"

@implementation ABI42_0_0RCTEventEmitter {
  NSInteger _listenerCount;
}

@synthesize invokeJS = _invokeJS;

+ (NSString *)moduleName
{
  return @"";
}

+ (void)initialize
{
  [super initialize];
  if (self != [ABI42_0_0RCTEventEmitter class]) {
    ABI42_0_0RCTAssert(
        ABI42_0_0RCTClassOverridesInstanceMethod(self, @selector(supportedEvents)),
        @"You must override the `supportedEvents` method of %@",
        self);
  }
}

- (NSArray<NSString *> *)supportedEvents
{
  return nil;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  ABI42_0_0RCTAssert(
      _bridge != nil || _invokeJS != nil,
      @"Error when sending event: %@ with body: %@. "
       "Bridge is not set. This is probably because you've "
       "explicitly synthesized the bridge in %@, even though it's inherited "
       "from ABI42_0_0RCTEventEmitter.",
      eventName,
      body,
      [self class]);

  if (ABI42_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI42_0_0RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  if (_listenerCount > 0 && _bridge) {
    [_bridge enqueueJSCall:@"ABI42_0_0RCTDeviceEventEmitter"
                    method:@"emit"
                      args:body ? @[ eventName, body ] : @[ eventName ]
                completion:NULL];
  } else if (_listenerCount > 0 && _invokeJS) {
    _invokeJS(@"ABI42_0_0RCTDeviceEventEmitter", @"emit", body ? @[ eventName, body ] : @[ eventName ]);
  } else {
    ABI42_0_0RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
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

ABI42_0_0RCT_EXPORT_METHOD(addListener : (NSString *)eventName)
{
  if (ABI42_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI42_0_0RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  _listenerCount++;
  if (_listenerCount == 1) {
    [self startObserving];
  }
}

ABI42_0_0RCT_EXPORT_METHOD(removeListeners : (double)count)
{
  int currentCount = (int)count;
  if (ABI42_0_0RCT_DEBUG && currentCount > _listenerCount) {
    ABI42_0_0RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  _listenerCount = MAX(_listenerCount - currentCount, 0);
  if (_listenerCount == 0) {
    [self stopObserving];
  }
}

@end
