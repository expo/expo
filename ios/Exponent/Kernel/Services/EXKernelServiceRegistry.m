// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelServiceRegistry.h"
#import "EXErrorRecoveryManager.h"
#import "EXKernelLinkingManager.h"
#import "EXRemoteNotificationManager.h"
#import "EXScreenOrientationManager.h"

@interface EXKernelServiceRegistry ()

@property (nonatomic, strong) EXErrorRecoveryManager *errorRecoveryManager;
@property (nonatomic, strong) EXScreenOrientationManager *screenOrientationManager;

@end

@implementation EXKernelServiceRegistry

- (instancetype)init
{
  if (self = [super init]) {
    // TODO: init these in some clean way
    [self errorRecoveryManager];
    [self remoteNotificationManager];
    [self linkingManager];
    [self screenOrientationManager];
  }
  return self;
}

- (EXRemoteNotificationManager *)remoteNotificationManager
{
  // TODO: allow this class to register itself
  // instead of hard-coding this.
  return [EXRemoteNotificationManager sharedInstance];
}

- (EXErrorRecoveryManager *)errorRecoveryManager
{
  if (!_errorRecoveryManager) {
    _errorRecoveryManager = [[EXErrorRecoveryManager alloc] init];
  }
  return _errorRecoveryManager;
}

- (EXKernelLinkingManager *)linkingManager
{
  return [EXKernelLinkingManager sharedInstance];
}

- (EXScreenOrientationManager *)screenOrientationManager
{
  if (!_screenOrientationManager) {
    _screenOrientationManager = [[EXScreenOrientationManager alloc] init];
  }
  return _screenOrientationManager;
}

- (NSDictionary *)allServices
{
  return @{
    @"errorRecoveryManager": self.errorRecoveryManager,
    @"linkingManager": self.linkingManager,
    @"remoteNotificationManager": self.remoteNotificationManager,
    @"screenOrientationManager": self.screenOrientationManager,
  };
}

@end
