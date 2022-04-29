/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTEventEmitter.h"
#import "ABI45_0_0RCTAssert.h"
#import "ABI45_0_0RCTLog.h"
#import "ABI45_0_0RCTUtils.h"

@implementation ABI45_0_0RCTEventEmitter {
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
  if (self != [ABI45_0_0RCTEventEmitter class]) {
    ABI45_0_0RCTAssert(
        ABI45_0_0RCTClassOverridesInstanceMethod(self, @selector(supportedEvents)),
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
  ABI45_0_0RCTAssert(
      _callableJSModules != nil,
      @"Error when sending event: %@ with body: %@. "
       "ABI45_0_0RCTCallableJSModules is not set. This is probably because you've "
       "explicitly synthesized the ABI45_0_0RCTCallableJSModules in %@, even though it's inherited "
       "from ABI45_0_0RCTEventEmitter.",
      eventName,
      body,
      [self class]);

  if (ABI45_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI45_0_0RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }

  BOOL shouldEmitEvent = (_observationDisabled || _listenerCount > 0);

  if (shouldEmitEvent && _callableJSModules) {
    [_callableJSModules invokeModule:@"ABI45_0_0RCTDeviceEventEmitter"
                              method:@"emit"
                            withArgs:body ? @[ eventName, body ] : @[ eventName ]];
  } else {
    ABI45_0_0RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
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

ABI45_0_0RCT_EXPORT_METHOD(addListener : (NSString *)eventName)
{
  if (_observationDisabled) {
    return;
  }

  if (ABI45_0_0RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    ABI45_0_0RCTLogError(
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

ABI45_0_0RCT_EXPORT_METHOD(removeListeners : (double)count)
{
  if (_observationDisabled) {
    return;
  }

  int currentCount = (int)count;
  if (ABI45_0_0RCT_DEBUG && currentCount > _listenerCount) {
    ABI45_0_0RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  _listenerCount = MAX(_listenerCount - currentCount, 0);
  if (_listenerCount == 0) {
    [self stopObserving];
  }
}

@end
