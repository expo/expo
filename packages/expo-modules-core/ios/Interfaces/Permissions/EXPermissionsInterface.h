// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMModuleRegistry.h>

typedef enum EXPermissionStatus {
  EXPermissionStatusDenied,
  EXPermissionStatusGranted,
  EXPermissionStatusUndetermined,
} EXPermissionStatus;


@protocol EXPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol EXPermissionsInterface

- (void)registerRequesters:(NSArray<id<EXPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(UMPromiseResolveBlock)resolve
                                  reject:(UMPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(UMPromiseResolveBlock)resolve
                                     reject:(UMPromiseRejectBlock)reject;

- (id<EXPermissionsRequester>)getPermissionRequesterForType:(NSString *)type;

@end
