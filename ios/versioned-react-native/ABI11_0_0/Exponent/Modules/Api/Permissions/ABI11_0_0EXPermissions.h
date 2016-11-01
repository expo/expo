// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI11_0_0RCTBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI11_0_0EXPermissionExpiresNever;

typedef enum ABI11_0_0EXPermissionStatus {
  ABI11_0_0EXPermissionStatusDenied,
  ABI11_0_0EXPermissionStatusGranted,
  ABI11_0_0EXPermissionStatusUndetermined,
} ABI11_0_0EXPermissionStatus;

@protocol ABI11_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI11_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI11_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI11_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI11_0_0EXPermissionRequester> *)requester;

@end

@interface ABI11_0_0EXPermissions : NSObject <ABI11_0_0RCTBridgeModule, ABI11_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI11_0_0EXPermissionStatus)status;

@end
