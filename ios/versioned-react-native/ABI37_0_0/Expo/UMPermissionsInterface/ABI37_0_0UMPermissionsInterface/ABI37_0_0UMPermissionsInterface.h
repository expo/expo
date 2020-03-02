// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistry.h>

typedef enum ABI37_0_0UMPermissionStatus {
  ABI37_0_0UMPermissionStatusDenied,
  ABI37_0_0UMPermissionStatusGranted,
  ABI37_0_0UMPermissionStatusUndetermined,
} ABI37_0_0UMPermissionStatus;


@protocol ABI37_0_0UMPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI37_0_0UMPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI37_0_0UMPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                                  reject:(ABI37_0_0UMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI37_0_0UMPromiseRejectBlock)reject;

@end
