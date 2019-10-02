// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>
#import <ABI33_0_0UMPermissionsInterface/ABI33_0_0UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI33_0_0EXPermissionExpiresNever;

typedef enum ABI33_0_0EXPermissionStatus {
  ABI33_0_0EXPermissionStatusDenied,
  ABI33_0_0EXPermissionStatusGranted,
  ABI33_0_0EXPermissionStatusUndetermined,
} ABI33_0_0EXPermissionStatus;

@protocol ABI33_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI33_0_0UMPromiseResolveBlock)resolve
                              rejecter:(ABI33_0_0UMPromiseRejectBlock)reject;

@end

@protocol ABI33_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI33_0_0EXPermissionRequester> *)requester;

@end

@protocol ABI33_0_0EXPermissionsModule

- (dispatch_queue_t)methodQueue;

@end

@interface ABI33_0_0EXPermissions : ABI33_0_0UMExportedModule <ABI33_0_0EXPermissionRequesterDelegate, ABI33_0_0UMPermissionsInterface, ABI33_0_0UMModuleRegistryConsumer, ABI33_0_0EXPermissionsModule>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(ABI33_0_0EXPermissionStatus)status;

+ (ABI33_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
