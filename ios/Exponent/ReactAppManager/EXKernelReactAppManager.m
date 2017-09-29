// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBuildConstants.h"
#import "EXCachedResource.h"
#import "EXKernelReactAppManager.h"
#import "EXReactAppManager+Private.h"
#import "EXKernelDevMenuViewController.h"
#import "EXExceptionHandler.h"
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"
#import "EXLog.h"
#import "EXShellManager.h"
#import "EXVersionManager.h"
#import "EXVersions.h"

#import <React/RCTUtils.h>

NSString * const kEXKernelLaunchUrlDefaultsKey = @"EXKernelLaunchUrlDefaultsKey";
NSString *kEXKernelBundleResourceName = @"kernel.ios";
NSString *kEXKernelManifestResourceName = @"kernel-manifest";

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

+ (NSDictionary * _Nullable)kernelManifest
{
  NSString *manifestJson = nil;
  BOOL usesNSBundleManifest = NO;

  // if developing, use development manifest from EXBuildConstants
  if ([EXBuildConstants sharedInstance].isDevKernel) {
    manifestJson = [EXBuildConstants sharedInstance].kernelManifestJsonString;
  }

  // otherwise use published manifest
  if (!manifestJson) {
    NSString *manifestPath = [[NSBundle mainBundle] pathForResource:kEXKernelManifestResourceName ofType:@"json"];
    if (manifestPath) {
      NSError *error;
      usesNSBundleManifest = YES;
      manifestJson = [NSString stringWithContentsOfFile:manifestPath encoding:NSUTF8StringEncoding error:&error];
      if (error) {
        manifestJson = nil;
      }
    }
  }
  
  if (manifestJson) {
    id manifest = RCTJSONParse(manifestJson, nil);
    if ([manifest isKindOfClass:[NSDictionary class]]) {
      if (usesNSBundleManifest && ![manifest[@"id"] isEqualToString:@"@exponent/home"]) {
        DDLogError(@"Bundled kernel manifest was published with an id other than @exponent/home");
      }
      return manifest;
    }
  }
  return nil;
}

+ (NSURL *)kernelBundleUrl
{
  NSDictionary *localManifest = [self kernelManifest];
  if (localManifest) {
    NSURL *bundleUrl = [NSURL URLWithString:localManifest[@"bundleUrl"]];
    if (bundleUrl) {
      return bundleUrl;
    }
  }
  return nil;
}

- (BOOL)isReadyToLoad
{
  return YES;
}

- (BOOL)areDevtoolsEnabled
{
  return [EXBuildConstants sharedInstance].isDevKernel;
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
  if ([EXBuildConstants sharedInstance].isDevKernel) {
    // to prevent running dev native code against prod js.
    return kEXCachedResourceNoCache;
  } else {
    return [[NSUserDefaults standardUserDefaults] boolForKey:kEXSkipCacheUserDefaultsKey] ?
      kEXCachedResourceNoCache :
      kEXCachedResourceUseCacheImmediately;
  }
}

- (BOOL)shouldInvalidateJSResourceCache
{
  // if crashlytics shows that we're recovering from a native crash, invalidate any downloaded kernel cache.
  BOOL shouldClearKernelCache = [[NSUserDefaults standardUserDefaults] boolForKey:kEXKernelClearJSCacheUserDefaultsKey];
  if (shouldClearKernelCache) {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXKernelClearJSCacheUserDefaultsKey];
    return YES;
  }
  return NO;
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
  // TODO: do we want to use this for anything? needed for exponent-sdk to function
  props[@"exp"] = @{};
  
  return props;
}

- (NSString *)applicationKeyForRootView
{
  return @"main";
}

- (RCTLogFunction)logFunction
{
  return EXGetKernelRCTLogFunction();
}

- (RCTLogLevel)logLevel
{
  return RCTLogLevelWarning;
}

- (void)registerBridge
{
  [[EXKernel sharedInstance].bridgeRegistry registerKernelAppManager:self];
}

- (void)unregisterBridge
{
  [[EXKernel sharedInstance].bridgeRegistry unregisterKernelAppManager];
  _exceptionHandler = nil;
}

- (NSString *)experienceId
{
  NSDictionary *manifest = [[self class] kernelManifest];
  return (manifest) ? manifest[@"id"] : nil;
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
  
  if ([self.versionManager respondsToSelector:@selector(extraModulesWithParams:)]) {
    NSDictionary *manifest = [[self class] kernelManifest];
    RCTAssert(self.experienceId, @"Cannot load kernel manifest with no id.");

    // TODO: common constants impl?
    NSMutableDictionary *params = [@{
                                     @"constants": @{
                                         @"deviceId": [EXKernel deviceInstallUUID],
                                         @"expoRuntimeVersion": [EXBuildConstants sharedInstance].expoRuntimeVersion,
                                         @"linkingUri": @"exp://",
                                         @"manifest": manifest,
                                         @"appOwnership": @"expo",
                                         },
                                     @"kernel": [EXKernel sharedInstance],
                                     @"supportedSdkVersions": [EXVersions sharedInstance].versions[@"sdkVersions"],
                                     @"exceptionsManagerDelegate": _exceptionHandler,
                                     @"isDeveloper": @([EXBuildConstants sharedInstance].isDevKernel),
                                     @"isStandardDevMenuAllowed": @(YES), // kernel enables traditional RN dev menu
                                     @"manifest": manifest,
                                     @"services": [EXKernel sharedInstance].serviceRegistry.allServices,
                                     } mutableCopy];

    // used by appetize - override the kernel initial url if there's something in NSUserDefaults
    NSURL *initialKernelUrl;
    NSString *kernelInitialUrlDefaultsValue = [[NSUserDefaults standardUserDefaults] stringForKey:kEXKernelLaunchUrlDefaultsKey];
    if (kernelInitialUrlDefaultsValue) {
      initialKernelUrl = [NSURL URLWithString:kernelInitialUrlDefaultsValue];
      [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXKernelLaunchUrlDefaultsKey];
      [[NSUserDefaults standardUserDefaults] synchronize];
    } else {
      initialKernelUrl = [EXKernelLinkingManager initialUrlFromLaunchOptions:_launchOptions];
    }
    params[@"initialUri"] = initialKernelUrl;
    
    [modules addObjectsFromArray:[self.versionManager extraModulesWithParams:params]];
  }
  
  return modules;
}

@end
