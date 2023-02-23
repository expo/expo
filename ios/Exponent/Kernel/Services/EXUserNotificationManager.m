// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUserNotificationManager.h"
#import "EXKernel.h"
#import "EXRemoteNotificationManager.h"
#import "EXEnvironment.h"
#import "EXAbstractLoader.h"

@import EXManifests;

static NSString * const scopedIdentifierSeparator = @":";

@interface EXUserNotificationManager ()

@property (nonatomic, strong) EXPendingNotification *pendingNotification;

@end

@implementation EXUserNotificationManager

- (EXPendingNotification *)initialNotification
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return _pendingNotification;
  }

  return nil;
}

# pragma mark - EXNotificationsIdentifiersManager

- (NSString *)internalIdForIdentifier:(NSString *)identifier scopeKey:(nonnull NSString *)scopeKey
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return identifier;
  }
  return [NSString stringWithFormat:@"%@%@%@", scopeKey, scopedIdentifierSeparator, identifier];
}

- (NSString *)exportedIdForInternalIdentifier:(NSString *)identifier
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return identifier;
  }
  NSArray<NSString *> *components = [identifier componentsSeparatedByString:scopedIdentifierSeparator];
  return [[components subarrayWithRange:NSMakeRange(1, components.count - 1)] componentsJoinedByString:scopedIdentifierSeparator];
}

# pragma mark - UNUserNotificationCenterDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  EXPendingNotification *pendingNotification = [[EXPendingNotification alloc] initWithNotificationResponse:response identifiersManager:self];
  if (![[EXKernel sharedInstance] sendNotification:pendingNotification] && [EXEnvironment sharedEnvironment].isDetached) {
    _pendingNotification = pendingNotification;
  }
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  BOOL shouldDisplayInForeground = NO;

  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  if (visibleApp) {
    EXManifestsManifest *visibleAppManifest = visibleApp.appLoader.manifest;
    if (visibleAppManifest && visibleAppManifest.notificationPreferences && visibleAppManifest.notificationPreferences[@"iosDisplayInForeground"]) {
      // If user specifically set `notification.iosDisplayInForeground` in `app.json`.
      shouldDisplayInForeground = [visibleAppManifest.notificationPreferences[@"iosDisplayInForeground"] boolValue];
    }
  }

  // Notifications were only shown while the app wasn't active or if the user specifies to do so.
  if ([UIApplication sharedApplication].applicationState != UIApplicationStateActive || shouldDisplayInForeground) {
    // TODO(iOS 14): use UNNotificationPresentationOptionList and UNNotificationPresentationOptionBanner
    completionHandler(
                      UNNotificationPresentationOptionAlert +
                      UNNotificationPresentationOptionSound +
                      UNNotificationPresentationOptionBadge
                      );
    return;
  }
  // If the app is active we do not show the alert, but we deliver the notification to the experience.

  EXPendingNotification *pendingNotification = [[EXPendingNotification alloc] initWithNotification:notification];
  if (![[EXKernel sharedInstance] sendNotification:pendingNotification] && [EXEnvironment sharedEnvironment].isDetached) {
    _pendingNotification = pendingNotification;
  }

  completionHandler(UNNotificationPresentationOptionNone);
}

@end
