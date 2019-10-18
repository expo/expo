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

- (void)registerModuleAndGetInitialNotificationWithAppId:(NSString *)appId
                                               mailbox:(id<EXMailbox>)mailbox
                                     completionHandler:(void (^)(NSDictionary*))completionHandler
{
  self.mailboxes[appId] = mailbox;
  
  NSDictionary *initialUserInteraction = [_notificationRepository getUserInterationForAppId:appId];
  
  completionHandler(initialUserInteraction);
}

- (void)unregisterModuleWithAppId:(NSString*)appId
{
  [self.mailboxes removeObjectForKey:appId];
}

- (void)tryToSendForegroundNotificationTo:(NSString*)appId foregroundNotification:(NSDictionary*)foregroundNotification completionHandler:(void (^)(BOOL))completionHandler
{
  id<EXMailbox> mailbox = [self.mailboxes objectForKey:appId];
  if (mailbox != nil) {
    [mailbox onForegroundNotification:foregroundNotification];
  }
  completionHandler(mailbox != nil);
}

@end
