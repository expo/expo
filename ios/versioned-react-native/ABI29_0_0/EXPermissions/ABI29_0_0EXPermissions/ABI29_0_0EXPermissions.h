// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXCore/ABI29_0_0EXExportedModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryConsumer.h>
#import <ABI29_0_0EXPermissionsInterface/ABI29_0_0EXPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI29_0_0EXPermissionExpiresNever;

typedef enum ABI29_0_0EXPermissionStatus {
  ABI29_0_0EXPermissionStatusDenied,
  ABI29_0_0EXPermissionStatusGranted,
  ABI29_0_0EXPermissionStatusUndetermined,
} ABI29_0_0EXPermissionStatus;

@protocol ABI29_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI29_0_0EXPromiseResolveBlock)resolve
                              rejecter:(ABI29_0_0EXPromiseRejectBlock)reject;

@end

@protocol ABI29_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI29_0_0EXPermissionRequester> *)requester;

@end

@protocol ABI29_0_0EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI29_0_0EXPermissions : ABI29_0_0EXExportedModule <ABI29_0_0EXPermissionRequesterDelegate, ABI29_0_0EXPermissionsInterface, ABI29_0_0EXModuleRegistryConsumer>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(ABI29_0_0EXPermissionStatus)status;

+ (ABI29_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
