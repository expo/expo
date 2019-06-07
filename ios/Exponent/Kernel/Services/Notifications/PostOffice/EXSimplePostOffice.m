//  Copyright © 2019-present 650 Industries. All rights reserved.

#import "EXSimplePostOffice.h"

#import "EXNotificationRepository.h"

@interface EXSimplePostOffice()

@property (nonatomic) NSMutableDictionary *mailboxes;

@property (nonatomic) id<EXNotificationRepository> notificationRepository;

@end

@implementation EXSimplePostOffice

- (instancetype)initWithNotificationRepository:(id<EXNotificationRepository>)notificationRepository
{
  if (self = [super init]) {
    self.mailboxes = [NSMutableDictionary new];
    self.notificationRepository = notificationRepository;
  }
  return self;
}

- (void)notifyAboutUserInteractionForExperienceId:(NSString*)experienceId
                                  userInteraction:(NSDictionary*)userInteraction
{
  id<EXMailbox> mailbox = [self.mailboxes objectForKey:experienceId];
  if (mailbox) {
    [mailbox onUserInteraction:userInteraction];
    return;
  }
  
  [self.notificationRepository addUserInteractionForExperienceId:experienceId       userInteraction:userInteraction];
}

- (void)notifyAboutForegroundNotificationForExperienceId:(NSString*)experienceId
                                            notification:(NSDictionary*)notification
{
  id<EXMailbox> mailbox = [self.mailboxes objectForKey:experienceId];
  if (mailbox) {
    [mailbox onForegroundNotification:notification];
    return;
  }
  
  [self.notificationRepository addForegroundNotificationForExperienceId:experienceId foregroundNotification:notification];
}

- (void)registerModuleAndGetPendingDeliveriesWithExperienceId:(NSString*)experienceId
                                                      mailbox:(id<EXMailbox>)mailbox
{
  self.mailboxes[experienceId] = mailbox;
  
  NSArray<NSDictionary*> *pendingForegroundNotifications = [self.notificationRepository getForegroundNotificationsForExperienceId:experienceId];
  
  NSArray<NSDictionary*> *pendingUserInteractions = [self.notificationRepository getUserInterationsForExperienceId:experienceId];
  
  for (NSDictionary *userInteraction in pendingUserInteractions) {
    [mailbox onUserInteraction:userInteraction];
  }
  
  for (NSDictionary *notification in pendingForegroundNotifications) {
    [mailbox onForegroundNotification:notification];
  }
}

- (void)unregisterModuleWithExperienceId:(NSString*)experienceId
{
  [self.mailboxes removeObjectForKey:experienceId];
}

@end
