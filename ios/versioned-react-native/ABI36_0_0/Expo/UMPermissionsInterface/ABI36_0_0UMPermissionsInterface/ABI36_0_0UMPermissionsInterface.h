// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistry.h>

typedef enum ABI36_0_0UMPermissionStatus {
  ABI36_0_0UMPermissionStatusDenied,
  ABI36_0_0UMPermissionStatusGranted,
  ABI36_0_0UMPermissionStatusUndetermined,
} ABI36_0_0UMPermissionStatus;


@protocol ABI36_0_0UMPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI36_0_0UMPromiseResolveBlock)resolve rejecter:(ABI36_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI36_0_0UMPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI36_0_0UMPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI36_0_0UMPromiseResolveBlock)resolve
                                  reject:(ABI36_0_0UMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI36_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI36_0_0UMPromiseRejectBlock)reject;

@end
