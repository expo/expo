// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXScopedBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI26_0_0EXPermissionExpiresNever;

typedef enum ABI26_0_0EXPermissionStatus {
  ABI26_0_0EXPermissionStatusDenied,
  ABI26_0_0EXPermissionStatusGranted,
  ABI26_0_0EXPermissionStatusUndetermined,
} ABI26_0_0EXPermissionStatus;

@protocol ABI26_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI26_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<ABI26_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol ABI26_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI26_0_0EXPermissions : ABI26_0_0EXScopedBridgeModule <ABI26_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI26_0_0EXPermissionStatus)status;

+ (ABI26_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
