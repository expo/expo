// Copyright 2019-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXPermissionsInterface.h>
#import <UserNotifications/UserNotifications.h>

@interface EXUserFacingNotificationsPermissionsRequester : NSObject <EXPermissionsRequester>

@property (nonatomic, assign) UNAuthorizationOptions authorizationOptions;

- (void)requestAuthorizationOptions:(UNAuthorizationOptions)options
                       withResolver:(EXPromiseResolveBlock)resolve
                           rejecter:(EXPromiseRejectBlock)reject;

@end
