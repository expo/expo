// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI27_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

FOUNDATION_EXPORT NSString * const ABI27_0_0EXPermissionExpiresNever;

typedef enum ABI27_0_0EXPermissionStatus {
  ABI27_0_0EXPermissionStatusDenied,
  ABI27_0_0EXPermissionStatusGranted,
  ABI27_0_0EXPermissionStatusUndetermined,
} ABI27_0_0EXPermissionStatus;

@protocol ABI27_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI27_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<ABI27_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol ABI27_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI27_0_0EXPermissions : ABI27_0_0EXScopedBridgeModule <ABI27_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI27_0_0EXPermissionStatus)status;

+ (ABI27_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
