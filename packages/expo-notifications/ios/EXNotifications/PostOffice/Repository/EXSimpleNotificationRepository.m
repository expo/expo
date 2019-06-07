//  Copyright © 2019-present 650 Industries. All rights reserved.

#import "EXSimpleNotificationRepository.h"

@interface EXSimpleNotificationRepository()

@property (nonatomic) NSUserDefaults *foregroundNotifications;

@property (nonatomic) NSUserDefaults *userIntercations;

@end

@implementation EXSimpleNotificationRepository

- (instancetype)init
{
  if (self = [super init]) {
    self.foregroundNotifications = [[NSUserDefaults alloc] initWithSuiteName:@"EX_POST_OFFICE_FN"];
    self.userIntercations = [[NSUserDefaults alloc] initWithSuiteName:@"EX_POST_OFFICE_UI"];
  }
  return self;
}

- (void)addForegroundNotificationForAppId:(NSString *)appId foregroundNotification:(NSDictionary *)foregroundNotification
{
  NSMutableArray<NSDictionary*> *notificationList = [[self.foregroundNotifications arrayForKey:appId] mutableCopy];
  if (!notificationList) {
    notificationList = [NSMutableArray<NSDictionary *> new];
  }
  
  [notificationList addObject:foregroundNotification];
  [self.foregroundNotifications setObject:notificationList forKey:appId];
}

- (void)addUserInteractionForAppId:(NSString *)appId userInteraction:(NSDictionary*)userInteraction
{
  NSMutableArray<NSDictionary*> *userInteractionList = [[self.userIntercations arrayForKey:appId] mutableCopy];
  if (!userInteractionList) {
    userInteractionList = [NSMutableArray<NSDictionary *> new];
  }
  
  [userInteractionList addObject:userInteraction];
  [self.userIntercations setObject:userInteractionList forKey:appId];
}

- (NSArray<NSDictionary *> *)getForegroundNotificationsForAppId:(NSString *)appId
{
  NSMutableArray<NSDictionary*> *notificationList = [[self.foregroundNotifications arrayForKey:appId] mutableCopy];
  if (!notificationList) {
    notificationList = [NSMutableArray<NSDictionary *> new];
  }
  
  [self.foregroundNotifications setObject:@[] forKey:appId];
  return notificationList;
}

- (NSArray<NSDictionary *> *)getUserInterationsForAppId:(NSString *)appId
{
  NSMutableArray<NSDictionary*> *userInteractionList = [[self.userIntercations arrayForKey:appId] mutableCopy];
  if (!userInteractionList) {
    userInteractionList = [NSMutableArray<NSDictionary *> new];
  }
  
  [self.userIntercations setObject:@[] forKey:appId];
  return userInteractionList;
}

@end
