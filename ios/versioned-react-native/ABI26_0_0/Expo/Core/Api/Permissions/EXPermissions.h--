// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI26_0_0/ABI26_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI26_0_0EXPermissionExpiresNever;

typedef enum ABI26_0_0EXPermissionStatus {
  ABI26_0_0EXPermissionStatusDenied,
  ABI26_0_0EXPermissionStatusGranted,
  ABI26_0_0EXPermissionStatusUndetermined,
} ABI26_0_0EXPermissionStatus;

@protocol ABI26_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI26_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI26_0_0EXPermissionRequester> *)requester;

@end

@interface ABI26_0_0EXPermissions : NSObject <ABI26_0_0RCTBridgeModule, ABI26_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI26_0_0EXPermissionStatus)status;

+ (ABI26_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
