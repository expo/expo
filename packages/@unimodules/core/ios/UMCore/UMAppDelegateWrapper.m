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
