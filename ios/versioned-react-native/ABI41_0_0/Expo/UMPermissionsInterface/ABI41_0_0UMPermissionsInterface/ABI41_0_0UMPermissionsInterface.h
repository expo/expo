// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>

typedef enum ABI41_0_0UMPermissionStatus {
  ABI41_0_0UMPermissionStatusDenied,
  ABI41_0_0UMPermissionStatusGranted,
  ABI41_0_0UMPermissionStatusUndetermined,
} ABI41_0_0UMPermissionStatus;


@protocol ABI41_0_0UMPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI41_0_0UMPromiseResolveBlock)resolve rejecter:(ABI41_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI41_0_0UMPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI41_0_0UMPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                                  reject:(ABI41_0_0UMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI41_0_0UMPromiseRejectBlock)reject;

- (id<ABI41_0_0UMPermissionsRequester>)getPermissionRequesterForType:(NSString *)type;

@end
