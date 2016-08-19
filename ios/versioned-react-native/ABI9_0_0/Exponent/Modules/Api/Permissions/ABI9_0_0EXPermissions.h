// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI9_0_0RCTBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI9_0_0EXPermissionExpiresNever;

typedef enum ABI9_0_0EXPermissionStatus {
  ABI9_0_0EXPermissionStatusDenied,
  ABI9_0_0EXPermissionStatusGranted,
  ABI9_0_0EXPermissionStatusUndetermined,
} ABI9_0_0EXPermissionStatus;

@protocol ABI9_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI9_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI9_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI9_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI9_0_0EXPermissionRequester> *)requester;

@end

@interface ABI9_0_0EXPermissions : NSObject <ABI9_0_0RCTBridgeModule, ABI9_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI9_0_0EXPermissionStatus)status;

@end
