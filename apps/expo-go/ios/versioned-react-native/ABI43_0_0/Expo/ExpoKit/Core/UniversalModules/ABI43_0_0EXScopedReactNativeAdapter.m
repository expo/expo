// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI43_0_0EXScopedReactNativeAdapter.h"
#import "ABI43_0_0EXUnversioned.h"

@interface ABI43_0_0EXReactNativeAdapter (Protected)

- (void)startObserving;

@end

@implementation ABI43_0_0EXScopedReactNativeAdapter

- (void)setBridge:(ABI43_0_0RCTBridge *)bridge
{
  if (bridge) {
    [super setBridge:bridge];
    [self setAppStateToForeground];
  }
}

- (void)startObserving
{
  // ABI43_0_0EXAppState and ABI43_0_0EXKernel handle this for us
}

@end
