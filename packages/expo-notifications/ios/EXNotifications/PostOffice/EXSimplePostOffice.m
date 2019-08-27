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

- (void)notifyAboutUserInteractionForAppId:(NSString*)appId
                                  userInteraction:(NSDictionary*)userInteraction
{
  id<EXMailbox> mailbox = [self.mailboxes objectForKey:appId];
  if (mailbox) {
    [mailbox onUserInteraction:userInteraction];
    return;
  }
  
  [self.notificationRepository addUserInteractionForAppId:appId userInteraction:userInteraction];
}

- (void)notifyAboutForegroundNotificationForAppId:(NSString*)appId
                                            notification:(NSDictionary*)notification
{
  id<EXMailbox> mailbox = [self.mailboxes objectForKey:appId];
  if (mailbox) {
    [mailbox onForegroundNotification:notification];
    return;
  }
  
  [self.notificationRepository addForegroundNotificationForAppId:appId foregroundNotification:notification];
}

- (void)registerModuleAndGetPendingDeliveriesWithAppId:(NSString *)appId
                                                      mailbox:(id<EXMailbox>)mailbox
{
  NSLog(@"REGISTER");
  self.mailboxes[appId] = mailbox;
  
  NSArray<NSDictionary*> *pendingForegroundNotifications = [self.notificationRepository getForegroundNotificationsForAppId:appId];
  
  NSArray<NSDictionary*> *pendingUserInteractions = [self.notificationRepository getUserInterationsForAppId:appId];
  
  for (NSDictionary *userInteraction in pendingUserInteractions) {
    [mailbox onUserInteraction:userInteraction];
  }
  
  for (NSDictionary *notification in pendingForegroundNotifications) {
    [mailbox onForegroundNotification:notification];
  }
}

- (void)unregisterModuleWithAppId:(NSString*)appId
{
  NSLog(@"UN REGISTER");
  [self.mailboxes removeObjectForKey:appId];
}

- (void)doWeHaveMailboxRegisteredAsAppId:(NSString*)appId completionHandler:(void (^)(BOOL))completionHandler
{
  id<EXMailbox> mailbox = [self.mailboxes objectForKey:appId];
  completionHandler(mailbox == nil);
}

@end
