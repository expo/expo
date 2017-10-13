// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI22_0_0/ABI22_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI22_0_0EXPermissionExpiresNever;

typedef enum ABI22_0_0EXPermissionStatus {
  ABI22_0_0EXPermissionStatusDenied,
  ABI22_0_0EXPermissionStatusGranted,
  ABI22_0_0EXPermissionStatusUndetermined,
} ABI22_0_0EXPermissionStatus;

@protocol ABI22_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI22_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI22_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI22_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI22_0_0EXPermissionRequester> *)requester;

@end

@interface ABI22_0_0EXPermissions : NSObject <ABI22_0_0RCTBridgeModule, ABI22_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI22_0_0EXPermissionStatus)status;

+ (ABI22_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
