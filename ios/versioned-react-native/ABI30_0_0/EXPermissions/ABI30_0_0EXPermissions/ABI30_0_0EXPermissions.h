// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>
#import <ABI30_0_0EXPermissionsInterface/ABI30_0_0EXPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI30_0_0EXPermissionExpiresNever;

typedef enum ABI30_0_0EXPermissionStatus {
  ABI30_0_0EXPermissionStatusDenied,
  ABI30_0_0EXPermissionStatusGranted,
  ABI30_0_0EXPermissionStatusUndetermined,
} ABI30_0_0EXPermissionStatus;

@protocol ABI30_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                              rejecter:(ABI30_0_0EXPromiseRejectBlock)reject;

@end

@protocol ABI30_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI30_0_0EXPermissionRequester> *)requester;

@end

@protocol ABI30_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI30_0_0EXPermissions : ABI30_0_0EXExportedModule <ABI30_0_0EXPermissionRequesterDelegate, ABI30_0_0EXPermissionsInterface, ABI30_0_0EXModuleRegistryConsumer>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(ABI30_0_0EXPermissionStatus)status;

+ (ABI30_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
