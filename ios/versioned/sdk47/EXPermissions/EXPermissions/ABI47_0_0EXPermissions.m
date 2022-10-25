// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXPermissionsInterface.h>

#import <ABI47_0_0EXPermissions/ABI47_0_0EXPermissions.h>

@interface ABI47_0_0EXPermissions ()

@property (nonatomic, weak) id<ABI47_0_0EXPermissionsInterface> permissionsService;

@end

@implementation ABI47_0_0EXPermissions

ABI47_0_0EX_EXPORT_MODULE(ExpoPermissions);

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXPermissionsInterface)];
}

# pragma mark - Exported methods

ABI47_0_0EX_EXPORT_METHOD_AS(getAsync,
                    getPermissionWithType:(NSString *)permissionType
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  id<ABI47_0_0EXPermissionsRequester> requester = [_permissionsService getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [_permissionsService getPermissionUsingRequesterClass:[requester class]
                                                resolve:resolve
                                                 reject:reject];
}

ABI47_0_0EX_EXPORT_METHOD_AS(askAsync,
                    askAsyncForPermission:(NSString *)permissionType
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  id<ABI47_0_0EXPermissionsRequester> requester = [_permissionsService getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [_permissionsService askForPermissionUsingRequesterClass:[requester class]
                                                   resolve:resolve
                                                    reject:reject];
}

@end
