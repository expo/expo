//  Copyright © 2018 650 Industries. All rights reserved.

#import "EXUserNotificationCenter.h"

// This class was created in order to provide thread-safety
// for UNUserNotificationCenter on iOS 10 and 11.
// We don't want to add more methods to this class unless
// UNUserNotificationCenter adds those methods,
// and can remove the class when we drop support for iOS 10 and 11.

@implementation EXUserNotificationCenter

static dispatch_once_t queueCreationGuard;
static dispatch_queue_t queue;

- (instancetype)init
{
  if (self = [super init]) {
    dispatch_once(&queueCreationGuard, ^{
      queue = dispatch_queue_create("host.exp.exponent.notifications.center", 0);
    });
  }
  return self;
}

+ (instancetype)sharedInstance
{
  static EXUserNotificationCenter *theCenter;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theCenter) {
      theCenter = [[EXUserNotificationCenter alloc] init];
    }
  });
  return theCenter;
}

- (void)requestAuthorizationWithOptions:(UNAuthorizationOptions)options
                      completionHandler:(void (^)(BOOL granted, NSError *__nullable error))completionHandler {
  dispatch_async(queue,^(void){
    [[UNUserNotificationCenter currentNotificationCenter]
     requestAuthorizationWithOptions:options
     completionHandler:^(BOOL granted, NSError * _Nullable error) {
       dispatch_async(queue,^(void) {
         completionHandler(granted, error);
       }
                      );
     }
     ];
  });
}

- (void)setNotificationCategories:(NSSet<UNNotificationCategory *> *)categories __TVOS_PROHIBITED {
  dispatch_async(queue,^(void){
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:categories];
  });
}

- (void)getNotificationCategoriesWithCompletionHandler:(void(^)(NSSet<UNNotificationCategory *> *categories))completionHandler
__TVOS_PROHIBITED {
  dispatch_async(queue, ^(void){
    [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:
     ^(NSSet<UNNotificationCategory *> *categories) {
       dispatch_async(queue,^(void) {
         completionHandler(categories);
       }
                      );
     }
     ];
  });
}

- (void)getNotificationSettingsWithCompletionHandler:(void(^)(UNNotificationSettings *settings))completionHandler {
  dispatch_async(queue, ^(void){
    [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:
     ^(UNNotificationSettings *settings) {
       dispatch_async(queue,^(void) {
         completionHandler(settings);
       }
                      );
     }
     ];
  });
}

- (void)addNotificationRequest:(UNNotificationRequest *)request
         withCompletionHandler:(nullable void(^)(NSError *__nullable error))completionHandler {
  dispatch_async(queue, ^(void){
    [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:
     ^(NSError *__nullable error) {
       dispatch_async(queue,^(void) {
         completionHandler(error);
       }
                      );
     }
     ];
  });
}

- (void)getPendingNotificationRequestsWithCompletionHandler:(void(^)(NSArray<UNNotificationRequest *> *requests))completionHandler {
  dispatch_async(queue, ^(void){
    [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:
     ^(NSArray<UNNotificationRequest *> *requests) {
       dispatch_async(queue,^(void) {
         completionHandler(requests);
       }
                      );
     }
     ];
  });
}

- (void)removePendingNotificationRequestsWithIdentifiers:(NSArray<NSString *> *)identifiers {
  dispatch_async(queue, ^(void){
    [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:identifiers];
  });
}

- (void)removeAllPendingNotificationRequests {
  dispatch_async(queue, ^(void){
    [[UNUserNotificationCenter currentNotificationCenter] removeAllPendingNotificationRequests];
  });
}

@end
