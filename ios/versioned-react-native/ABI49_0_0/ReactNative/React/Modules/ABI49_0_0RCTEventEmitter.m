/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTEventEmitter.h"
#import <ABI49_0_0React/ABI49_0_0RCTConstants.h>
#import "ABI49_0_0RCTAssert.h"
#import "ABI49_0_0RCTLog.h"
#import "ABI49_0_0RCTUtils.h"

@implementation ABI49_0_0RCTEventEmitter {
  NSInteger _listenerCount;
  BOOL _observationDisabled;
}

@synthesize callableJSModules = _callableJSModules;

+ (NSString *)moduleName
{
  return @"";
}

- (instancetype)initWithDisabledObservation
{
  self = [super init];
  _observationDisabled = YES;
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  NSString *message =
      [NSString stringWithFormat:@"%@ must implement the supportedEvents method", NSStringFromClass(self.class)];
  [self _log:message];
  return nil;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  // Assert that subclasses of ABI49_0_0RCTEventEmitter does not have `@synthesize _callableJSModules`
  // which would cause _callableJSModules in the parent ABI49_0_0RCTEventEmitter to be nil.
  ABI49_0_0RCTAssert(
      _callableJSModules != nil,
      @"Error when sending event: %@ with body: %@. "
       "ABI49_0_0RCTCallableJSModules is not set. This is probably because you've "
       "explicitly synthesized the ABI49_0_0RCTCallableJSModules in %@, even though it's inherited "
       "from ABI49_0_0RCTEventEmitter.",
      eventName,
      body,
      [self class]);

  if (ABI49_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI49_0_0RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }

  BOOL shouldEmitEvent = (_observationDisabled || _listenerCount > 0);

  if (shouldEmitEvent && _callableJSModules) {
    [_callableJSModules invokeModule:@"ABI49_0_0RCTDeviceEventEmitter"
                              method:@"emit"
                            withArgs:body ? @[ eventName, body ] : @[ eventName ]];
  } else {
    ABI49_0_0RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
  }
}

/* TODO: (T118587955) Remove canSendEvents_DEPRECATED and validate ABI49_0_0RCTEventEmitter does not fail
 * ABI49_0_0RCTAssert in _callableJSModules when the ABI49_0_0React Native instance is invalidated.
 */
- (BOOL)canSendEvents_DEPRECATED
{
  bool canSendEvents = _callableJSModules != nil;
  if (!canSendEvents && ABI49_0_0RCTGetValidateCanSendEventInABI49_0_0RCTEventEmitter()) {
    ABI49_0_0RCTLogError(@"Trying to send event when _callableJSModules is nil.");
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

ABI49_0_0RCT_EXPORT_METHOD(addListener : (NSString *)eventName)
{
  if (_observationDisabled) {
    return;
  }

  if (ABI49_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI49_0_0RCTLogError(
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

ABI49_0_0RCT_EXPORT_METHOD(removeListeners : (double)count)
{
  if (_observationDisabled) {
    return;
  }

  int currentCount = (int)count;
  if (ABI49_0_0RCT_DEBUG && currentCount > _listenerCount) {
    ABI49_0_0RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  _listenerCount = MAX(_listenerCount - currentCount, 0);
  if (_listenerCount == 0) {
    [self stopObserving];
  }
}

#pragma mark - Test utilities

// For testing purposes only.
// This is supposed to be overridden by a subclass in the Tests
// to verified that the error message is actually emitted.
// This is the less intrusive way found to mock the ABI49_0_0RCTLogError function in unit tests.
- (void)_log:(NSString *)message
{
  ABI49_0_0RCTLogError(@"%@", message);
}

@end
