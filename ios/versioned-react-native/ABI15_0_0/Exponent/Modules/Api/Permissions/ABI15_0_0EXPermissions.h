// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI15_0_0/ABI15_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI15_0_0EXPermissionExpiresNever;

typedef enum ABI15_0_0EXPermissionStatus {
  ABI15_0_0EXPermissionStatusDenied,
  ABI15_0_0EXPermissionStatusGranted,
  ABI15_0_0EXPermissionStatusUndetermined,
} ABI15_0_0EXPermissionStatus;

@protocol ABI15_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI15_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI15_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI15_0_0EXPermissionRequester> *)requester;

@end

@interface ABI15_0_0EXPermissions : NSObject <ABI15_0_0RCTBridgeModule, ABI15_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI15_0_0EXPermissionStatus)status;

@end
