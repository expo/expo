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
  [super setBridge:bridge];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleAppStateDidChange:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleAppStateDidChange:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
}

- (void)handleAppStateDidChange:(NSNotification *)notification
{
  if (!self.isForegrounded && [notification.name isEqualToString:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")]) {
    [self setAppStateToForeground];
  } else if (self.isForegrounded && [notification.name isEqualToString:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")]) {
    [self setAppStateToBackground];
  } else {
    [super handleAppStateDidChange:notification];
  }
}

@end
