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

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

- (BOOL)hasGrantedPermission:(NSString *)permissionType;

- (void)askForPermission:(NSString *)permissionType
              withResult:(UMPromiseResolveBlock)onResult
            withRejecter:(UMPromiseRejectBlock)reject;

- (void)registerRequesters:(NSArray<id<UMPermissionsRequester>> *)newRequesters;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
              withResult:(UMPromiseResolveBlock)onResult
            withRejecter:(UMPromiseRejectBlock)reject;

@end
