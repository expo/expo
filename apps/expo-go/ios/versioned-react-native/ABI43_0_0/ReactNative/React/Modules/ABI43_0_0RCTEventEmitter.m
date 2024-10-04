/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTEventEmitter.h"
#import "ABI43_0_0RCTAssert.h"
#import "ABI43_0_0RCTLog.h"
#import "ABI43_0_0RCTUtils.h"

@implementation ABI43_0_0RCTEventEmitter {
  NSInteger _listenerCount;
  BOOL _observationDisabled;
}

@synthesize invokeJS = _invokeJS;

+ (NSString *)moduleName
{
  return @"";
}

+ (void)initialize
{
  [super initialize];
  if (self != [ABI43_0_0RCTEventEmitter class]) {
    ABI43_0_0RCTAssert(
        ABI43_0_0RCTClassOverridesInstanceMethod(self, @selector(supportedEvents)),
        @"You must override the `supportedEvents` method of %@",
        self);
  }
}

- (instancetype)initWithDisabledObservation
{
  self = [super init];
  _observationDisabled = YES;
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return nil;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  ABI43_0_0RCTAssert(
      _bridge != nil || _invokeJS != nil,
      @"Error when sending event: %@ with body: %@. "
       "Bridge is not set. This is probably because you've "
       "explicitly synthesized the bridge in %@, even though it's inherited "
       "from ABI43_0_0RCTEventEmitter.",
      eventName,
      body,
      [self class]);

  if (ABI43_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI43_0_0RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }

  BOOL shouldEmitEvent = (_observationDisabled || _listenerCount > 0);

  if (shouldEmitEvent && _bridge) {
    [_bridge enqueueJSCall:@"ABI43_0_0RCTDeviceEventEmitter"
                    method:@"emit"
                      args:body ? @[ eventName, body ] : @[ eventName ]
                completion:NULL];
  } else if (shouldEmitEvent && _invokeJS) {
    _invokeJS(@"ABI43_0_0RCTDeviceEventEmitter", @"emit", body ? @[ eventName, body ] : @[ eventName ]);
  } else {
    ABI43_0_0RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
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

- (void)invalidate
{
  if (_observationDisabled) {
    return;
  }

  if (_listenerCount > 0) {
    [self stopObserving];
  }
}

ABI43_0_0RCT_EXPORT_METHOD(addListener : (NSString *)eventName)
{
  if (_observationDisabled) {
    return;
  }

  if (ABI43_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI43_0_0RCTLogError(
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

ABI43_0_0RCT_EXPORT_METHOD(removeListeners : (double)count)
{
  if (_observationDisabled) {
    return;
  }

  int currentCount = (int)count;
  if (ABI43_0_0RCT_DEBUG && currentCount > _listenerCount) {
    ABI43_0_0RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  _listenerCount = MAX(_listenerCount - currentCount, 0);
  if (_listenerCount == 0) {
    [self stopObserving];
  }
}

@end
