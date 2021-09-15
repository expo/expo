// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>

@interface ABI42_0_0EXUserFacingNotificationsPermissionsRequester : NSObject <ABI42_0_0EXPermissionsRequester>

- (instancetype)initWithMethodQueue:(dispatch_queue_t)methodQueue;

- (void)requestPermissions:(NSDictionary *)permissions
              withResolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                  rejecter:(ABI42_0_0UMPromiseRejectBlock)reject;

+ (void)setRequestedPermissions:(NSDictionary *)permissions;

@end
