/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTModalManager.h"

@interface ABI30_0_0RCTModalManager ()

@property BOOL shouldEmit;

@end

@implementation ABI30_0_0RCTModalManager

ABI30_0_0RCT_EXPORT_MODULE();

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
    [self sendEventWithName:@"modalDismissed" body:@{ @"modalID": modalID }];
  }
}

@end
