// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/FoundationErrors.h>

#import <ExpoModulesCore/EXModuleRegistryProvider.h>
#import <ExpoModulesCore/EXAppDelegateWrapper.h>

#import <React/RCTCxxBridgeDelegate.h>
#import <ReactCommon/CallInvoker.h>
#import <jsi/jsi.h>

#if __has_include(<React/HermesExecutorFactory.h>)
#import <React/HermesExecutorFactory.h>
typedef facebook::react::HermesExecutorFactory ExecutorFactory;
#else
#import <React/JSCExecutorFactory.h>
typedef facebook::react::JSCExecutorFactory ExecutorFactory;
#endif

#if __has_include(<React/RCTJSIExecutorRuntimeInstaller.h>)
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#define FACTORY_WRAPPER(F) RCTJSIExecutorRuntimeInstaller(F)
#else
#define FACTORY_WRAPPER(F) F
#endif

// BEGIN Required for Reanimated
#import <RNReanimated/REAEventDispatcher.h>
#import <RNReanimated/NativeProxy.h>
#import <RNReanimated/REAModule.h>
#import <React/RCTBridge+Private.h>
#import <ReactCommon/RCTTurboModule.h>
// END Required for Reanimated

// BEGIN Required for Reanimated
@interface RCTEventDispatcher(Reanimated)

- (void)setBridge:(RCTBridge*)bridge;

@end
// END Required for Reanimated

static NSMutableArray<id<UIApplicationDelegate>> *subcontractors;
static NSMutableDictionary<NSString *,NSArray<id<UIApplicationDelegate>> *> *subcontractorsForSelector;
static dispatch_once_t onceToken;

@interface EXAppDelegateWrapper (JSI) <RCTCxxBridgeDelegate>

@end

@implementation EXAppDelegateWrapper

@synthesize window = _window;

