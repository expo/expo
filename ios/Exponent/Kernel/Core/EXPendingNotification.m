// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXPendingNotification.h"
#import <UIKit/UIKit.h>

@interface EXPendingNotification ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, strong) NSDictionary *body;
@property (nonatomic, assign) BOOL isRemote;
@property (nonatomic, assign) BOOL isFromBackground;
@property (nonatomic, strong) NSString *actionId;
@property (nonatomic, strong) NSString *userText;

@end

@implementation EXPendingNotification

- (instancetype)initWithNotification:(UNNotification *)notification
{
  NSDictionary *payload = notification.request.content.userInfo ?: @{};
  return [self initWithExperienceId:payload[@"experienceId"]
                   notificationBody:payload[@"body"]
                           isRemote:[notification.request.trigger isKindOfClass:[UNPushNotificationTrigger class]]
                   isFromBackground:NO
                           actionId:nil
                           userText:nil];
}

- (instancetype)initWithNotificationResponse:(UNNotificationResponse *)notificationResponse identifiersManager:(id<EXNotificationsIdentifiersManager>)manager
{
  if (self = [self initWithNotification:notificationResponse.notification]) {
    _isFromBackground = [UIApplication sharedApplication].applicationState != UIApplicationStateActive;
    if (![notificationResponse.actionIdentifier isEqualToString:UNNotificationDefaultActionIdentifier]) {
      _actionId = [manager exportedIdForInternalIdentifier:notificationResponse.actionIdentifier];
    }
    if ([notificationResponse isKindOfClass:[UNTextInputNotificationResponse class]]) {
      _userText = ((UNTextInputNotificationResponse *) notificationResponse).userText;
    }
  }
  return self;
}

- (instancetype)initWithExperienceId:(NSString *)experienceId
                    notificationBody:(NSDictionary *)body
                            isRemote:(BOOL)isRemote
                    isFromBackground:(BOOL)isFromBackground
                            actionId:(NSString *)actionId
                            userText:(NSString *)userText {
  if (self = [super init]) {
    _isRemote = isRemote;
    _isFromBackground = isFromBackground;
    _experienceId = experienceId;
    _body = body ?: @{};
    _actionId = actionId;
    _userText = userText;
  }
  return self;
}

- (NSDictionary *)properties
{
  // if the notification came from the background, in most but not all cases, this means the user acted on an iOS notification
  // and caused the app to launch.
  // From SO:
  // > Note that "App opened from Notification" will be a false positive if the notification is sent while the user is on a different
  // > screen (for example, if they pull down the status bar and then receive a notification from your app).
  return @{
           @"origin": (_isFromBackground) ? @"selected" : @"received",
           @"remote": @(_isRemote),
           @"data": _body,
           @"actionId": _actionId ?: [NSNull null],
           @"userText": _userText ?: [NSNull null]
           };
}

@end
