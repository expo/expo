/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTTVNavigationEventEmitter.h"

NSString *const ABI37_0_0RCTTVNavigationEventNotification = @"ABI37_0_0RCTTVNavigationEventNotification";

static NSString *const TVNavigationEventName = @"onHWKeyEvent";

@implementation ABI37_0_0RCTTVNavigationEventEmitter

ABI37_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleTVNavigationEventNotification:)
                                                 name:ABI37_0_0RCTTVNavigationEventNotification
                                               object:nil];

  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[TVNavigationEventName];
}

- (void)handleTVNavigationEventNotification:(NSNotification *)notif
{
  if (self.bridge) {
    [self sendEventWithName:TVNavigationEventName body:notif.object];
  }
}

@end
