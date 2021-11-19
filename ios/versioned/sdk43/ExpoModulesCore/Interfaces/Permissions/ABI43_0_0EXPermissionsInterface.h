// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>

// Many headers of permissions requesters have refs to `ABI43_0_0UMPromise*Block` without importing
// the header declaring it, so we fix it here, but this definitely needs to be removed.
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUnimodulesCompat.h>

typedef enum ABI43_0_0EXPermissionStatus {
  ABI43_0_0EXPermissionStatusDenied,
  ABI43_0_0EXPermissionStatusGranted,
  ABI43_0_0EXPermissionStatusUndetermined,
} ABI43_0_0EXPermissionStatus;


@protocol ABI43_0_0EXPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI43_0_0EXPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI43_0_0EXPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                                  reject:(ABI43_0_0EXPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                                     reject:(ABI43_0_0EXPromiseRejectBlock)reject;

- (id<ABI43_0_0EXPermissionsRequester>)getPermissionRequesterForType:(NSString *)type;

@end
