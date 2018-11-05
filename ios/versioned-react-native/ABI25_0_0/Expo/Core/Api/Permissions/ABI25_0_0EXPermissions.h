// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXScopedBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI25_0_0EXPermissionExpiresNever;

typedef enum ABI25_0_0EXPermissionStatus {
  ABI25_0_0EXPermissionStatusDenied,
  ABI25_0_0EXPermissionStatusGranted,
  ABI25_0_0EXPermissionStatusUndetermined,
} ABI25_0_0EXPermissionStatus;

@protocol ABI25_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI25_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<ABI25_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol ABI25_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI25_0_0EXPermissions : ABI25_0_0EXScopedBridgeModule <ABI25_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI25_0_0EXPermissionStatus)status;

+ (ABI25_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
