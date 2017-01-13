// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCachedResource.h"
#import "EXKernelReactAppManager.h"
#import "EXReactAppManager+Private.h"
#import "EXDevMenuViewController.h"
#import "EXExceptionHandler.h"
#import "EXKernel.h"
#import "EXLog.h"
#import "EXShellManager.h"
#import "EXVersionManager.h"
#import "EXVersions.h"

@interface EXKernelReactAppManager ()

// we retain this because RCTExceptionsManager won't retain it
@property (nonatomic, strong) EXExceptionHandler *exceptionHandler;

@end

@implementation EXKernelReactAppManager

- (instancetype)initWithLaunchOptions:(NSDictionary *)launchOptions
{
  if (self = [super init]) {
    _launchOptions = launchOptions;
  }
  return self;
}

- (void)setLaunchOptions:(NSDictionary *)launchOptions
{
  if (self.reactBridge) {
    DDLogError(@"%s: Setting launch options while bridge is already running. These won't take effect until you reload the ReactAppManager.", __PRETTY_FUNCTION__);
  }
  _launchOptions = launchOptions;
}

+ (NSURL *)kernelBundleUrl
{
#ifdef BUILD_MACHINE_KERNEL_NGROK_URL
  if ([self _isDevelopingKernel]) {
    NSString *kernelNgrokUrl = BUILD_MACHINE_KERNEL_NGROK_URL;
    NSString *kernelPath = @"exponent.bundle?dev=true&platform=ios";
    if (kernelNgrokUrl.length) {
      return [NSURL URLWithString:[NSString stringWithFormat:@"%@/%@", kernelNgrokUrl, kernelPath]];
    } else {
      return [NSURL URLWithString:[NSString stringWithFormat:@"http://%@:8081/%@", BUILD_MACHINE_IP_ADDRESS, kernelPath]];
    }
  }
#endif
  return [NSURL URLWithString:@"https://exp.host/~exponent/kernel"];
}

- (BOOL)isReadyToLoad
{
  return YES;
}

- (void)computeVersionSymbolPrefix
{
  NSDictionary *detachedVersions = [EXVersions sharedInstance].versions[@"detachedNativeVersions"];
  if (detachedVersions) {
    self.validatedVersion = detachedVersions[@"kernel"];
  } else {
    self.validatedVersion = nil;
  }
  self.versionSymbolPrefix = [[EXVersions sharedInstance] symbolPrefixForSdkVersion:self.validatedVersion isKernel:YES];
}

- (NSString *)bundleNameForJSResource
{
  return kEXKernelBundleResourceName;
}

- (EXCachedResourceBehavior)cacheBehaviorForJSResource
{
  if ([[self class] _isDevelopingKernel]) {
    // to prevent running dev native code against prod js.
    return kEXCachedResourceNoCache;
  } else {
    return [[NSUserDefaults standardUserDefaults] boolForKey:kEXSkipCacheUserDefaultsKey] ?
      kEXCachedResourceNoCache :
      kEXCachedResourceUseCacheImmediately;
  }
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
  _exceptionHandler = nil;
}

#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [[self class] kernelBundleUrl];
}

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  _exceptionHandler = [[EXExceptionHandler alloc] initWithBridge:self.reactBridge];
  NSMutableArray *modules = [NSMutableArray array];
  
  if ([self.versionManager respondsToSelector:@selector(versionedModulesForKernelWithParams:)]) {
    NSMutableDictionary *params = [@{
                                     @"launchOptions": (_launchOptions) ?: @{},
                                     @"constants": @{
                                         @"deviceId": [EXKernel deviceInstallUUID]
                                         },
                                     @"kernel": [EXKernel sharedInstance],
                                     @"supportedSdkVersions": [EXVersions sharedInstance].versions[@"sdkVersions"],
                                     @"exceptionsManagerDelegate": _exceptionHandler,
                                     } mutableCopy];
    NSURL *initialUriFromLaunchOptions = [EXKernel initialUrlFromLaunchOptions:_launchOptions];
    if (initialUriFromLaunchOptions) {
      params[@"initialUriFromLaunchOptions"] = initialUriFromLaunchOptions;
    }
    [modules addObjectsFromArray:[self.versionManager versionedModulesForKernelWithParams:params]];
  }
  
  return modules;
}

#pragma mark - internal

+ (BOOL)_isDevelopingKernel
{
  // if we're in detached state (i.e. ExponentView) then never expect local kernel
  BOOL isDetachedKernel = ([[EXVersions sharedInstance].versions objectForKey:@"detachedNativeVersions"] != nil);
  if (isDetachedKernel) {
    return NO;
  }

  // otherwise, expect local kernel when we are attached to xcode
#if DEBUG
  return YES;
#endif
  return NO;
}

@end
