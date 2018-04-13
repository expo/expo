// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI23_0_0EXPermissionExpiresNever;

typedef enum ABI23_0_0EXPermissionStatus {
  ABI23_0_0EXPermissionStatusDenied,
  ABI23_0_0EXPermissionStatusGranted,
  ABI23_0_0EXPermissionStatusUndetermined,
} ABI23_0_0EXPermissionStatus;

@protocol ABI23_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI23_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI23_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI23_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<ABI23_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol ABI23_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI23_0_0EXPermissions : ABI23_0_0EXScopedBridgeModule <ABI23_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI23_0_0EXPermissionStatus)status;

+ (ABI23_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
