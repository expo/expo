// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXScopedBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI24_0_0EXPermissionExpiresNever;

typedef enum ABI24_0_0EXPermissionStatus {
  ABI24_0_0EXPermissionStatusDenied,
  ABI24_0_0EXPermissionStatusGranted,
  ABI24_0_0EXPermissionStatusUndetermined,
} ABI24_0_0EXPermissionStatus;

@protocol ABI24_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI24_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<ABI24_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol ABI24_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI24_0_0EXPermissions : ABI24_0_0EXScopedBridgeModule <ABI24_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI24_0_0EXPermissionStatus)status;

+ (ABI24_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
