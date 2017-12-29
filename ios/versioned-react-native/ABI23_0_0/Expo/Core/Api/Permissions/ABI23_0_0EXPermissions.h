// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI23_0_0EXPermissionExpiresNever;

typedef enum ABI23_0_0EXPermissionStatus {
  ABI23_0_0EXPermissionStatusDenied,
  ABI23_0_0EXPermissionStatusGranted,
  ABI23_0_0EXPermissionStatusUndetermined,
} ABI23_0_0EXPermissionStatus;

@protocol ABI23_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI23_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI23_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI23_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI23_0_0EXPermissionRequester> *)requester;

@end

@interface ABI23_0_0EXPermissions : NSObject <ABI23_0_0RCTBridgeModule, ABI23_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI23_0_0EXPermissionStatus)status;

+ (ABI23_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
