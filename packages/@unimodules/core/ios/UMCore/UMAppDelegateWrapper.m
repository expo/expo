// Copyright © 2018 650 Industries. All rights reserved.

#import <UMCore/UMAppDelegateWrapper.h>
#import <Foundation/FoundationErrors.h>
#import <UMCore/UMModuleRegistryProvider.h>

static NSMutableArray<id<UIApplicationDelegate>> *subcontractors;
static NSMutableDictionary<NSString*,NSArray<id<UIApplicationDelegate>>*> *subcontractorsForSelector;
static dispatch_once_t onceToken;

@implementation UMAppDelegateWrapper

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  BOOL answer = NO;
  
  SEL selector = @selector(application:didFinishLaunchingWithOptions:);
   NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  for(id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    BOOL subcontractorAnswer = NO;
      subcontractorAnswer = [subcontractor application:application didFinishLaunchingWithOptions:launchOptions];
    answer  = answer || subcontractorAnswer;
  }
  
  return answer;
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  
  SEL selector = @selector(application:openURL:options:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  for(id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    BOOL subcontractorAnswer = [subcontractor application:app openURL:url options:options];
    if (subcontractorAnswer) {
      return YES;
    }
  }
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  SEL selector = @selector(application:performFetchWithCompletionHandler:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  __block NSUInteger working = [subcontractorsArray count] ;
  __block UIBackgroundFetchResult fetchResult = UIBackgroundFetchResultNoData;
  __block NSObject *lock = [NSObject new];
  
  void (^handler)(UIBackgroundFetchResult) = ^(UIBackgroundFetchResult result) {
    @synchronized (lock) {
      if (result == UIBackgroundFetchResultFailed) {
        fetchResult = UIBackgroundFetchResultFailed;
      } else if (fetchResult != UIBackgroundFetchResultFailed && result == UIBackgroundFetchResultNewData) {
        fetchResult = UIBackgroundFetchResultNewData;
      }
      
      working--;
      if (working == 0) {
        completionHandler(fetchResult);
      }
    }
  };
  
  for (id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    [subcontractor application:application performFetchWithCompletionHandler:handler];
  }
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  SEL selector = @selector(application:continueUserActivity:restorationHandler:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  __block NSMutableArray<id<UIUserActivityRestoring>> * _Nullable mergedParams = [NSMutableArray new];
  __block NSUInteger working = [subcontractorsArray count] ;
  __block NSObject *lock = [NSObject new];
  
  void (^handler)(NSArray<id<UIUserActivityRestoring>> * _Nullable) = ^(NSArray<id<UIUserActivityRestoring>> * _Nullable param) {
    @synchronized (lock) {
      
      [mergedParams addObjectsFromArray:param];
      
      working--;
      if (working == 0) {
        restorationHandler(mergedParams);
      }
    }
  };
  
   BOOL result = NO;
  
  for (id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    result = result || [subcontractor application:application continueUserActivity:userActivity restorationHandler:handler];
  }
  return result;
}

#pragma mark - Notifications

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token
{
  SEL selector = @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  for(id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    [subcontractor application:application didRegisterForRemoteNotificationsWithDeviceToken:token];
  }
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err
{
  SEL selector = @selector(application:didFailToRegisterForRemoteNotificationsWithError:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  for(id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    [subcontractor application:application didFailToRegisterForRemoteNotificationsWithError:err];
  }
}

// TODO: Remove once SDK31 is phased out
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(nonnull UIUserNotificationSettings *)notificationSettings
{
  SEL selector = @selector(application:didRegisterUserNotificationSettings:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  for(id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    [subcontractor application:application didRegisterUserNotificationSettings:notificationSettings];
  }
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  SEL selector = @selector(application:didReceiveRemoteNotification:fetchCompletionHandler:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  __block NSUInteger working = [subcontractorsArray count] ;
  __block UIBackgroundFetchResult fetchResult = UIBackgroundFetchResultNoData;
  __block NSObject *lock = [NSObject new];
  
  void (^handler)(UIBackgroundFetchResult) = ^(UIBackgroundFetchResult result) {
    @synchronized (lock) {
      if (result == UIBackgroundFetchResultFailed) {
        fetchResult = UIBackgroundFetchResultFailed;
      } else if (fetchResult != UIBackgroundFetchResultFailed && result == UIBackgroundFetchResultNewData) {
        fetchResult = UIBackgroundFetchResultNewData;
      }
      
      working--;
      if (working == 0) {
        completionHandler(fetchResult);
      }
    }
  };
  
  for (id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    [subcontractor application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:handler];
  }
}


#pragma mark - Subcontractors

- (void) initSubcontractorsOnce {
  dispatch_once(&onceToken, ^{
    subcontractors = [[NSMutableArray alloc] init];
    subcontractorsForSelector = [NSMutableDictionary new];
    
    NSArray<UMSingletonModule*> * singletonModules = [[[UMModuleRegistryProvider singletonModules] allObjects] mutableCopy];
    
    for (UMSingletonModule *singletonModule in singletonModules) {
      if ([singletonModule conformsToProtocol:@protocol(UIApplicationDelegate)]) {
        id<UIApplicationDelegate> subcontractor = singletonModule;
        [subcontractors addObject:subcontractor];
      }
    }
  });
}

- (NSArray<id<UIApplicationDelegate>> *) getSubcontractorsImplementingSelector:(SEL) selector {
  
  [self initSubcontractorsOnce];
  
  NSString *selectorKey = NSStringFromSelector(selector);
  
  if ([subcontractorsForSelector objectForKey:selectorKey] != nil) {
    return [subcontractorsForSelector objectForKey:selectorKey];
  }
  
  NSMutableArray<id<UIApplicationDelegate>> *result = [NSMutableArray new];
  
  for (id<UIApplicationDelegate> subcontractor in subcontractors) {
    if ([subcontractor respondsToSelector:selector]) {
      [result addObject:subcontractor];
    }
  }
  
  [subcontractorsForSelector setObject:result forKey:selectorKey];
  
  return result;
}


@end
