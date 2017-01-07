// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI13_0_0/ABI13_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI13_0_0EXPermissionExpiresNever;

typedef enum ABI13_0_0EXPermissionStatus {
  ABI13_0_0EXPermissionStatusDenied,
  ABI13_0_0EXPermissionStatusGranted,
  ABI13_0_0EXPermissionStatusUndetermined,
} ABI13_0_0EXPermissionStatus;

@protocol ABI13_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI13_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI13_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI13_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI13_0_0EXPermissionRequester> *)requester;

@end

@interface ABI13_0_0EXPermissions : NSObject <ABI13_0_0RCTBridgeModule, ABI13_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI13_0_0EXPermissionStatus)status;

@end
