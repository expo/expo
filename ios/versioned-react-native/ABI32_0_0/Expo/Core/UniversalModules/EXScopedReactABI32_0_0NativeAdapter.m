// Copyright © 2018 650 Industries. All rights reserved.

#import "EXScopedReactABI32_0_0NativeAdapter.h"
#import "ABI32_0_0EXUnversioned.h"

@interface ABI32_0_0EXReactNativeAdapter (Protected)

- (void)handleAppStateDidChange:(NSNotification *)notification;

@end

@interface ABI32_0_0EXScopedReactABI32_0_0NativeAdapter ()

// property inherited from ABI32_0_0EXReactNativeAdapter
@property (nonatomic, assign) BOOL isForegrounded;

@end

@implementation ABI32_0_0EXScopedReactABI32_0_0NativeAdapter

@dynamic isForegrounded;

- (void)setBridge:(ABI32_0_0RCTBridge *)bridge
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
  // For versioning sake let's not have extra parentheses in lines with ABI32_0_0EX_UNVERSIONED
  NSString *didForegroundNotificationName = @"EXKernelBridgeDidForegroundNotification";
  NSString *didBackgroundNotificationName = @"EXKernelBridgeDidBackgroundNotification";
  if (!self.isForegrounded && [notification.name isEqualToString:didForegroundNotificationName]) {
    [self setAppStateToForeground];
  } else if (self.isForegrounded && [notification.name isEqualToString:didBackgroundNotificationName]) {
    [self setAppStateToBackground];
  } else {
    [super handleAppStateDidChange:notification];
  }
}

@end
