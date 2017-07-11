// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXBranchManager;
@class EXErrorRecoveryManager;
@class EXGoogleAuthManager;
@class EXKernelLinkingManager;
@class EXRemoteNotificationManager;
@class EXScreenOrientationManager;

@interface EXKernelServiceRegistry : NSObject

@property (nonatomic, readonly) EXBranchManager *branchManager;
@property (nonatomic, readonly) EXErrorRecoveryManager *errorRecoveryManager;
@property (nonatomic, readonly) EXGoogleAuthManager *googleAuthManager;
@property (nonatomic, readonly) EXRemoteNotificationManager *remoteNotificationManager;
@property (nonatomic, readonly) EXKernelLinkingManager *linkingManager;
@property (nonatomic, readonly) EXScreenOrientationManager *screenOrientationManager;

@property (nonatomic, readonly) NSDictionary *allServices;

@end
