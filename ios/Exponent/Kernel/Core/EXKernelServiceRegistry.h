// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRegistry.h"

@class EXBranchManager;
@class EXErrorRecoveryManager;
@class EXFileSystemManager;
@class EXGoogleAuthManager;
@class EXKernelLinkingManager;
@class EXKernelModuleManager;
@class EXRemoteNotificationManager;
@class EXScreenOrientationManager;
@class EXUpdatesManager;
@class EXPermissionsManager;
@class EXUtilService;

@interface EXKernelServiceRegistry : NSObject <EXKernelAppRegistryDelegate>

// TODO: roll these into a macro in the respective classes instead of defining explicitly here.
@property (nonatomic, readonly) EXBranchManager *branchManager;
@property (nonatomic, readonly) EXErrorRecoveryManager *errorRecoveryManager;
@property (nonatomic, readonly) EXFileSystemManager *fileSystemManager;
@property (nonatomic, readonly) EXGoogleAuthManager *googleAuthManager;
@property (nonatomic, readonly) EXKernelModuleManager *kernelModuleManager;
@property (nonatomic, readonly) EXKernelLinkingManager *linkingManager;
@property (nonatomic, readonly) EXRemoteNotificationManager *remoteNotificationManager;
@property (nonatomic, readonly) EXScreenOrientationManager *screenOrientationManager;
@property (nonatomic, readonly) EXUpdatesManager *updatesManager;
@property (nonatomic, readonly) EXPermissionsManager *permissionsManager;
@property (nonatomic, readonly) EXUtilService *utilService;

@property (nonatomic, readonly) NSDictionary<NSString *, id> *allServices;

@end
