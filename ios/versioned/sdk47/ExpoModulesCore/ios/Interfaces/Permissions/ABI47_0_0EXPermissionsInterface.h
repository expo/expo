// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistry.h>

// Many headers of permissions requesters have refs to `ABI47_0_0UMPromise*Block` without importing
// the header declaring it, so we fix it here, but this definitely needs to be removed.
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUnimodulesCompat.h>

typedef enum ABI47_0_0EXPermissionStatus {
  ABI47_0_0EXPermissionStatusDenied,
  ABI47_0_0EXPermissionStatusGranted,
  ABI47_0_0EXPermissionStatusUndetermined,
} ABI47_0_0EXPermissionStatus;


@protocol ABI47_0_0EXPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(ABI47_0_0EXPromiseResolveBlock)resolve rejecter:(ABI47_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol ABI47_0_0EXPermissionsInterface

- (void)registerRequesters:(NSArray<id<ABI47_0_0EXPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                                  reject:(ABI47_0_0EXPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                                     reject:(ABI47_0_0EXPromiseRejectBlock)reject;

- (id<ABI47_0_0EXPermissionsRequester>)getPermissionRequesterForType:(NSString *)type;

@end
