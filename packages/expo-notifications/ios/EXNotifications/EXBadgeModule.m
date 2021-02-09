// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXBadgeModule.h>
#import <UMCore/UMUtilities.h>
#import <UserNotifications/UserNotifications.h>

@implementation EXBadgeModule

UM_EXPORT_MODULE(ExpoBadgeModule)

UM_EXPORT_METHOD_AS(getBadgeCountAsync,
                    getBadgeCountAsync:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([UMSharedApplication() applicationIconBadgeNumber]));
  });
}

UM_EXPORT_METHOD_AS(setBadgeCountAsync,
                    setBadgeCountAsync:(NSNumber *)badgeCount
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (settings.badgeSetting == UNNotificationSettingEnabled) {
        [UMSharedApplication() setApplicationIconBadgeNumber:badgeCount.integerValue];
        resolve(@(YES));
      } else {
        resolve(@(NO));
      }
    });
  }];
}

@end
