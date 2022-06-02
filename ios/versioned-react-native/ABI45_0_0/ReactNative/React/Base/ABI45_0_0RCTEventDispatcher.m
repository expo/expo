/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTEventDispatcherProtocol.h"

const NSInteger ABI45_0_0RCTTextUpdateLagWarningThreshold = 3;

NSString *ABI45_0_0RCTNormalizeInputEventName(NSString *eventName)
{
  if ([eventName hasPrefix:@"on"]) {
    eventName = [eventName stringByReplacingCharactersInRange:(NSRange){0, 2} withString:@"top"];
  } else if (![eventName hasPrefix:@"top"]) {
    eventName = [[@"top" stringByAppendingString:[eventName substringToIndex:1].uppercaseString]
        stringByAppendingString:[eventName substringFromIndex:1]];
  }
  return eventName;
}

@implementation ABI45_0_0RCTBridge (ABI45_0_0RCTEventDispatcher)

- (id<ABI45_0_0RCTEventDispatcherProtocol>)eventDispatcher
{
  return [self moduleForName:@"EventDispatcher" lazilyLoadIfNecessary:YES];
}

@end
