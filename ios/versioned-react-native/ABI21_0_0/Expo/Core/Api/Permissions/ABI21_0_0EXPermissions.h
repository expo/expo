// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI21_0_0/ABI21_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI21_0_0EXPermissionExpiresNever;

typedef enum ABI21_0_0EXPermissionStatus {
  ABI21_0_0EXPermissionStatusDenied,
  ABI21_0_0EXPermissionStatusGranted,
  ABI21_0_0EXPermissionStatusUndetermined,
} ABI21_0_0EXPermissionStatus;

@protocol ABI21_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI21_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI21_0_0EXPermissionRequester> *)requester;

@end

@interface ABI21_0_0EXPermissions : NSObject <ABI21_0_0RCTBridgeModule, ABI21_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI21_0_0EXPermissionStatus)status;

+ (ABI21_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
