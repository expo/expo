// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRegistry.h"

@class EXErrorRecoveryManager;
@class EXFileSystemManager;
@class EXKernelLinkingManager;
@class EXKernelModuleManager;
@class EXRemoteNotificationManager;
@class EXScreenOrientationManager;
@class EXUpdatesManager;
@class EXUserNotificationManager;

@interface EXKernelServiceRegistry : NSObject <EXKernelAppRegistryDelegate>

// TODO: roll these into a macro in the respective classes instead of defining explicitly here.
@property (nonatomic, readonly) EXErrorRecoveryManager *errorRecoveryManager;
@property (nonatomic, readonly) EXKernelModuleManager *kernelModuleManager;
@property (nonatomic, readonly) EXKernelLinkingManager *linkingManager;
@property (nonatomic, readonly) EXRemoteNotificationManager *remoteNotificationManager;
@property (nonatomic, readonly) EXScreenOrientationManager *screenOrientationManager;
@property (nonatomic, readonly) EXUpdatesManager *updatesManager;
@property (nonatomic, readonly) EXUserNotificationManager *notificationsManager;

@property (nonatomic, readonly) NSDictionary<NSString *, id> *allServices;

@end
