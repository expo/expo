
#import "EXBuildConstants.h"
#import "EXHomeAppManager.h"
#import "EXKernel.h"
#import "EXAppFetcher.h"
#import "EXAbstractLoader.h"
#import "EXKernelLinkingManager.h"
#import "EXHomeModule.h"
#import "EXKernelUtil.h"
#import "EXLog.h"
#import "ExpoKit.h"
#import "EXReactAppExceptionHandler.h"
#import "EXReactAppManager+Private.h"
#import "EXVersionManager.h"
#import "EXVersions.h"

#import <EXConstants/EXConstantsService.h>

#import <React/RCTUtils.h>
#import <React/RCTBridge.h>

#import <ExpoModulesCore/EXModuleRegistryProvider.h>

@import EXManifests;
@import EXUpdates;

NSString * const kEXHomeLaunchUrlDefaultsKey = @"EXKernelLaunchUrlDefaultsKey";
NSString *kEXHomeBundleResourceName = @"kernel.ios";
NSString *kEXHomeManifestResourceName = @"kernel-manifest";

@implementation EXHomeAppManager

- (NSDictionary *)extraParams
{
  NSMutableDictionary *params = [@{
    @"browserModuleClass": [EXHomeModule class],
    @"constants": @{
        @"expoRuntimeVersion": [EXBuildConstants sharedInstance].expoRuntimeVersion,
        @"linkingUri": @"exp://",
        @"experienceUrl": [@"exp://" stringByAppendingString:self.appRecord.appLoader.manifest.hostUri],
        @"manifest": self.appRecord.appLoader.manifest.rawManifestJSON,
        @"executionEnvironment": EXConstantsExecutionEnvironmentStoreClient,
        @"appOwnership": @"expo",
        @"supportedExpoSdks": [EXVersions sharedInstance].versions[@"sdkVersions"],
    },
    @"exceptionsManagerDelegate": self.exceptionHandler,
    @"isDeveloper": @([EXBuildConstants sharedInstance].isDevKernel),
    @"isStandardDevMenuAllowed": @(YES), // kernel enables traditional RN dev menu
    @"manifest": self.appRecord.appLoader.manifest.rawManifestJSON,
    @"services": [EXKernel sharedInstance].serviceRegistry.allServices,
    @"singletonModules": [EXModuleRegistryProvider singletonModules],
    @"fileSystemDirectories": @{
        @"documentDirectory": [self scopedDocumentDirectory],
        @"cachesDirectory": [self scopedCachesDirectory]
    }
  } mutableCopy];

  NSURL *initialHomeUrl = [self _initialHomeUrl];
  if (initialHomeUrl) {
    params[@"initialUri"] = initialHomeUrl;
  }
  return params;
}

#pragma mark - interfacing with home JS

- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(EXManifestsManifest *)manifest
{
  if (!manifest || !manifestUrl || [manifest.legacyId isEqualToString:@"@exponent/home"] || [manifest.legacyId isEqualToString:@"@expo-dogfooding/home"]) {
    return;
  }
  NSDictionary *params = @{
    @"manifestUrl": manifestUrl.absoluteString,
    @"manifest": manifest.rawManifestJSON,
  };
  [self _dispatchHomeJSEvent:@"addHistoryItem" body:params onSuccess:nil onFailure:nil];
}

- (void)getHistoryUrlForScopeKey:(NSString *)scopeKey completion:(void (^)(NSString *))completion
{
  [self _dispatchHomeJSEvent:@"getHistoryUrlForExperienceId"
                        body:@{ @"experienceId": scopeKey }
                   onSuccess:^(NSDictionary *result) {
                     NSString *url = result[@"url"];
                     completion(url);
                   } onFailure:^(NSString *errorMessage) {
                     completion(nil);
                   }];
}

- (void)showQRReader
{
  [self _dispatchHomeJSEvent:@"showQRReader" body:@{} onSuccess:nil onFailure:nil];
}

#pragma mark - EXReactAppManager

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSMutableArray *modules = [NSMutableArray array];

  [modules addObjectsFromArray:[self.versionManager extraModulesForBridge:bridge]];

  return modules;
}

- (void)computeVersionSymbolPrefix
{
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

- (NSDictionary *)launchOptionsForBridge
{
  if (!self.hasBridgeEverLoaded) {
    return [ExpoKit sharedInstance].launchOptions;
  } else {
    // don't want to re-consume launch options when the bridge reloads.
    return nil;
  }
}

- (NSString *)bundleResourceNameForAppFetcher:(__unused EXAppFetcher *)appFetcher withManifest:(nonnull __unused EXManifestsManifest *)manifest
{
  return kEXHomeBundleResourceName;
}

#pragma mark - util

- (void)_dispatchHomeJSEvent:(NSString *)eventName body:(NSDictionary *)eventBody onSuccess:(void (^_Nullable)(NSDictionary * _Nullable))success onFailure:(void (^_Nullable)(NSString * _Nullable))failure
{
  EXHomeModule *homeModule = [[EXKernel sharedInstance] nativeModuleForAppManager:self named:@"ExponentKernel"];
  if (homeModule) {
    [homeModule dispatchJSEvent:eventName body:eventBody onSuccess:success onFailure:failure];
  } else {
    if (failure) {
      failure(nil);
    }
  }
}

- (NSURL *)_initialHomeUrl
{
  // used by appetize - override the kernel initial url if there's something in NSUserDefaults
  NSURL *initialHomeUrl;
  NSString *kernelInitialUrlDefaultsValue = [[NSUserDefaults standardUserDefaults] stringForKey:kEXHomeLaunchUrlDefaultsKey];
  if (kernelInitialUrlDefaultsValue) {
    initialHomeUrl = [NSURL URLWithString:kernelInitialUrlDefaultsValue];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXHomeLaunchUrlDefaultsKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
  } else {
    initialHomeUrl = [EXKernelLinkingManager initialUrlFromLaunchOptions:[self launchOptionsForBridge]];
  }
  return initialHomeUrl;
}

+ (EXManifestsManifest * _Nullable)bundledHomeManifest
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
      if (usesNSBundleManifest && !([manifest[@"id"] isEqualToString:@"@exponent/home"] || [manifest[@"id"] isEqualToString:@"@expo-dogfooding/home"])) {
        DDLogError(@"Bundled kernel manifest was published with an id other than @exponent/home or @expo-dogfooding/home");
      }
      return [EXManifestsManifestFactory manifestForManifestJSON:manifest];
    }
  }
  return nil;
}

- (BOOL)requiresValidManifests
{
  // running home
  return NO;
}

@end
