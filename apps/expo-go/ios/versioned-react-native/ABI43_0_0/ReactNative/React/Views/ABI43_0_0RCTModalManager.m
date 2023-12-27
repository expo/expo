/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTModalManager.h"

@interface ABI43_0_0RCTModalManager ()

@property BOOL shouldEmit;

@end

@implementation ABI43_0_0RCTModalManager

ABI43_0_0RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"modalDismissed" ];
}

- (void)startObserving
{
  _shouldEmit = YES;
}

- (void)stopObserving
{
  _shouldEmit = NO;
}

- (void)modalDismissed:(NSNumber *)modalID
{
  if (_shouldEmit) {
    [self sendEventWithName:@"modalDismissed" body:@{@"modalID" : modalID}];
  }
}

@end
