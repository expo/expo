// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>
#import <EXPermissions/EXPermissionBaseRequester.h>

FOUNDATION_EXPORT NSString * const EXPermissionExpiresNever;

typedef enum EXPermissionStatus {
  EXPermissionStatusDenied,
  EXPermissionStatusGranted,
  EXPermissionStatusUndetermined,
} EXPermissionStatus;

@protocol EXPermissionsModule

- (dispatch_queue_t)methodQueue;

@end

@interface EXPermissions : UMExportedModule <EXPermissionRequesterDelegate, UMPermissionsInterface, UMModuleRegistryConsumer, EXPermissionsModule>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(EXPermissionStatus)status;

+ (EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

- (void)askForGlobalPermission:(NSString *)permissionType
                  withResolver:(void (^)(NSDictionary *))resolver
                  withRejecter:(UMPromiseRejectBlock)reject;
@end
