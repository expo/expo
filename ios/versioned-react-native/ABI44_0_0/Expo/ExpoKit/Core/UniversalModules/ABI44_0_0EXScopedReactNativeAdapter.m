// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI44_0_0EXScopedReactNativeAdapter.h"
#import "ABI44_0_0EXUnversioned.h"

@interface ABI44_0_0EXReactNativeAdapter (Protected)

- (void)startObserving;

@end

@implementation ABI44_0_0EXScopedReactNativeAdapter

- (void)setBridge:(ABI44_0_0RCTBridge *)bridge
{
  if (bridge) {
    [super setBridge:bridge];
    [self setAppStateToForeground];
  }
}

- (void)startObserving
{
  // ABI44_0_0EXAppState and ABI44_0_0EXKernel handle this for us
}

@end
