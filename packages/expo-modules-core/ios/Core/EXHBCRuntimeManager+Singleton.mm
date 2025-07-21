// Copyright 2024-present 650 Industries. All rights reserved.

#import "EXHBCRuntimeManager+Singleton.h"
#import "EXHBCRuntimeDelegate.h"
#import <ExpoModulesCore/EXHBCRuntimeManager.h>
#import <ExpoModulesCore/Swift.h>

@implementation EXHBCRuntimeManagerSingleton {
  NSMutableDictionary<NSValue *, EXHBCRuntimeDelegate *> *_delegates;
  NSMutableArray<EXAppContext *> *_appContexts;
}

+ (instancetype)sharedInstance
{
  static EXHBCRuntimeManagerSingleton *instance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[self alloc] init];
  });
  return instance;
}

- (instancetype)init
{
  if (self = [super init]) {
    _delegates = [NSMutableDictionary dictionary];
    _appContexts = [NSMutableArray array];
  }
  return self;
}

- (void)registerAppContext:(EXAppContext *)appContext
{
  @synchronized(self) {
    if (appContext && ![_appContexts containsObject:appContext]) {
      [_appContexts addObject:appContext];
      NSLog(@"🔥 EXHBCRuntimeManagerSingleton: Registered app context %p (total: %lu)", appContext, (unsigned long)_appContexts.count);
    }
  }
}

- (EXHBCRuntimeDelegate *)runtimeDelegateForAppContext:(EXAppContext *)appContext
{
  @synchronized(self) {
    NSValue *key = [NSValue valueWithPointer:(__bridge const void *)appContext];
    EXHBCRuntimeDelegate *delegate = _delegates[key];
    
    if (!delegate) {
      delegate = [[EXHBCRuntimeDelegate alloc] initWithAppContext:appContext];
      _delegates[key] = delegate;
      NSLog(@"EXHBCRuntimeManagerSingleton: Created runtime delegate for app context %p", appContext);
    }
    
    return delegate;
  }
}

+ (void)handleRuntimeInitialization:(void *)runtime forHost:(id)host
{
  NSLog(@"EXHBCRuntimeManagerSingleton: Handling runtime initialization for host %p", host);
  
  if (!runtime) {
    NSLog(@"EXHBCRuntimeManagerSingleton: Runtime is null, skipping HBC injection");
    return;
  }
  
  EXHBCRuntimeManagerSingleton *singleton = [self sharedInstance];
  
  @synchronized(singleton) {
    // Inject HBC for all registered app contexts
    for (EXAppContext *appContext in singleton->_appContexts) {
      EXHBCRuntimeDelegate *delegate = [singleton runtimeDelegateForAppContext:appContext];
      [delegate handleRuntimeInitialization:runtime forHost:host];
    }
  }
}

+ (nullable id<RCTHostRuntimeDelegate>)createRuntimeDelegateForHost:(id)host
{
#if EXPO_HBC_RCTHOST_AVAILABLE
  NSLog(@"EXHBCRuntimeManagerSingleton: Creating runtime delegate for host %p", host);
  
  // Create a simple delegate that calls our singleton handler
  return [[EXHBCGlobalRuntimeDelegate alloc] init];
#else
  NSLog(@"EXHBCRuntimeManagerSingleton: RCTHost not available in legacy architecture");
  return nil;
#endif
}

+ (void)triggerHBCInjectionForLegacyArchitecture
{
  NSLog(@"🚀 EXHBCRuntimeManagerSingleton: Triggering HBC injection for legacy architecture");
  
  EXHBCRuntimeManagerSingleton *singleton = [self sharedInstance];
  
  @synchronized(singleton) {
    NSLog(@"🚀 EXHBCRuntimeManagerSingleton: Found %lu app contexts to inject HBC", (unsigned long)singleton->_appContexts.count);
    for (EXAppContext *appContext in singleton->_appContexts) {
      EXHBCRuntimeDelegate *delegate = [singleton runtimeDelegateForAppContext:appContext];
      NSLog(@"🚀 EXHBCRuntimeManagerSingleton: Injecting HBC for app context %p", appContext);
      [delegate injectHBCForLegacyArchitecture];
    }
  }
}

@end

#if EXPO_HBC_RCTHOST_AVAILABLE
/**
 * A simple runtime delegate that forwards to our singleton manager.
 * This can be set on any RCTHost instance.
 */
@interface EXHBCGlobalRuntimeDelegate : NSObject <RCTHostRuntimeDelegate>
@end

@implementation EXHBCGlobalRuntimeDelegate

- (void)host:(RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  [EXHBCRuntimeManagerSingleton handleRuntimeInitialization:(void *)&runtime forHost:host];
}

@end
#endif