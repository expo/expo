/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTEventEmitter.h"
#import <ABI47_0_0React/ABI47_0_0RCTConstants.h>
#import "ABI47_0_0RCTAssert.h"
#import "ABI47_0_0RCTLog.h"
#import "ABI47_0_0RCTUtils.h"

@implementation ABI47_0_0RCTEventEmitter {
  NSInteger _listenerCount;
  BOOL _observationDisabled;
}

@synthesize callableJSModules = _callableJSModules;

+ (NSString *)moduleName
{
  return @"";
}

+ (void)initialize
{
  [super initialize];
  if (self != [ABI47_0_0RCTEventEmitter class]) {
    ABI47_0_0RCTAssert(
        ABI47_0_0RCTClassOverridesInstanceMethod(self, @selector(supportedEvents)),
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
  // Assert that subclasses of ABI47_0_0RCTEventEmitter does not have `@synthesize _callableJSModules`
  // which would cause _callableJSModules in the parent ABI47_0_0RCTEventEmitter to be nil.
  ABI47_0_0RCTAssert(
      _callableJSModules != nil,
      @"Error when sending event: %@ with body: %@. "
       "ABI47_0_0RCTCallableJSModules is not set. This is probably because you've "
       "explicitly synthesized the ABI47_0_0RCTCallableJSModules in %@, even though it's inherited "
       "from ABI47_0_0RCTEventEmitter.",
      eventName,
      body,
      [self class]);

  if (ABI47_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI47_0_0RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }

  BOOL shouldEmitEvent = (_observationDisabled || _listenerCount > 0);

  if (shouldEmitEvent && _callableJSModules) {
    [_callableJSModules invokeModule:@"ABI47_0_0RCTDeviceEventEmitter"
                              method:@"emit"
                            withArgs:body ? @[ eventName, body ] : @[ eventName ]];
  } else {
    ABI47_0_0RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
  }
}

/* TODO: (T118587955) Remove canSendEvents_DEPRECATED and validate ABI47_0_0RCTEventEmitter does not fail
 * ABI47_0_0RCTAssert in _callableJSModules when the ABI47_0_0React Native instance is invalidated.
 */
- (BOOL)canSendEvents_DEPRECATED
{
  bool canSendEvents = _callableJSModules != nil;
  if (!canSendEvents && ABI47_0_0RCTGetValidateCanSendEventInABI47_0_0RCTEventEmitter()) {
    ABI47_0_0RCTLogError(@"Trying to send event when _callableJSModules is nil.");
  }
  return canSendEvents;
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

ABI47_0_0RCT_EXPORT_METHOD(addListener : (NSString *)eventName)
{
  if (_observationDisabled) {
    return;
  }

  if (ABI47_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI47_0_0RCTLogError(
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

ABI47_0_0RCT_EXPORT_METHOD(removeListeners : (double)count)
{
  if (_observationDisabled) {
    return;
  }

  int currentCount = (int)count;
  if (ABI47_0_0RCT_DEBUG && currentCount > _listenerCount) {
    ABI47_0_0RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  _listenerCount = MAX(_listenerCount - currentCount, 0);
  if (_listenerCount == 0) {
    [self stopObserving];
  }
}

@end
