// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelBridgeRegistry.h"

@class EXBranchManager;
@class EXErrorRecoveryManager;
@class EXGoogleAuthManager;
@class EXKernelLinkingManager;
@class EXKernelModuleManager;
@class EXRemoteNotificationManager;
@class EXScreenOrientationManager;

@interface EXKernelServiceRegistry : NSObject <EXKernelBridgeRegistryDelegate>

// TODO: roll these into a macro in the respective classes instead of defining explicitly here.
@property (nonatomic, readonly) EXBranchManager *branchManager;
@property (nonatomic, readonly) EXErrorRecoveryManager *errorRecoveryManager;
@property (nonatomic, readonly) EXGoogleAuthManager *googleAuthManager;
@property (nonatomic, readonly) EXKernelModuleManager *kernelModuleManager;
@property (nonatomic, readonly) EXKernelLinkingManager *linkingManager;
@property (nonatomic, readonly) EXRemoteNotificationManager *remoteNotificationManager;
@property (nonatomic, readonly) EXScreenOrientationManager *screenOrientationManager;

@property (nonatomic, readonly) NSDictionary<NSString *, id> *allServices;

@end
