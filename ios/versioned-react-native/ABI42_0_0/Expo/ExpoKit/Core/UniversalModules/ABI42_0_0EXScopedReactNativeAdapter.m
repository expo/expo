// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI42_0_0EXScopedReactNativeAdapter.h"
#import "ABI42_0_0EXUnversioned.h"

@interface ABI42_0_0UMReactNativeAdapter (Protected)

- (void)startObserving;

@end

@implementation ABI42_0_0EXScopedReactNativeAdapter

- (void)setBridge:(ABI42_0_0RCTBridge *)bridge
{
  if (bridge) {
    [super setBridge:bridge];
    [self setAppStateToForeground];
  }
}

- (void)startObserving
{
  // ABI42_0_0EXAppState and ABI42_0_0EXKernel handle this for us
}

@end
