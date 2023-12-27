// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistry.h>

typedef enum ABI42_0_0EXPermissionStatus {
  ABI42_0_0EXPermissionStatusDenied,
  ABI42_0_0EXPermissionStatusGranted,
  ABI42_0_0EXPermissionStatusUndetermined,
} ABI42_0_0EXPermissionStatus;


@protocol ABI42_0_0EXPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI42_0_0EXPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI42_0_0EXPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                                  reject:(ABI42_0_0UMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI42_0_0UMPromiseRejectBlock)reject;

- (id<ABI42_0_0EXPermissionsRequester>)getPermissionRequesterForType:(NSString *)type;

@end
