// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistry.h>

// Many headers of permissions requesters have refs to `ABI49_0_0UMPromise*Block` without importing
// the header declaring it, so we fix it here, but this definitely needs to be removed.
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXUnimodulesCompat.h>

typedef enum ABI49_0_0EXPermissionStatus {
  ABI49_0_0EXPermissionStatusDenied,
  ABI49_0_0EXPermissionStatusGranted,
  ABI49_0_0EXPermissionStatusUndetermined,
} ABI49_0_0EXPermissionStatus;


@protocol ABI49_0_0EXPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI49_0_0EXPromiseResolveBlock)resolve rejecter:(ABI49_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI49_0_0EXPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI49_0_0EXPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI49_0_0EXPromiseResolveBlock)resolve
                                  reject:(ABI49_0_0EXPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI49_0_0EXPromiseResolveBlock)resolve
                                     reject:(ABI49_0_0EXPromiseRejectBlock)reject;

- (id<ABI49_0_0EXPermissionsRequester>)getPermissionRequesterForType:(NSString *)type;

@end
