// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMModuleRegistry.h>

typedef enum UMPermissionStatus {
  UMPermissionStatusDenied,
  UMPermissionStatusGranted,
  UMPermissionStatusUndetermined,
} UMPermissionStatus;


@protocol UMPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol UMPermissionsInterface

- (void)registerRequesters:(NSArray<id<UMPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(UMPromiseResolveBlock)resolve
                                  reject:(UMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(UMPromiseResolveBlock)resolve
                                     reject:(UMPromiseRejectBlock)reject;

@end
