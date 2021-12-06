// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXPermissionsInterface.h>

@interface ABI44_0_0EXUserFacingNotificationsPermissionsRequester : NSObject <ABI44_0_0EXPermissionsRequester>

- (instancetype)initWithMethodQueue:(dispatch_queue_t)methodQueue;

- (void)requestPermissions:(NSDictionary *)permissions
              withResolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                  rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

+ (void)setRequestedPermissions:(NSDictionary *)permissions;

@end
