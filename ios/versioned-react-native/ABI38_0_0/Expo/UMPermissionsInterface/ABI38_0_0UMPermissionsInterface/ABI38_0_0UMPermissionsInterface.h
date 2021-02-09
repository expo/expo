// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistry.h>

typedef enum ABI38_0_0UMPermissionStatus {
  ABI38_0_0UMPermissionStatusDenied,
  ABI38_0_0UMPermissionStatusGranted,
  ABI38_0_0UMPermissionStatusUndetermined,
} ABI38_0_0UMPermissionStatus;


@protocol ABI38_0_0UMPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI38_0_0UMPromiseResolveBlock)resolve rejecter:(ABI38_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI38_0_0UMPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI38_0_0UMPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                                  reject:(ABI38_0_0UMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI38_0_0UMPromiseRejectBlock)reject;

@end
