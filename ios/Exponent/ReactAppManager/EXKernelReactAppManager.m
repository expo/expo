// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCachedResource.h"
#import "EXKernelReactAppManager.h"
#import "EXReactAppManager+Private.h"
#import "EXDevMenuViewController.h"
#import "EXExceptionHandler.h"
#import "EXKernel.h"
#import "EXKernelModuleProvider.h"
#import "EXLog.h"
#import "EXShellManager.h"
#import "EXVersionManager.h"

@import ObjectiveC;

@implementation EXKernelReactAppManager

- (instancetype)initWithLaunchOptions:(NSDictionary *)launchOptions
{
  if (self = [super init]) {
    _launchOptions = launchOptions;
  }
  return self;
}

+ (NSURL *)kernelBundleUrl
{
#if DEBUG
  NSString *kernelNgrokUrl = BUILD_MACHINE_KERNEL_NGROK_URL;
  NSString *kernelPath = @"exponent.bundle?dev=true&platform=ios";
  if (kernelNgrokUrl.length) {
    return [NSURL URLWithString:[NSString stringWithFormat:@"%@/%@", kernelNgrokUrl, kernelPath]];
  } else {
    return [NSURL URLWithString:[NSString stringWithFormat:@"http://%@:8081/%@", BUILD_MACHINE_LOCAL_HOSTNAME, kernelPath]];
  }
#else
  return [NSURL URLWithString:@"https://exp.host/~exponent/kernel"];
#endif
}

- (BOOL)isReadyToLoad
{
  return YES;
}

- (void)computeVersionSymbolPrefix
{
  // kernel is always unversioned at the moment
  self.versionSymbolPrefix = @"";
  self.validatedVersion = @"";
}

- (NSString *)bundleNameForJSResource
{
  return kEXKernelBundleResourceName;
}

- (EXCachedResourceBehavior)cacheBehaviorForJSResource
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kEXSkipCacheUserDefaultsKey] ?
    kEXCachedResourceNoCache :
    kEXCachedResourceUseCacheImmediately;
}

- (NSDictionary * _Nullable)launchOptionsForBridge
{
  return _launchOptions;
}

- (NSDictionary * _Nullable)initialPropertiesForRootView
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  if ([EXShellManager sharedInstance].isShell) {
    [props addEntriesFromDictionary:@{
                                      @"shell": @YES,
                                      @"shellManifestUrl": [EXShellManager sharedInstance].shellManifestUrl,
                                      }];
  }
  
  return props;
}

- (NSString *)applicationKeyForRootView
{
  return @"ExponentApp";
}

- (RCTLogFunction)logFunction
{
  return EXGetKernelRCTLogFunction();
}

- (RCTLogLevel)logLevel
{
  return RCTLogLevelInfo;
}

- (void)registerBridge
{
  [[EXKernel sharedInstance].bridgeRegistry registerKernelBridge:self.reactBridge];
}

- (void)unregisterBridge
{
  [[EXKernel sharedInstance].bridgeRegistry unregisterKernelBridge];
}

#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [[self class] kernelBundleUrl];
}

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  static NSString * const EXExceptionHandlerKey = @"EXExceptionHandler";
  EXExceptionHandler *exceptionHandler = [[EXExceptionHandler alloc] initWithBridge:self.reactBridge];
  RCTExceptionsManager *exceptionsManager = [[RCTExceptionsManager alloc] initWithDelegate:exceptionHandler];
  objc_setAssociatedObject(exceptionsManager, &EXExceptionHandlerKey, exceptionHandler, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  
  NSMutableArray *modules = [EXKernelModuleProvider() mutableCopy];
  [modules addObject:exceptionsManager];
  
  if ([self.versionManager respondsToSelector:@selector(versionedModulesForKernelWithParams:)]) {
    NSMutableDictionary *params = [@{
                                     @"launchOptions": (_launchOptions) ?: @{},
                                     @"constants": @{
                                         @"deviceId": [EXKernel deviceInstallUUID]
                                         },
                                     } mutableCopy];
    NSURL *initialUriFromLaunchOptions = [EXKernel initialUrlFromLaunchOptions:_launchOptions];
    if (initialUriFromLaunchOptions) {
      params[@"initialUriFromLaunchOptions"] = initialUriFromLaunchOptions;
    }
    [modules addObjectsFromArray:[self.versionManager versionedModulesForKernelWithParams:params]];
  }
  
  return modules;
}

@end
