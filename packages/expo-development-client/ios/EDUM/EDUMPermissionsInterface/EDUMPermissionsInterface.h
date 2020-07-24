// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMModuleRegistry.h>

typedef enum EDUMPermissionStatus {
  EDUMPermissionStatusDenied,
  EDUMPermissionStatusGranted,
  EDUMPermissionStatusUndetermined,
} EDUMPermissionStatus;


@protocol EDUMPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(EDUMPromiseResolveBlock)resolve rejecter:(EDUMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol EDUMPermissionsInterface

- (void)registerRequesters:(NSArray<id<EDUMPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(EDUMPromiseResolveBlock)resolve
                                  reject:(EDUMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(EDUMPromiseResolveBlock)resolve
                                     reject:(EDUMPromiseRejectBlock)reject;

@end
