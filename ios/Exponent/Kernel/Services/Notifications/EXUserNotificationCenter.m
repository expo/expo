// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXUserNotificationCenter.h"

// This class was created in order to provide thread-safety
// for UNUserNotificationCenter on iOS 10 and 11.
// We don't want to add more methods to this class unless
// UNUserNotificationCenter adds those methods,
// and can remove the class when we drop support for iOS 10 and 11.

@implementation EXUserNotificationCenter

static dispatch_queue_t queue;

- (instancetype)init
{
  if (self = [super init]) {
    static dispatch_once_t queueCreationGuard;
    dispatch_once(&queueCreationGuard, ^{
      queue = dispatch_queue_create("host.exp.exponent.EXUserNotificationCenter", DISPATCH_QUEUE_SERIAL);
    });
  }
  return self;
}

- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options completionHandler:(void (^)(BOOL granted, NSError *__nullable error))completionHandler {
  dispatch_async(queue, ^{
    [[UNUserNotificationCenter currentNotificationCenter] requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError * _Nullable error) {
      dispatch_async(queue, ^{
        completionHandler(granted, error);
      });
    }];
  });
}

- (void)setNotificationCategories:(NSSet<UNNotificationCategory *> *)categories {
  dispatch_async(queue, ^{
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:categories];
  });
}

- (void)getNotificationCategoriesWithCompletionHandler:(void(^)(NSSet<UNNotificationCategory *> *categories))completionHandler {
  dispatch_async(queue, ^{
    [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> * _Nonnull categories) {
      dispatch_async(queue, ^{
        completionHandler(categories);
      });
    }];
  });
}

- (void)getNotificationSettingsWithCompletionHandler:(void(^)(UNNotificationSettings *settings))completionHandler {
  dispatch_async(queue, ^{
    [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
      dispatch_async(queue, ^{
        completionHandler(settings);
      });
    }];
  });
}

- (void)addNotificationRequest:(UNNotificationRequest *)request withCompletionHandler:(nullable void(^)(NSError *__nullable error))completionHandler {
  dispatch_async(queue, ^{
    [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:^(NSError *__nullable error) {
       dispatch_async(queue, ^{
         completionHandler(error);
       });
    }];
  });
}

- (void)getPendingNotificationRequestsWithCompletionHandler:(void(^)(NSArray<UNNotificationRequest *> *requests))completionHandler {
  dispatch_async(queue, ^{
    [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
      dispatch_async(queue, ^{
        completionHandler(requests);
      });
    }];
  });
}

- (void)removePendingNotificationRequestsWithIdentifiers:(NSArray<NSString *> *)identifiers {
  dispatch_async(queue, ^{
    [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:identifiers];
  });
}

- (void)removeAllPendingNotificationRequests {
  dispatch_async(queue, ^{
    [[UNUserNotificationCenter currentNotificationCenter] removeAllPendingNotificationRequests];
  });
}

@end
