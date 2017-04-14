// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI16_0_0/ABI16_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI16_0_0EXPermissionExpiresNever;

typedef enum ABI16_0_0EXPermissionStatus {
  ABI16_0_0EXPermissionStatusDenied,
  ABI16_0_0EXPermissionStatusGranted,
  ABI16_0_0EXPermissionStatusUndetermined,
} ABI16_0_0EXPermissionStatus;

@protocol ABI16_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI16_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI16_0_0EXPermissionRequester> *)requester;

@end

@interface ABI16_0_0EXPermissions : NSObject <ABI16_0_0RCTBridgeModule, ABI16_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI16_0_0EXPermissionStatus)status;

+ (ABI16_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
