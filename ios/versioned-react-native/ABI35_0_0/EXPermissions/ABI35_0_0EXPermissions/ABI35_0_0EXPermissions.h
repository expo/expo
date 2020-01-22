// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>
#import <ABI35_0_0UMPermissionsInterface/ABI35_0_0UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI35_0_0EXPermissionExpiresNever;

typedef enum ABI35_0_0EXPermissionStatus {
  ABI35_0_0EXPermissionStatusDenied,
  ABI35_0_0EXPermissionStatusGranted,
  ABI35_0_0EXPermissionStatusUndetermined,
} ABI35_0_0EXPermissionStatus;

@protocol ABI35_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI35_0_0UMPromiseResolveBlock)resolve
                              rejecter:(ABI35_0_0UMPromiseRejectBlock)reject;

@end

@protocol ABI35_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI35_0_0EXPermissionRequester> *)requester;

@end

@protocol ABI35_0_0EXPermissionsModule

- (dispatch_queue_t)methodQueue;

@end

@interface ABI35_0_0EXPermissions : ABI35_0_0UMExportedModule <ABI35_0_0EXPermissionRequesterDelegate, ABI35_0_0UMPermissionsInterface, ABI35_0_0UMModuleRegistryConsumer, ABI35_0_0EXPermissionsModule>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(ABI35_0_0EXPermissionStatus)status;

+ (ABI35_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
