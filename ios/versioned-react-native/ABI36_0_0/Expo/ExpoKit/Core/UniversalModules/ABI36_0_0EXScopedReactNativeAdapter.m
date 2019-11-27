// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI36_0_0EXScopedReactNativeAdapter.h"
#import "ABI36_0_0EXUnversioned.h"

@interface ABI36_0_0UMReactNativeAdapter (Protected)

- (void)startObserving;

@end

@implementation ABI36_0_0EXScopedReactNativeAdapter

- (void)setBridge:(ABI36_0_0RCTBridge *)bridge
{
  if (bridge) {
    [super setBridge:bridge];
    [self setAppStateToForeground];
  }
}

- (void)startObserving
{
  // ABI36_0_0EXAppState and ABI36_0_0EXKernel handle this for us
}

@end
