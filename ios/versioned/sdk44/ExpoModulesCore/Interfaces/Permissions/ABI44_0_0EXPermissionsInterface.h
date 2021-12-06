// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistry.h>

// Many headers of permissions requesters have refs to `ABI44_0_0UMPromise*Block` without importing
// the header declaring it, so we fix it here, but this definitely needs to be removed.
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUnimodulesCompat.h>

typedef enum ABI44_0_0EXPermissionStatus {
  ABI44_0_0EXPermissionStatusDenied,
  ABI44_0_0EXPermissionStatusGranted,
  ABI44_0_0EXPermissionStatusUndetermined,
} ABI44_0_0EXPermissionStatus;


@protocol ABI44_0_0EXPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI44_0_0EXPromiseResolveBlock)resolve rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI44_0_0EXPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI44_0_0EXPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                                  reject:(ABI44_0_0EXPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                                     reject:(ABI44_0_0EXPromiseRejectBlock)reject;

- (id<ABI44_0_0EXPermissionsRequester>)getPermissionRequesterForType:(NSString *)type;

@end
