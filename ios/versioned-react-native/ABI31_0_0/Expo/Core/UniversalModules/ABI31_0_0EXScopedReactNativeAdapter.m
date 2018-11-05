// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI31_0_0EXScopedReactNativeAdapter.h"
#import "ABI31_0_0EXUnversioned.h"

@interface ABI31_0_0EXReactNativeAdapter (Protected)

- (void)handleAppStateDidChange:(NSNotification *)notification;

@end

@interface ABI31_0_0EXScopedReactNativeAdapter ()

// property inherited from ABI31_0_0EXReactNativeAdapter
@property (nonatomic, assign) BOOL isForegrounded;

@end

@implementation ABI31_0_0EXScopedReactNativeAdapter

@dynamic isForegrounded;

- (void)setBridge:(ABI31_0_0RCTBridge *)bridge
{
  if (bridge) {
    [super setBridge:bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppStateDidChange:)
                                                 name:@"EXKernelBridgeDidForegroundNotification"
                                               object:self.bridge];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppStateDidChange:)
                                                 name:@"EXKernelBridgeDidBackgroundNotification"
                                               object:self.bridge];
    [self setAppStateToForeground];
  } else {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  }
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)handleAppStateDidChange:(NSNotification *)notification
{
  if (!self.isForegrounded && [notification.name isEqualToString:@"EXKernelBridgeDidForegroundNotification"]) {
    [self setAppStateToForeground];
  } else if (self.isForegrounded && [notification.name isEqualToString:@"EXKernelBridgeDidBackgroundNotification"]) {
    [self setAppStateToBackground];
  } else {
    [super handleAppStateDidChange:notification];
  }
}

@end
