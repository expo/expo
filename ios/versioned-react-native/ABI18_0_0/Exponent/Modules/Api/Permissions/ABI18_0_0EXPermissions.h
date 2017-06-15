// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI18_0_0/ABI18_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSString * const ABI18_0_0EXPermissionExpiresNever;

typedef enum ABI18_0_0EXPermissionStatus {
  ABI18_0_0EXPermissionStatusDenied,
  ABI18_0_0EXPermissionStatusGranted,
  ABI18_0_0EXPermissionStatusUndetermined,
} ABI18_0_0EXPermissionStatus;

@protocol ABI18_0_0EXPermissionRequester <NSObject>

- (void)setDelegate:(id)permissionRequesterDelegate;
- (void)requestPermissionsWithResolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject;

@end

@protocol ABI18_0_0EXPermissionRequesterDelegate <NSObject>

- (void)permissionRequesterDidFinish: (NSObject<ABI18_0_0EXPermissionRequester> *)requester;

@end

@interface ABI18_0_0EXPermissions : NSObject <ABI18_0_0RCTBridgeModule, ABI18_0_0EXPermissionRequesterDelegate>

+ (NSString *)permissionStringForStatus:(ABI18_0_0EXPermissionStatus)status;

+ (ABI18_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions;

@end
