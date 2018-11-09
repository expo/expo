// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUserNotificationManager.h"
#import "EXKernel.h"
#import "EXRemoteNotificationManager.h"
#import "EXEnvironment.h"

@interface EXUserNotificationManager ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, EXPendingNotification *> *pendingNotifications;

@end

@implementation EXUserNotificationManager

- (instancetype)init
{
  if (self = [super init]) {
    _pendingNotifications = [NSMutableDictionary new];
  }
  return self;
}

- (EXPendingNotification *)initialNotificationForExperience:(NSString *)experienceId
{
  return _pendingNotifications[experienceId];
}

# pragma mark - UNUserNotificationCenterDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  EXPendingNotification *pendingNotification = [[EXPendingNotification alloc] initWithNotificationResponse:response];
  if (pendingNotification && ![[EXKernel sharedInstance] sendNotification:pendingNotification]) {
    _pendingNotifications[pendingNotification.experienceId] = pendingNotification;
  }
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  // With UIUserNotifications framework, notifications were only shown while the app wasn't active.
  // Let's stick to this behavior.
  if ([UIApplication sharedApplication].applicationState != UIApplicationStateActive) {
    completionHandler(UNNotificationPresentationOptionAlert + UNNotificationPresentationOptionSound);
    return;
  }
  // If the app is active we do not show the alert, but we deliver the notification to the experience.

  EXPendingNotification *pendingNotification = [[EXPendingNotification alloc] initWithNotification:notification];
  if (![[EXKernel sharedInstance] sendNotification:pendingNotification]) {
    _pendingNotifications[pendingNotification.experienceId] = pendingNotification;
  }

  completionHandler(UNNotificationPresentationOptionNone);
}

@end
