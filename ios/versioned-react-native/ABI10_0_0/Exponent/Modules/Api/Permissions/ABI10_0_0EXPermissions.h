// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI10_0_0RCTBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI10_0_0EXPermissionExpiresNever;

typedef enum ABI10_0_0EXPermissionStatus {
  ABI10_0_0EXPermissionStatusDenied,
  ABI10_0_0EXPermissionStatusGranted,
  ABI10_0_0EXPermissionStatusUndetermined,
} ABI10_0_0EXPermissionStatus;

@protocol ABI10_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI10_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI10_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI10_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI10_0_0EXPermissionRequester> *)requester;

@end

@interface ABI10_0_0EXPermissions : NSObject <ABI10_0_0RCTBridgeModule, ABI10_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI10_0_0EXPermissionStatus)status;

@end
