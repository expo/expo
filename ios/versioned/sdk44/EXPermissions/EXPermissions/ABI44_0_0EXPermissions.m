// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXPermissionsInterface.h>

#import <ABI44_0_0EXPermissions/ABI44_0_0EXPermissions.h>

@interface ABI44_0_0EXPermissions ()

@property (nonatomic, weak) id<ABI44_0_0EXPermissionsInterface> permissionsService;

@end

@implementation ABI44_0_0EXPermissions

ABI44_0_0EX_EXPORT_MODULE(ExpoPermissions);

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXPermissionsInterface)];
}

# pragma mark - Exported methods

ABI44_0_0EX_EXPORT_METHOD_AS(getAsync,
                    getPermissionWithType:(NSString *)permissionType
                    resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  id<ABI44_0_0EXPermissionsRequester> requester = [_permissionsService getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [_permissionsService getPermissionUsingRequesterClass:[requester class]
                                                resolve:resolve
                                                 reject:reject];
}

ABI44_0_0EX_EXPORT_METHOD_AS(askAsync,
                    askAsyncForPermission:(NSString *)permissionType
                    resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  id<ABI44_0_0EXPermissionsRequester> requester = [_permissionsService getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [_permissionsService askForPermissionUsingRequesterClass:[requester class]
                                                   resolve:resolve
                                                    reject:reject];
}

@end
