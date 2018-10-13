// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXPermissionsInterface/EXPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const EXPermissionExpiresNever;

typedef enum EXPermissionStatus {
  EXPermissionStatusDenied,
  EXPermissionStatusGranted,
  EXPermissionStatusUndetermined,
} EXPermissionStatus;

@protocol EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve
                              rejecter:(EXPromiseRejectBlock)reject;

@end

@protocol EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<EXPermissionRequester> *)requester;

@end

@protocol EXPermissionsScopedModuleDelegate

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface EXPermissions : EXExportedModule <EXPermissionRequesterDelegate, EXPermissionsInterface, EXModuleRegistryConsumer>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(EXPermissionStatus)status;

+ (EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
