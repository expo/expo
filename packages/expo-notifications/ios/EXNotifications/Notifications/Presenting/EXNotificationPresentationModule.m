// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationPresentationModule.h>

#import <EXNotifications/EXNotificationBuilder.h>

@interface EXNotificationPresentationModule ()

@property (nonatomic, weak) id<EXNotificationBuilder> notificationBuilder;

@end

@implementation EXNotificationPresentationModule

UM_EXPORT_MODULE(ExpoNotificationPresenter);

# pragma mark - Exported methods

UM_EXPORT_METHOD_AS(presentNotificationAsync,
                    presentNotificationWithIdentifier:(NSString *)identifier
                    notification:(NSDictionary *)notificationSpec
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  UNNotificationContent *content = [_notificationBuilder notificationContentFromRequest:notificationSpec];
  UNNotificationTrigger *trigger = nil;
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:trigger];
  [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      NSString *message = [NSString stringWithFormat:@"Notification could not have been presented: %@", error.description];
      reject(@"ERR_NOTIF_PRESENT", message, error);
    } else {
      resolve(nil);
    }
  }];
}

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _notificationBuilder = [moduleRegistry getModuleImplementingProtocol:@protocol(EXNotificationBuilder)];
}

@end
