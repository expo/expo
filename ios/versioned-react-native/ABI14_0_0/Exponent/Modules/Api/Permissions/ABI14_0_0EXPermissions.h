// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI14_0_0/ABI14_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI14_0_0EXPermissionExpiresNever;

typedef enum ABI14_0_0EXPermissionStatus {
  ABI14_0_0EXPermissionStatusDenied,
  ABI14_0_0EXPermissionStatusGranted,
  ABI14_0_0EXPermissionStatusUndetermined,
} ABI14_0_0EXPermissionStatus;

@protocol ABI14_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI14_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI14_0_0EXPermissionRequester> *)requester;

@end

@interface ABI14_0_0EXPermissions : NSObject <ABI14_0_0RCTBridgeModule, ABI14_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI14_0_0EXPermissionStatus)status;

@end
