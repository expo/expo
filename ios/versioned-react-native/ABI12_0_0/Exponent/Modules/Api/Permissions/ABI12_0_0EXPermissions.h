// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI12_0_0RCTBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI12_0_0EXPermissionExpiresNever;

typedef enum ABI12_0_0EXPermissionStatus {
  ABI12_0_0EXPermissionStatusDenied,
  ABI12_0_0EXPermissionStatusGranted,
  ABI12_0_0EXPermissionStatusUndetermined,
} ABI12_0_0EXPermissionStatus;

@protocol ABI12_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI12_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI12_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI12_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI12_0_0EXPermissionRequester> *)requester;

@end

@interface ABI12_0_0EXPermissions : NSObject <ABI12_0_0RCTBridgeModule, ABI12_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI12_0_0EXPermissionStatus)status;

@end
