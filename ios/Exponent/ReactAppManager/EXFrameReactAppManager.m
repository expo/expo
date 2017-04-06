// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXCachedResource.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernel.h"
#import "EXLog.h"
#import "EXReactAppManager+Private.h"
#import "EXShellManager.h"
#import "EXVersions.h"
#import "EXVersionManager.h"

@implementation EXFrameReactAppManager

- (instancetype)initWithEXFrame:(EXFrame *)frame
{
  if (self = [super init]) {
    _frame = frame;
  }
  return self;
} 

- (BOOL)isReadyToLoad
{
  return (_frame && _frame.source != nil);
}

- (BOOL)areDevtoolsEnabled
{
  return [self _doesManifestEnableDeveloperTools];
}

- (void)computeVersionSymbolPrefix
{
  self.validatedVersion = [[EXVersions sharedInstance] availableSdkVersionForManifest:_frame.manifest];
  self.versionSymbolPrefix = [[EXVersions sharedInstance] symbolPrefixForSdkVersion:self.validatedVersion isKernel:NO];
}

- (NSString *)bundleNameForJSResource
{
  if (_frame.initialProps && [_frame.initialProps[@"shell"] boolValue]) {
    NSLog(@"EXFrameReactAppManager: Standalone bundle remote url is %@", [EXShellManager sharedInstance].shellManifestUrl);
    return kEXShellBundleResourceName;
  } else {
    return self.experienceId;
  }
}

- (EXCachedResourceBehavior)cacheBehaviorForJSResource
{
  if ([[EXKernel sharedInstance].recoveryManager experienceIdIsRecoveringFromError:self.experienceId]) {
    // if this experience id encountered a loading error before, discard any cache we might have
    return kEXCachedResourceNoCache;
  }
  return ([self _doesManifestEnableDeveloperTools]) ? kEXCachedResourceNoCache : kEXCachedResourceFallBackToCache;
}

- (BOOL)shouldInvalidateJSResourceCache
{
  // TODO: we may want cache expiration here eventually.
  // we are partially protected by the fact that caches are separated by SDK version already.
  return NO;
}


- (NSDictionary * _Nullable)initialPropertiesForRootView
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  NSMutableDictionary *expProps = [NSMutableDictionary dictionary];
  
  if (_frame && _frame.initialProps) {
    [expProps addEntriesFromDictionary:_frame.initialProps];
  }
  NSDictionary *errorRecoveryProps = [[EXKernel sharedInstance].recoveryManager developerInfoForExperienceId:self.experienceId];
  if (errorRecoveryProps && [[EXKernel sharedInstance].recoveryManager experienceIdIsRecoveringFromError:self.experienceId]) {
    expProps[@"errorRecovery"] = errorRecoveryProps;
  }
  
  props[@"exp"] = expProps;
  
  return props;
}

- (NSDictionary * _Nullable)launchOptionsForBridge
{
  return nil;
}

- (NSString *)applicationKeyForRootView
{
  NSDictionary *manifest = _frame.manifest;
  if (manifest && manifest[@"appKey"]) {
    return manifest[@"appKey"];
  }
  
  if (_frame.source) {
    NSURLComponents *components = [NSURLComponents componentsWithURL:_frame.source resolvingAgainstBaseURL:YES];
    NSArray<NSURLQueryItem *> *queryItems = components.queryItems;
    for (NSURLQueryItem *item in queryItems) {
      if ([item.name isEqualToString:@"app"]) {
        return item.value;
      }
    }
  }
  
  return @"main";
}

- (RCTLogFunction)logFunction
{
  return (([self _doesManifestEnableDeveloperTools]) ? EXDeveloperRCTLogFunction : EXDefaultRCTLogFunction);
}

- (RCTLogLevel)logLevel
{
  return ([self _doesManifestEnableDeveloperTools]) ? RCTLogLevelInfo : RCTLogLevelWarning;
}

- (void)registerBridge
{
  [[EXKernel sharedInstance].bridgeRegistry registerBridge:self.reactBridge
                                           withExperienceId:self.experienceId
                                                appManager:self];
}

- (void)unregisterBridge
{
  [[EXKernel sharedInstance].bridgeRegistry unregisterBridge:self.reactBridge];
}

- (NSString *)experienceId
{
  return (_frame && _frame.manifest) ? _frame.manifest[@"id"] : nil;
}

#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return _frame.source;
}

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSDictionary *params = @{
                           @"frame": _frame,
                           @"manifest": _frame.manifest,
                           @"constants": @{
                               @"linkingUri": [EXKernel linkingUriForExperienceUri:_frame.initialUri],
                               @"deviceId": [EXKernel deviceInstallUUID],
                               @"manifest": _frame.manifest,
                               @"appOwnership": [_frame.initialProps objectForKey:@"appOwnership"] ?: @"expo",
                               },
                           @"initialUri": _frame.initialUri,
                           @"isDeveloper": @([self _doesManifestEnableDeveloperTools]),
                           };
  return [self.versionManager extraModulesWithParams:params];
}

#pragma mark - internal

- (BOOL)_doesManifestEnableDeveloperTools
{
  NSDictionary *manifest = _frame.manifest;
  if (manifest) {
    NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
    BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
    return (isDeployedFromTool);
  }
  return false;
}

#pragma mark - Unversioned utilities for EXFrame

- (void)logKernelAnalyticsEventWithParams:(NSDictionary *)params
{
  NSString *eventId = params[@"eventIdentifier"];
  NSURL *manifestUrl = params[@"manifestUrl"];
  NSMutableDictionary *eventProperties = (params[@"eventProperties"]) ? [params[@"eventProperties"] mutableCopy] : [NSMutableDictionary dictionary];
  if (!eventProperties[@"SDK_VERSION"] && self.validatedVersion) {
    eventProperties[@"SDK_VERSION"] = self.validatedVersion;
  }

  [[EXAnalytics sharedInstance] logEvent:eventId manifestUrl:manifestUrl eventProperties:eventProperties];
}

- (void)registerErrorForBridge:(NSError *)error
{
  [[EXKernel sharedInstance].recoveryManager setError:error forExperienceId:self.experienceId];
}

- (id)appLoadingManagerInstance
{
  Class loadingManagerClass = [self versionedClassFromString:@"EXAppLoadingManager"];
  for (Class class in [self.reactBridge moduleClasses]) {
    if ([class isSubclassOfClass:loadingManagerClass]) {
      return [self.reactBridge moduleForClass:loadingManagerClass];
    }
  }
  return nil;
}

@end
