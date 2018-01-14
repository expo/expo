// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI25_0_0/ABI25_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI25_0_0EXPermissionExpiresNever;

typedef enum ABI25_0_0EXPermissionStatus {
  ABI25_0_0EXPermissionStatusDenied,
  ABI25_0_0EXPermissionStatusGranted,
  ABI25_0_0EXPermissionStatusUndetermined,
} ABI25_0_0EXPermissionStatus;

@protocol ABI25_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI25_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI25_0_0EXPermissionRequester> *)requester;

@end

@interface ABI25_0_0EXPermissions : NSObject <ABI25_0_0RCTBridgeModule, ABI25_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI25_0_0EXPermissionStatus)status;

+ (ABI25_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
