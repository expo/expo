// Copyright 2019-present 650 Industries. All rights reserved.

#import "EXUserNotificationsDispatcher.h"
#import "EXKernel.h"
#import "EXUserNotificationManager.h"

@interface EXUserNotificationsDispatcher()

@property (strong)NSMutableDictionary<NSString *, id> *delegates;

@end

@implementation EXUserNotificationsDispatcher

- (instancetype)init
{
  if (self = [super init]) {
    self.delegates = [NSMutableDictionary new];
  }
  return self;
}

+ (nonnull instancetype)sharedInstance
{
  static EXUserNotificationsDispatcher *dispatcher = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    dispatcher = [EXUserNotificationsDispatcher new];
  });
  return dispatcher;
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  NSDictionary *userInfo = notification.request.content.userInfo;
  NSString *experienceId = userInfo[@"appId"] ? userInfo[@"appId"] : userInfo[@"experienceId"];
  id<UNUserNotificationCenterDelegate> delegate = [self getDelegateForExperienceId:experienceId];
  [delegate userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void(^)(void))completionHandler
{
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  NSString *experienceId = userInfo[@"appId"] ? userInfo[@"appId"] : userInfo[@"experienceId"];
  id<UNUserNotificationCenterDelegate> delegate = [self getDelegateForExperienceId:experienceId];
  [delegate userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
}

- (id<UNUserNotificationCenterDelegate>)getDelegateForExperienceId:(NSString *)experienceId
{
  NSUserDefaults *registry = [[NSUserDefaults alloc] initWithSuiteName:@"EXPERIENCE_ID_REGISTRY"];
  NSString *sdk = (NSString *)[registry objectForKey:experienceId];
  if (sdk == nil) {
    sdk = @"UNVERSIONED";
  }
  
  if ([sdk isEqualToString:@"UNVERSIONED"]) {
    return [EXUserNotificationManager new];
  }
  
  NSString *sdkPrefix = [sdk componentsSeparatedByString:@"."][0];
  int sdkNumber = [sdkPrefix intValue];
  
  if (sdkNumber <= 35) {
    return (id<UNUserNotificationCenterDelegate>)[EXKernel sharedInstance].serviceRegistry.notificationsManager;
  }
  
  NSString *className = [NSString stringWithFormat:@"ABI%@_0_0EXUserNotificationManager", sdkPrefix];
  id delegate = [self getDelegateForClassName:className];
  return (id<UNUserNotificationCenterDelegate>)delegate;
}

- (id)getDelegateForClassName:(NSString *)className
{
  id delegate = _delegates[className];
  if (delegate == nil) {
    delegate = [[NSClassFromString(className) alloc] init];
    _delegates[className] = delegate;
  }
  return delegate;
}

@end
