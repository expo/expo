// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const EXPermissionExpiresNever;

typedef enum EXPermissionStatus {
  EXPermissionStatusDenied,
  EXPermissionStatusGranted,
  EXPermissionStatusUndetermined,
} EXPermissionStatus;

@protocol EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve
                              rejecter:(UMPromiseRejectBlock)reject;

@end

@protocol EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<EXPermissionRequester> *)requester;

@end

@protocol EXPermissionsModule

- (dispatch_queue_t)methodQueue;

@end

@interface EXPermissions : UMExportedModule <EXPermissionRequesterDelegate, UMPermissionsInterface, UMModuleRegistryConsumer, EXPermissionsModule>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(EXPermissionStatus)status;

+ (EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
