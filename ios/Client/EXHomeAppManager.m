
#import "EXReactAppManager+Private.h"
#import "EXBuildConstants.h"
#import "EXHomeAppManager.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelUtil.h"
#import "EXLog.h"
#import "EXVersionManager.h"
#import "EXVersions.h"

#import <React/RCTUtils.h>
#import <React/RCTBridge.h>

NSString * const kEXHomeLaunchUrlDefaultsKey = @"EXKernelLaunchUrlDefaultsKey";
NSString *kEXHomeBundleResourceName = @"kernel.ios";
NSString *kEXHomeManifestResourceName = @"kernel-manifest";

@implementation EXHomeAppManager

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  // TODO: BEN: error handling
  // _exceptionHandler = [[EXExceptionHandler alloc] initWithBridge:self.reactBridge];
  // ... @"exceptionsManagerDelegate": _exceptionHandler,
  
  NSMutableArray *modules = [NSMutableArray array];
  
  // TODO: common constants impl?
  NSMutableDictionary *params = [@{
                                   @"constants": @{
                                       @"deviceId": [EXKernel deviceInstallUUID],
                                       @"expoRuntimeVersion": [EXBuildConstants sharedInstance].expoRuntimeVersion,
                                       @"linkingUri": @"exp://",
                                       @"manifest": self.appRecord.appLoader.manifest,
                                       @"appOwnership": @"expo",
                                       },
                                   @"kernel": [EXKernel sharedInstance],
                                   @"supportedSdkVersions": [EXVersions sharedInstance].versions[@"sdkVersions"],
                                   @"isDeveloper": @([EXBuildConstants sharedInstance].isDevKernel),
                                   @"isStandardDevMenuAllowed": @(YES), // kernel enables traditional RN dev menu
                                   @"manifest": self.appRecord.appLoader.manifest,
                                   @"services": [EXKernel sharedInstance].serviceRegistry.allServices,
                                   } mutableCopy];
  
  // used by appetize - override the kernel initial url if there's something in NSUserDefaults
  NSURL *initialKernelUrl;
  NSString *kernelInitialUrlDefaultsValue = [[NSUserDefaults standardUserDefaults] stringForKey:kEXHomeLaunchUrlDefaultsKey];
  if (kernelInitialUrlDefaultsValue) {
    initialKernelUrl = [NSURL URLWithString:kernelInitialUrlDefaultsValue];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXHomeLaunchUrlDefaultsKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
  } else {
    // TODO: BEN: _launchOptions
    initialKernelUrl = [EXKernelLinkingManager initialUrlFromLaunchOptions:@{}];
  }
  params[@"initialUri"] = initialKernelUrl;
  
  [modules addObjectsFromArray:[self.versionManager extraModulesWithParams:params]];
  
  return modules;
}

- (void)computeVersionSymbolPrefix
{
  /* TODO: BEN: kill me
   NSDictionary *detachedVersions = [EXVersions sharedInstance].versions[@"detachedNativeVersions"];
  if (detachedVersions) {
    self.validatedVersion = detachedVersions[@"kernel"];
  } else {
    self.validatedVersion = nil;
  } */
  self.validatedVersion = nil;
  self.versionSymbolPrefix = [[EXVersions sharedInstance] symbolPrefixForSdkVersion:self.validatedVersion isKernel:YES];
}

- (RCTLogFunction)logFunction
{
  return EXGetKernelRCTLogFunction();
}

- (RCTLogLevel)logLevel
{
  return RCTLogLevelWarning;
}

#pragma mark - util

+ (NSDictionary * _Nullable)bundledHomeManifest
{
  NSString *manifestJson = nil;
  BOOL usesNSBundleManifest = NO;
  
  // if developing, use development manifest from EXBuildConstants
  if ([EXBuildConstants sharedInstance].isDevKernel) {
    manifestJson = [EXBuildConstants sharedInstance].kernelManifestJsonString;
  }
  
  // otherwise use published manifest
  if (!manifestJson) {
    NSString *manifestPath = [[NSBundle mainBundle] pathForResource:kEXHomeManifestResourceName ofType:@"json"];
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

// TODO: BEN: here's some other things that were different about the old kernel manager

/* - (NSDictionary * _Nullable)initialPropertiesForRootView
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

- (NSString *)bundleNameForJSResource
{
  return kEXKernelBundleResourceName;
}

- (EXCachedResourceBehavior)cacheBehaviorForJSResource
{
  if ([EXBuildConstants sharedInstance].isDevKernel) {
    // to prevent running dev native code against prod js.
    return EXCachedResourceNoCache;
  } else {
    return [[NSUserDefaults standardUserDefaults] boolForKey:kEXSkipCacheUserDefaultsKey] ?
    EXCachedResourceNoCache :
    EXCachedResourceUseCacheImmediately;
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
*/

@end
