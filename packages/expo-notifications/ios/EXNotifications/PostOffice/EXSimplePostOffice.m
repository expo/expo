//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXSimplePostOffice.h>

#import <EXNotifications/EXNotificationRepository.h>

@interface EXSimplePostOffice ()

@property(nonatomic) NSMutableDictionary *mailboxes;

@property(nonatomic) id<EXNotificationRepository> notificationRepository;

@end

@implementation EXSimplePostOffice

- (instancetype)initWithNotificationRepository:
    (id<EXNotificationRepository>)notificationRepository {
  if (self = [super init]) {
    self.mailboxes = [NSMutableDictionary new];
    self.notificationRepository = notificationRepository;
  }
  return self;
}

- (void)notifyAboutUserInteractionForAppId:(NSString *)appId
                           userInteraction:(NSDictionary *)userInteraction {
  id<EXMailbox> mailbox = [self.mailboxes objectForKey:appId];
  if (mailbox) {
    [mailbox onUserInteraction:userInteraction];
    return;
  }

  [self.notificationRepository addUserInteractionForAppId:appId userInteraction:userInteraction];
}

- (void)registerModuleAndFlushPendingUserIntercationsWithAppId:(NSString *)appId
                                                       mailbox:(id<EXMailbox>)mailbox {
  if (self.mailboxes[appId]) {
    return;
  }

  self.mailboxes[appId] = mailbox;

  NSArray<NSDictionary *> *initialUserInteraction =
      [_notificationRepository getPendingUserInterationsForAppId:appId];
  for (NSDictionary *userInteraction in initialUserInteraction) {
    [mailbox onUserInteraction:userInteraction];
  }
}

- (void)unregisterModuleWithAppId:(NSString *)appId {
  [self.mailboxes removeObjectForKey:appId];
}

- (void)tryToSendForegroundNotificationTo:(NSString *)appId
                   foregroundNotification:(NSDictionary *)foregroundNotification
                        completionHandler:(void (^)(BOOL))completionHandler {
  id<EXMailbox> mailbox = [self.mailboxes objectForKey:appId];
  if (mailbox != nil) {
    [mailbox onForegroundNotification:foregroundNotification];
  }
  completionHandler(mailbox != nil);
}

@end
