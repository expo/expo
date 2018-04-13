// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXScopedBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI21_0_0EXPermissionExpiresNever;

typedef enum ABI21_0_0EXPermissionStatus {
  ABI21_0_0EXPermissionStatusDenied,
  ABI21_0_0EXPermissionStatusGranted,
  ABI21_0_0EXPermissionStatusUndetermined,
} ABI21_0_0EXPermissionStatus;

@protocol ABI21_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI21_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<ABI21_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol ABI21_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI21_0_0EXPermissions : ABI21_0_0EXScopedBridgeModule <ABI21_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI21_0_0EXPermissionStatus)status;

+ (ABI21_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
