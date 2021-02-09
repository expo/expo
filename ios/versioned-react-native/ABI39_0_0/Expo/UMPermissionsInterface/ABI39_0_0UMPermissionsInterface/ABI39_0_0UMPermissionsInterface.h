// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistry.h>

typedef enum ABI39_0_0UMPermissionStatus {
  ABI39_0_0UMPermissionStatusDenied,
  ABI39_0_0UMPermissionStatusGranted,
  ABI39_0_0UMPermissionStatusUndetermined,
} ABI39_0_0UMPermissionStatus;


@protocol ABI39_0_0UMPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI39_0_0UMPromiseResolveBlock)resolve rejecter:(ABI39_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI39_0_0UMPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI39_0_0UMPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI39_0_0UMPromiseResolveBlock)resolve
                                  reject:(ABI39_0_0UMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI39_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI39_0_0UMPromiseRejectBlock)reject;

@end
