// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXCore/ABI31_0_0EXExportedModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>
#import <ABI31_0_0EXPermissionsInterface/ABI31_0_0EXPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI31_0_0EXPermissionExpiresNever;

typedef enum ABI31_0_0EXPermissionStatus {
  ABI31_0_0EXPermissionStatusDenied,
  ABI31_0_0EXPermissionStatusGranted,
  ABI31_0_0EXPermissionStatusUndetermined,
} ABI31_0_0EXPermissionStatus;

@protocol ABI31_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI31_0_0EXPromiseResolveBlock)resolve
                              rejecter:(ABI31_0_0EXPromiseRejectBlock)reject;

@end

@protocol ABI31_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI31_0_0EXPermissionRequester> *)requester;

@end

@protocol ABI31_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI31_0_0EXPermissions : ABI31_0_0EXExportedModule <ABI31_0_0EXPermissionRequesterDelegate, ABI31_0_0EXPermissionsInterface, ABI31_0_0EXModuleRegistryConsumer>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(ABI31_0_0EXPermissionStatus)status;

+ (ABI31_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
