// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

FOUNDATION_EXPORT NSString * const EXPermissionExpiresNever;

typedef enum EXPermissionStatus {
  EXPermissionStatusDenied,
  EXPermissionStatusGranted,
  EXPermissionStatusUndetermined,
} EXPermissionStatus;

@protocol EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(RCTPromiseResolveBlock)resolve
                              rejecter:(RCTPromiseRejectBlock)reject;

@end

@protocol EXPermissionRequesterDelegate <NSObject>

- (void)permissionsRequester:(NSObject<EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult;

@end

@protocol EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface EXPermissions : EXScopedBridgeModule <EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(EXPermissionStatus)status;

+ (EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
