// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationsHandlerModule.h"
#import "EXScopedNotificationsUtils.h"

@interface EXScopedNotificationsHandlerModule ()

@property (nonatomic, strong) NSString *scopeKey;

@end

@implementation EXScopedNotificationsHandlerModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
  }
  
  return self;
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  if ([EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_scopeKey]) {
    [super userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
  }
}

@end
