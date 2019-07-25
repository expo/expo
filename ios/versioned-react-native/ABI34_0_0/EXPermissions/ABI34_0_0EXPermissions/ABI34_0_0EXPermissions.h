// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>
#import <ABI34_0_0UMPermissionsInterface/ABI34_0_0UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI34_0_0EXPermissionExpiresNever;

typedef enum ABI34_0_0EXPermissionStatus {
  ABI34_0_0EXPermissionStatusDenied,
  ABI34_0_0EXPermissionStatusGranted,
  ABI34_0_0EXPermissionStatusUndetermined,
} ABI34_0_0EXPermissionStatus;

@protocol ABI34_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                              rejecter:(ABI34_0_0UMPromiseRejectBlock)reject;

@end

@protocol ABI34_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI34_0_0EXPermissionRequester> *)requester;

@end

@protocol ABI34_0_0EXPermissionsModule

- (dispatch_queue_t)methodQueue;

@end

@interface ABI34_0_0EXPermissions : ABI34_0_0UMExportedModule <ABI34_0_0EXPermissionRequesterDelegate, ABI34_0_0UMPermissionsInterface, ABI34_0_0UMModuleRegistryConsumer, ABI34_0_0EXPermissionsModule>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(ABI34_0_0EXPermissionStatus)status;

+ (ABI34_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
