// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI28_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

FOUNDATION_EXPORT NSString * const ABI28_0_0EXPermissionExpiresNever;

typedef enum ABI28_0_0EXPermissionStatus {
  ABI28_0_0EXPermissionStatusDenied,
  ABI28_0_0EXPermissionStatusGranted,
  ABI28_0_0EXPermissionStatusUndetermined,
} ABI28_0_0EXPermissionStatus;

@protocol ABI28_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI28_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<ABI28_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol ABI28_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI28_0_0EXPermissions : ABI28_0_0EXScopedBridgeModule <ABI28_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI28_0_0EXPermissionStatus)status;

+ (ABI28_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
