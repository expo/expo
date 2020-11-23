// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistry.h>

typedef enum ABI40_0_0UMPermissionStatus {
  ABI40_0_0UMPermissionStatusDenied,
  ABI40_0_0UMPermissionStatusGranted,
  ABI40_0_0UMPermissionStatusUndetermined,
} ABI40_0_0UMPermissionStatus;


@protocol ABI40_0_0UMPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI40_0_0UMPromiseResolveBlock)resolve rejecter:(ABI40_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI40_0_0UMPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI40_0_0UMPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                                  reject:(ABI40_0_0UMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI40_0_0UMPromiseRejectBlock)reject;

@end
