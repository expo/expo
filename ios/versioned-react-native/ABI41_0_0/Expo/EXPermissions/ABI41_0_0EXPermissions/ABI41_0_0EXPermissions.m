// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>

#import <ABI41_0_0EXPermissions/ABI41_0_0EXPermissions.h>

@interface ABI41_0_0EXPermissions ()

@property (nonatomic, weak) id<ABI41_0_0UMPermissionsInterface> permissionsService;

@end

@implementation ABI41_0_0EXPermissions

ABI41_0_0UM_EXPORT_MODULE(ExpoPermissions);

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _permissionsService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMPermissionsInterface)];
}

# pragma mark - Exported methods

ABI41_0_0UM_EXPORT_METHOD_AS(getAsync,
                    getPermissionWithType:(NSString *)permissionType
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  id<ABI41_0_0UMPermissionsRequester> requester = [_permissionsService getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [_permissionsService getPermissionUsingRequesterClass:[requester class]
                                                resolve:resolve
                                                 reject:reject];
}

ABI41_0_0UM_EXPORT_METHOD_AS(askAsync,
                    askAsyncForPermission:(NSString *)permissionType
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  id<ABI41_0_0UMPermissionsRequester> requester = [_permissionsService getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [_permissionsService askForPermissionUsingRequesterClass:[requester class]
                                                   resolve:resolve
                                                    reject:reject];
}

@end
