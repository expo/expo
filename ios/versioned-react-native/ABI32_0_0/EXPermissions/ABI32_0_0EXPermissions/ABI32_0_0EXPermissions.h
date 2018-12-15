// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>
#import <ABI32_0_0EXPermissionsInterface/ABI32_0_0EXPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI32_0_0EXPermissionExpiresNever;

typedef enum ABI32_0_0EXPermissionStatus {
  ABI32_0_0EXPermissionStatusDenied,
  ABI32_0_0EXPermissionStatusGranted,
  ABI32_0_0EXPermissionStatusUndetermined,
} ABI32_0_0EXPermissionStatus;

@protocol ABI32_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI32_0_0EXPromiseResolveBlock)resolve
                              rejecter:(ABI32_0_0EXPromiseRejectBlock)reject;

@end

@protocol ABI32_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI32_0_0EXPermissionRequester> *)requester;

@end

@protocol ABI32_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@protocol ABI32_0_0EXPermissionsModule

- (dispatch_queue_t)methodQueue;

@end

@interface ABI32_0_0EXPermissions : ABI32_0_0EXExportedModule <ABI32_0_0EXPermissionRequesterDelegate, ABI32_0_0EXPermissionsInterface, ABI32_0_0EXModuleRegistryConsumer, ABI32_0_0EXPermissionsModule>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(ABI32_0_0EXPermissionStatus)status;

+ (ABI32_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
