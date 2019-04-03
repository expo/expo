// Copyright © 2018 650 Industries. All rights reserved.

#import <UMCore/UMAppDelegateWrapper.h>
#import <Foundation/FoundationErrors.h>

static NSMutableArray<id<UIApplicationDelegate>> *subcontractors;
static dispatch_once_t onceToken;

extern void UMRegisterSubcontractor(id<UIApplicationDelegate> subcontractorClass)
{
  dispatch_once(&onceToken, ^{
    subcontractors = [[NSMutableArray alloc] init];
  });
  [subcontractors addObject:subcontractorClass];
}

@implementation UMAppDelegateWrapper

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  BOOL answer = NO;
  
  SEL selector = @selector(application:didFinishLaunchingWithOptions:);
  
  for(id<UIApplicationDelegate> subcontractor in subcontractors) {
    BOOL subcontractorAnswer = NO;
    if ([subcontractor respondsToSelector:selector]) {
      subcontractorAnswer = [subcontractor application:application didFinishLaunchingWithOptions:launchOptions];
    }
    answer  = answer || subcontractorAnswer;
  }
  
  return answer;
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  
  SEL selector = @selector(application:openURL:options:);
  
  for(id<UIApplicationDelegate> subcontractor in subcontractors) {
    if (![subcontractor respondsToSelector:selector]) {
      continue;
    }
    BOOL subcontractorAnswer = [subcontractor application:app openURL:url options:options];
    if (subcontractorAnswer) {
      return YES;
    }
  }
  
  return NO;
}


@end
