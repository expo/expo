// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI46_0_0EXScopedReactNativeAdapter.h"
#import "ABI46_0_0EXUnversioned.h"

@interface ABI46_0_0EXReactNativeAdapter (Protected)

- (void)startObserving;

@end

@implementation ABI46_0_0EXScopedReactNativeAdapter

- (void)setBridge:(ABI46_0_0RCTBridge *)bridge
{
  if (bridge) {
    [super setBridge:bridge];
    [self setAppStateToForeground];
  }
}

- (void)startObserving
{
  // ABI46_0_0EXAppState and ABI46_0_0EXKernel handle this for us
}

@end
