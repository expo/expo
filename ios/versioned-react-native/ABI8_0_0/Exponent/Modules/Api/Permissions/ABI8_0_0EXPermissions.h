// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI8_0_0RCTBridgeModule.h"

FOUNDATION_EXPORT NSString * const ABI8_0_0EXPermissionExpiresNever;

typedef enum ABI8_0_0EXPermissionStatus {
  ABI8_0_0EXPermissionStatusDenied,
  ABI8_0_0EXPermissionStatusGranted,
  ABI8_0_0EXPermissionStatusUndetermined,
} ABI8_0_0EXPermissionStatus;

@protocol ABI8_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI8_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI8_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI8_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI8_0_0EXPermissionRequester> *)requester;

@end

@interface ABI8_0_0EXPermissions : NSObject <ABI8_0_0RCTBridgeModule, ABI8_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI8_0_0EXPermissionStatus)status;

@end
