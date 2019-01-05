// Copyright © 2018 650 Industries. All rights reserved.

#import "EXScopedReactNativeAdapter.h"
#import "EXUnversioned.h"

@interface EXReactNativeAdapter (Protected)

- (void)handleAppStateDidChange:(NSNotification *)notification;

@end

@interface EXScopedReactNativeAdapter ()

// property inherited from EXReactNativeAdapter
@property (nonatomic, assign) BOOL isForegrounded;

@end

@implementation EXScopedReactNativeAdapter

@dynamic isForegrounded;

- (void)setBridge:(RCTBridge *)bridge
{
  if (bridge) {
    [super setBridge:bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppStateDidChange:)
                                                 name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                               object:self.bridge];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppStateDidChange:)
                                                 name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
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
  // For versioning sake let's not have extra parentheses in lines with EX_UNVERSIONED
  NSString *didForegroundNotificationName = EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification");
  NSString *didBackgroundNotificationName = EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification");
  if (!self.isForegrounded && [notification.name isEqualToString:didForegroundNotificationName]) {
    [self setAppStateToForeground];
  } else if (self.isForegrounded && [notification.name isEqualToString:didBackgroundNotificationName]) {
    [self setAppStateToBackground];
  } else {
    [super handleAppStateDidChange:notification];
  }
}

@end
