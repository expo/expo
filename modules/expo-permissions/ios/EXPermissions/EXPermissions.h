// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXPermissionsInterface/EXPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const EXPermissionExpiresNever;

typedef enum EXPermissionStatus {
  EXPermissionStatusDenied,
  EXPermissionStatusGranted,
  EXPermissionStatusUndetermined,
} EXPermissionStatus;

@protocol EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve
                              rejecter:(EXPromiseRejectBlock)reject;

@end

@protocol EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<EXPermissionRequester> *)requester;

@end

@interface EXPermissions : EXExportedModule <EXPermissionRequesterDelegate, EXPermissions>

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

+ (NSString *)permissionStringForStatus:(EXPermissionStatus)status;

+ (EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
