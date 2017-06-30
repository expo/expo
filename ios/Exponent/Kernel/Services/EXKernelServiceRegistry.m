// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelServiceRegistry.h"
#import "EXErrorRecoveryManager.h"
#import "EXRemoteNotificationManager.h"

@interface EXKernelServiceRegistry ()

@property (nonatomic, strong) EXErrorRecoveryManager *errorRecoveryManager;

@end

@implementation EXKernelServiceRegistry

- (instancetype)init
{
  if (self = [super init]) {
    // TODO: init these in some clean way
    [self errorRecoveryManager];
    [self remoteNotificationManager];
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

- (NSDictionary *)allServices
{
  return @{
    @"errorRecoveryManager": self.errorRecoveryManager,
    @"remoteNotificationManager": self.remoteNotificationManager,
  };
}

@end
