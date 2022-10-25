// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXPermissionsInterface.h>

@interface ABI47_0_0EXUserFacingNotificationsPermissionsRequester : NSObject <ABI47_0_0EXPermissionsRequester>

- (instancetype)initWithMethodQueue:(dispatch_queue_t)methodQueue;

- (void)requestPermissions:(NSDictionary *)permissions
              withResolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                  rejecter:(ABI47_0_0EXPromiseRejectBlock)reject;

+ (void)setRequestedPermissions:(NSDictionary *)permissions;

@end
