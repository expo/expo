// Copyright 2019-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXPermissionsInterface.h>

@interface EXUserFacingNotificationsPermissionsRequester : NSObject <EXPermissionsRequester>

- (instancetype)initWithMethodQueue:(dispatch_queue_t)methodQueue;

- (void)requestPermissions:(NSDictionary *)permissions
              withResolver:(EXPromiseResolveBlock)resolve
                  rejecter:(EXPromiseRejectBlock)reject;

+ (void)setRequestedPermissions:(NSDictionary *)permissions;

@end
