// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXScopedBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI22_0_0EXPermissionExpiresNever;

typedef enum ABI22_0_0EXPermissionStatus {
  ABI22_0_0EXPermissionStatusDenied,
  ABI22_0_0EXPermissionStatusGranted,
  ABI22_0_0EXPermissionStatusUndetermined,
} ABI22_0_0EXPermissionStatus;

@protocol ABI22_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI22_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI22_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI22_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<ABI22_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol ABI22_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI22_0_0EXPermissions : ABI22_0_0EXScopedBridgeModule <ABI22_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI22_0_0EXPermissionStatus)status;

+ (ABI22_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
