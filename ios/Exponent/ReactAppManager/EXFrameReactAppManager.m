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

- (void)computeVersionSymbolPrefix
{
  self.validatedVersion = [[EXVersions sharedInstance] availableSdkVersionForManifest:_frame.manifest];
  self.versionSymbolPrefix = [[EXVersions sharedInstance] symbolPrefixForSdkVersion:self.validatedVersion];
}

- (NSString *)bundleNameForJSResource
{
  if (_frame.initialProps && [_frame.initialProps[@"shell"] boolValue]) {
    NSLog(@"EXAppManager: Standalone bundle remote url is %@", [self.reactBridge bundleURL]);
    return kEXShellBundleResourceName;
  } else {
    return _frame.manifest[@"id"];
  }
}

- (EXCachedResourceBehavior)cacheBehaviorForJSResource
{
  return ([self doesManifestEnableDeveloperTools]) ? kEXCachedResourceNoCache : kEXCachedResourceFallBackToCache;
}


- (NSDictionary * _Nullable)initialPropertiesForRootView
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  NSMutableDictionary *expProps = [NSMutableDictionary dictionary];
  
  if (_frame && _frame.initialProps) {
    [expProps addEntriesFromDictionary:_frame.initialProps];
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
  return (([self doesManifestEnableDeveloperTools]) ? EXDeveloperRCTLogFunction : EXDefaultRCTLogFunction);
}

- (RCTLogLevel)logLevel
{
  return ([self doesManifestEnableDeveloperTools]) ? RCTLogLevelInfo : RCTLogLevelWarning;
}

- (void)registerBridge
{
  [[EXKernel sharedInstance].bridgeRegistry registerBridge:self.reactBridge
                                           forExperienceId:_frame.manifest[@"id"]
                                                     frame:_frame];
}

- (void)unregisterBridge
{
  [[EXKernel sharedInstance].bridgeRegistry unregisterBridge:self.reactBridge];
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
                               @"appOwnership": [_frame.initialProps objectForKey:@"appOwnership"] ?: @"exponent",
                               },
                           @"initialUri": _frame.initialUri,
                           @"isDeveloper": @([self doesManifestEnableDeveloperTools]),
                           };
  return [self.versionManager extraModulesWithParams:params];
}

#pragma mark - internal

- (BOOL)doesManifestEnableDeveloperTools
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
  NSDictionary *eventProperties = params[@"eventProperties"];

  [[EXAnalytics sharedInstance] logEvent:eventId manifestUrl:manifestUrl eventProperties:eventProperties];
}

- (void)registerErrorForBridge:(NSError *)error
{
  [[EXKernel sharedInstance].bridgeRegistry setError:error forBridge:self.reactBridge];
}

@end
