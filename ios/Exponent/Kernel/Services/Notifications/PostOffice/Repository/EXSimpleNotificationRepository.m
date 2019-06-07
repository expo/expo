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

- (void)addForegroundNotificationForExperienceId:(NSString *)experienceId foregroundNotification:(NSDictionary *)foregroundNotification
{
  NSMutableArray<NSDictionary*> *notificationList = [[self.foregroundNotifications arrayForKey:experienceId] mutableCopy];
  if (!notificationList) {
    notificationList = [NSMutableArray<NSDictionary *> new];
  }
  
  [notificationList addObject:foregroundNotification];
  [self.foregroundNotifications setObject:notificationList forKey:experienceId];
}

- (void)addUserInteractionForExperienceId:(NSString *)experienceId userInteraction:(NSDictionary*)userInteraction
{
  NSMutableArray<NSDictionary*> *userInteractionList = [[self.userIntercations arrayForKey:experienceId] mutableCopy];
  if (!userInteractionList) {
    userInteractionList = [NSMutableArray<NSDictionary *> new];
  }
  
  [userInteractionList addObject:userInteraction];
  [self.userIntercations setObject:userInteractionList forKey:experienceId];
}

- (NSArray<NSDictionary *> *)getForegroundNotificationsForExperienceId:(NSString *)experienceId
{
  NSMutableArray<NSDictionary*> *notificationList = [[self.foregroundNotifications arrayForKey:experienceId] mutableCopy];
  if (!notificationList) {
    notificationList = [NSMutableArray<NSDictionary *> new];
  }
  
  [self.foregroundNotifications setObject:@[] forKey:experienceId];
  return notificationList;
}

- (NSArray<NSDictionary *> *)getUserInterationsForExperienceId:(NSString *)experienceId
{
  NSMutableArray<NSDictionary*> *userInteractionList = [[self.userIntercations arrayForKey:experienceId] mutableCopy];
  if (!userInteractionList) {
    userInteractionList = [NSMutableArray<NSDictionary *> new];
  }
  
  [self.userIntercations setObject:@[] forKey:experienceId];
  return userInteractionList;
}

@end