- (void)forwardInvocation:(NSInvocation *)invocation {
#if DEBUG
  SEL selector = [invocation selector];
  NSArray<id<UIApplicationDelegate>> *delegatesToBeCalled = [self getSubcontractorsImplementingSelector:selector];
  NSString *selectorName = NSStringFromSelector(selector);
  if ([delegatesToBeCalled count] > 0) {
    [NSException raise:@"Method not implemented in UIApplicationDelegate" format:@"Some modules: %@ have registered for `%@` UIApplicationDelegate's callback, however, neither your AppDelegate nor %@ can handle this method. You'll need to either implement this method in your AppDelegate or submit a pull request to handle it in %@.", delegatesToBeCalled, selectorName, NSStringFromClass([self class]), NSStringFromClass([self class])];
  }
#endif
  
  [super forwardInvocation:invocation];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  BOOL answer = NO;
  
  SEL selector = @selector(application:didFinishLaunchingWithOptions:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  for (id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    BOOL subcontractorAnswer = NO;
    subcontractorAnswer = [subcontractor application:application didFinishLaunchingWithOptions:launchOptions];
    answer |= subcontractorAnswer;
  }
  
  return answer;
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  SEL selector = @selector(applicationWillEnterForeground:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  for (id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    [subcontractor applicationWillEnterForeground:application];
  }
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  
  SEL selector = @selector(application:openURL:options:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  for (id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    if ([subcontractor application:app openURL:url options:options]) {
      return YES;
    }
  }
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  SEL selector = @selector(application:performFetchWithCompletionHandler:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  __block NSUInteger subcontractorsLeft = [subcontractorsArray count];
  __block UIBackgroundFetchResult fetchResult = UIBackgroundFetchResultNoData;
  __block NSObject *lock = [NSObject new];
  
  void (^handler)(UIBackgroundFetchResult) = ^(UIBackgroundFetchResult result) {
    @synchronized (lock) {
      if (result == UIBackgroundFetchResultFailed) {
        fetchResult = UIBackgroundFetchResultFailed;
      } else if (fetchResult != UIBackgroundFetchResultFailed && result == UIBackgroundFetchResultNewData) {
        fetchResult = UIBackgroundFetchResultNewData;
      }
      
      subcontractorsLeft--;
      if (subcontractorsLeft == 0) {
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
  __block NSUInteger subcontractorsLeft = [subcontractorsArray count];
  __block NSObject *lock = [NSObject new];
  
  void (^handler)(NSArray<id<UIUserActivityRestoring>> * _Nullable) = ^(NSArray<id<UIUserActivityRestoring>> * _Nullable param) {
    @synchronized (lock) {
      
      [mergedParams addObjectsFromArray:param];
      
      subcontractorsLeft--;
      if (subcontractorsLeft == 0) {
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

#pragma mark - BackgroundSession

- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)(void))completionHandler
{
  SEL selector = @selector(application:handleEventsForBackgroundURLSession:completionHandler:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
 
  __block BOOL delegatingCompleted = NO;
  __block int delegatesCompleted = 0;
  __block unsigned long allDelegates = subcontractorsArray.count;
  __block void (^completionHandlerCaller)(void) = ^ {
    if (delegatesCompleted && delegatingCompleted == allDelegates) {
      completionHandler();
    }
  };
  
  for (id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    [subcontractor application:application handleEventsForBackgroundURLSession:identifier completionHandler:^(){
      @synchronized (self) {
        delegatesCompleted += 1;
        completionHandlerCaller();
      }
    }];
  }
  
  @synchronized (self) {
    delegatingCompleted = YES;
    completionHandlerCaller();
  }
}

#pragma mark - Notifications

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token
{
  SEL selector = @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  for (id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
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

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  SEL selector = @selector(application:didReceiveRemoteNotification:fetchCompletionHandler:);
  NSArray<id<UIApplicationDelegate>> *subcontractorsArray = [self getSubcontractorsImplementingSelector:selector];
  
  __block NSUInteger subcontractorsLeft = [subcontractorsArray count];
  __block UIBackgroundFetchResult fetchResult = UIBackgroundFetchResultNoData;
  __block NSObject *lock = [NSObject new];
  
  void (^handler)(UIBackgroundFetchResult) = ^(UIBackgroundFetchResult result) {
    @synchronized (lock) {
      if (result == UIBackgroundFetchResultFailed) {
        fetchResult = UIBackgroundFetchResultFailed;
      } else if (fetchResult != UIBackgroundFetchResultFailed && result == UIBackgroundFetchResultNewData) {
        fetchResult = UIBackgroundFetchResultNewData;
      }
      
      subcontractorsLeft--;
      if (subcontractorsLeft == 0) {
        completionHandler(fetchResult);
      }
    }
  };
  
  for (id<UIApplicationDelegate> subcontractor in subcontractorsArray) {
    [subcontractor application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:handler];
  }
}


#pragma mark - Subcontractors

- (void)ensureSubcontractorsAreInitializedAndSorted {
  dispatch_once(&onceToken, ^{
    subcontractors = [[NSMutableArray alloc] init];
    subcontractorsForSelector = [NSMutableDictionary new];
    
    NSArray<EXSingletonModule*> * singletonModules = [[EXModuleRegistryProvider singletonModules] allObjects];
    
    for (EXSingletonModule *singletonModule in singletonModules) {
      if ([singletonModule conformsToProtocol:@protocol(UIApplicationDelegate)]) {
        [subcontractors addObject:(id<UIApplicationDelegate>)singletonModule];
      }
    }

    NSSortDescriptor *sortDescriptor = [[NSSortDescriptor alloc] initWithKey:@"priority"
                                                                   ascending:NO];
    [subcontractors sortUsingDescriptors:[NSArray arrayWithObject:sortDescriptor]];
  });
}

- (NSArray<id<UIApplicationDelegate>> *)getSubcontractorsImplementingSelector:(SEL)selector {
  
  [self ensureSubcontractorsAreInitializedAndSorted];
  
  NSString *selectorKey = NSStringFromSelector(selector);
  
  if (subcontractorsForSelector[selectorKey]) {
    return subcontractorsForSelector[selectorKey];
  }
  
  NSMutableArray<id<UIApplicationDelegate>> *result = [NSMutableArray new];
  
  for (id<UIApplicationDelegate> subcontractor in subcontractors) {
    if ([subcontractor respondsToSelector:selector]) {
      [result addObject:subcontractor];
    }
  }
  
  subcontractorsForSelector[selectorKey] = result;
  
  return result;
}

#pragma mark - JSI

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  using namespace facebook;
  
  // BEGIN Required for Reanimated
  [bridge moduleForClass:[RCTEventDispatcher class]];
  RCTEventDispatcher *eventDispatcher = [REAEventDispatcher new];
  [eventDispatcher setBridge:bridge];
  [bridge updateModuleWithInstance:eventDispatcher];
  _bridge_reanimated = bridge;
  // END Required for Reanimated
  
  __weak __typeof(self) weakSelf = self;
  __weak RCTBridge *weakBridge = bridge;
  
  const auto executor = [weakSelf, weakBridge](facebook::jsi::Runtime &runtime) {
    RCTBridge *strongBridge = weakBridge;
    if (!strongBridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    
    // BEGIN Required for Reanimated
    auto reanimatedModule = reanimated::createReanimatedModule(strongBridge.jsCallInvoker);
    runtime.global().setProperty(runtime,
                                 jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                 jsi::Object::createFromHostObject(runtime, reanimatedModule));
    // END Required for Reanimated
    
    auto global = runtime.global();
    global.setProperty(runtime, "__custom_js_factory_installed", jsi::Value(true));
    
    // TODO: Initialize all custom JSI funcs from the Unimodules.
    
    // Example on how to register a JSI function:
    auto functionName = "__av_sound_setOnAudioSampleReceivedCallback";
    auto function = [](jsi::Runtime &runtime,
                       const jsi::Value &thisValue,
                       const jsi::Value *args,
                       size_t argsCount) -> jsi::Value {
      return jsi::Value::undefined();
    };
    global.setProperty(runtime,
                       functionName,
                       jsi::Function::createFromHostFunction(runtime,
                                                             jsi::PropNameID::forUtf8(runtime, functionName),
                                                             2,
                                                             std::move(function)));
  };
  
  // FACTORY_WRAPPER installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(FACTORY_WRAPPER(executor));
}


@end
