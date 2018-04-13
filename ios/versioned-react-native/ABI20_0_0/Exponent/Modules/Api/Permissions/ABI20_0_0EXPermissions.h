// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXScopedBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI20_0_0EXPermissionExpiresNever;

typedef enum ABI20_0_0EXPermissionStatus {
  ABI20_0_0EXPermissionStatusDenied,
  ABI20_0_0EXPermissionStatusGranted,
  ABI20_0_0EXPermissionStatusUndetermined,
} ABI20_0_0EXPermissionStatus;

@protocol ABI20_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI20_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<ABI20_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol ABI20_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI20_0_0EXPermissions : ABI20_0_0EXScopedBridgeModule <ABI20_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI20_0_0EXPermissionStatus)status;

+ (ABI20_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
