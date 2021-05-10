// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMPermissionsInterface/UMPermissionsInterface.h>

#import <EXPermissions/EXPermissions.h>

@interface EXPermissions ()

@property (nonatomic, weak) id<UMPermissionsInterface> permissionsService;

@end

@implementation EXPermissions

UM_EXPORT_MODULE(ExpoPermissions);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _permissionsService = [moduleRegistry getModuleImplementingProtocol:@protocol(UMPermissionsInterface)];
}

# pragma mark - Exported methods

UM_EXPORT_METHOD_AS(getAsync,
                    getPermissionWithType:(NSString *)permissionType
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  id<UMPermissionsRequester> requester = [_permissionsService getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [_permissionsService getPermissionUsingRequesterClass:[requester class]
                                                resolve:resolve
                                                 reject:reject];
}

UM_EXPORT_METHOD_AS(askAsync,
                    askAsyncForPermission:(NSString *)permissionType
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  id<UMPermissionsRequester> requester = [_permissionsService getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [_permissionsService askForPermissionUsingRequesterClass:[requester class]
                                                   resolve:resolve
                                                    reject:reject];
}

@end
