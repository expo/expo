// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI17_0_0EXPermissionExpiresNever;

typedef enum ABI17_0_0EXPermissionStatus {
  ABI17_0_0EXPermissionStatusDenied,
  ABI17_0_0EXPermissionStatusGranted,
  ABI17_0_0EXPermissionStatusUndetermined,
} ABI17_0_0EXPermissionStatus;

@protocol ABI17_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI17_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI17_0_0EXPermissionRequester> *)requester;

@end

@interface ABI17_0_0EXPermissions : NSObject <ABI17_0_0RCTBridgeModule, ABI17_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI17_0_0EXPermissionStatus)status;

+ (ABI17_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
