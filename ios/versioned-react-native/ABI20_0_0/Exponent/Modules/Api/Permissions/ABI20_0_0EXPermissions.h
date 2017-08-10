// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI20_0_0/ABI20_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI20_0_0EXPermissionExpiresNever;

typedef enum ABI20_0_0EXPermissionStatus {
  ABI20_0_0EXPermissionStatusDenied,
  ABI20_0_0EXPermissionStatusGranted,
  ABI20_0_0EXPermissionStatusUndetermined,
} ABI20_0_0EXPermissionStatus;

@protocol ABI20_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI20_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI20_0_0EXPermissionRequester> *)requester;

@end

@interface ABI20_0_0EXPermissions : NSObject <ABI20_0_0RCTBridgeModule, ABI20_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI20_0_0EXPermissionStatus)status;

+ (ABI20_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
