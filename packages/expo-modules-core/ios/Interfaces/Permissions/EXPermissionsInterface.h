// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

// Many headers of permissions requesters have refs to `UMPromise*Block` without importing
// the header declaring it, so we fix it here, but this definitely needs to be removed.
#import <ExpoModulesCore/EXUnimodulesCompat.h>

typedef enum EXPermissionStatus {
  EXPermissionStatusDenied,
  EXPermissionStatusGranted,
  EXPermissionStatusUndetermined,
} EXPermissionStatus;


@protocol EXPermissionsRequester <NSObject>

+ (NSString *)permissionType;

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject;

- (NSDictionary *)getPermissions;

@end

@protocol EXPermissionsInterface

- (void)registerRequesters:(NSArray<id<EXPermissionsRequester>> *)newRequesters;

- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(EXPromiseResolveBlock)resolve
                                  reject:(EXPromiseRejectBlock)reject;

- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass;

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(EXPromiseResolveBlock)resolve
                                     reject:(EXPromiseRejectBlock)reject;

- (id<EXPermissionsRequester>)getPermissionRequesterForType:(NSString *)type;

@end
