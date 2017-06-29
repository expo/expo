// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelServiceRegistry.h"
#import "EXRemoteNotificationManager.h"

@implementation EXKernelServiceRegistry

- (EXRemoteNotificationManager *)remoteNotificationManager
{
  // TODO: allow this class to register itself
  // instead of hard-coding this.
  return [EXRemoteNotificationManager sharedInstance];
}

- (NSDictionary *)allServices
{
  return @{
    @"remoteNotificationManager": self.remoteNotificationManager,
  };
}

@end
