// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXBuildConstants.h"
#import "EXCachedResource.h"
#import "EXErrorRecoveryManager.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
#import "EXKernelDevKeyCommands.h"
#import "EXKernelLinkingManager.h"
#import "EXLog.h"
#import "EXReactAppManager+Private.h"
#import "EXShellManager.h"
#import "EXVersions.h"
#import "EXVersionManager.h"

@interface EXFrameReactAppManager ()

@property (nonatomic, strong) NSURL *bundleUrl;
@property (nonatomic, copy) RCTSourceLoadBlock loadCallback;

@end

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
  NSDictionary *errorRecoveryProps = [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager developerInfoForExperienceId:self.experienceId];
  if (errorRecoveryProps && [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:self.experienceId]) {
    expProps[@"errorRecovery"] = errorRecoveryProps;
    [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager increaseAutoReloadBuffer];
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
  NSString *recordId = [self _recordId];
  if (recordId) {
    [[EXKernel sharedInstance].appRegistry addAppManager:self toRecordWithId:recordId];
  } else {
    // TODO: this shouldn't ever happen, just including this for completeness in case the JS uses a (maybe old) manifest
    // that didn't get the recordId inserted. Can remove this check once kernel JS is gone
    [[EXKernel sharedInstance].appRegistry addAppManager:self toRecordWithExperienceId:self.experienceId];
  }
}

- (void)unregisterBridge
{
  NSString *recordId = [self _recordId];
  if (recordId) {
    [[EXKernel sharedInstance].appRegistry unregisterAppWithRecordId:recordId];
  } else {
    // TODO: this shouldn't ever happen, just including this for completeness in case the JS uses a (maybe old) manifest
    // that didn't get the recordId inserted. Can remove this check once kernel JS is gone
    [[EXKernel sharedInstance].appRegistry unregisterRecordWithExperienceId:self.experienceId];
  }
}

- (NSString *)experienceId
{
  id experienceIdJsonValue = (_frame && _frame.manifest) ? _frame.manifest[@"id"] : nil;
  if (experienceIdJsonValue) {
    RCTAssert([experienceIdJsonValue isKindOfClass:[NSString class]], @"Manifest contains an id which is not a string: %@", experienceIdJsonValue);
    return experienceIdJsonValue;
  }
  return nil;
}

- (void)experienceFinishedLoading
{
  NSString *recordId = [self _recordId];
  if (recordId) {
    [[EXKernel sharedInstance].appRegistry setExperienceFinishedLoading:YES onRecordWithId:recordId];
  } else {
    // TODO: this shouldn't ever happen, just including this for completeness in case the JS uses a (maybe old) manifest
    // that didn't get the recordId inserted. Can remove this check once kernel JS is gone
    [[EXKernel sharedInstance].appRegistry setExperienceFinishedLoading:YES onRecordWithExperienceId:self.experienceId];
  }
}

#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return _frame.source;
}

- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback
{
  // clear any potentially old loading state
  [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:nil forExperienceId:self.experienceId];

  EXKernelAppRecord *record = [[EXKernel sharedInstance].appRegistry newestRecordWithExperienceId:self.experienceId];
  if (record != nil) {
    _bundleUrl = bridge.bundleURL;
    _loadCallback = loadCallback;
    [record.appLoader requestJSBundleWithDelegate:self];
  }
}

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  // we allow the vanilla RN dev menu in some circumstances.
  BOOL isDetached = [EXShellManager sharedInstance].isDetached;
  BOOL isStandardDevMenuAllowed = [EXKernelDevKeyCommands sharedInstance].isLegacyMenuBehaviorEnabled || isDetached;

  NSDictionary *params = @{
                           @"frame": _frame,
                           @"manifest": _frame.manifest,
                           @"constants": @{
                               @"linkingUri": [EXKernelLinkingManager linkingUriForExperienceUri:_frame.initialUri],
                               @"deviceId": [EXKernel deviceInstallUUID],
                               @"expoRuntimeVersion": [EXBuildConstants sharedInstance].expoRuntimeVersion,
                               @"manifest": _frame.manifest,
                               @"appOwnership": [_frame.initialProps objectForKey:@"appOwnership"] ?: @"expo",
                               },
                           @"initialUri": [EXKernelLinkingManager uriTransformedForLinking:_frame.initialUri isUniversalLink:NO],
                           @"isDeveloper": @([self _doesManifestEnableDeveloperTools]),
                           @"isStandardDevMenuAllowed": @(isStandardDevMenuAllowed),
                           @"testEnvironment": @([EXShellManager sharedInstance].testEnvironment),
                           @"services": [EXKernel sharedInstance].serviceRegistry.allServices,
                           };
  return [self.versionManager extraModulesWithParams:params];
}

#pragma mark - EXKernelBundleLoaderDelegate

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress
{
  if (self.delegate) {
    [self.delegate reactAppManager:self loadedJavaScriptWithProgress:progress];
  }
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didFinishLoadingBundle:(NSData *)data
{
  if (_loadCallback) {
    if ([self compareVersionTo:22] == NSOrderedAscending) {
      SDK21RCTSourceLoadBlock legacyLoadCallback = (SDK21RCTSourceLoadBlock)_loadCallback;
      legacyLoadCallback(nil, data, data.length);
    } else {
      _loadCallback(nil, [[RCTSource alloc] initWithURL:_bundleUrl data:data]);
    }
  }
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didFailLoadingBundleWithError:(NSError *)error
{
  [self.delegate reactAppManager:self failedToDownloadBundleWithError:error];

  // RN is going to call RCTFatal() on this error, so keep a reference to it for later
  // so we can distinguish this non-fatal error from actual fatal cases.
  [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forExperienceId:self.experienceId];

  // react won't post this for us
  [[NSNotificationCenter defaultCenter] postNotificationName:[self versionedString:RCTJavaScriptDidFailToLoadNotification] object:error];

  if (_loadCallback) {
    if ([self compareVersionTo:22] == NSOrderedAscending) {
      SDK21RCTSourceLoadBlock legacyLoadCallback = (SDK21RCTSourceLoadBlock)_loadCallback;
      legacyLoadCallback(error, nil, 0);
    } else {
      _loadCallback(error, nil);
    }
  }
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

- (NSString * _Nullable)_recordId
{
  NSDictionary *manifest = _frame.manifest;
  if (manifest) {
    id recordId = manifest[@"recordId"];
    if ([recordId isKindOfClass:[NSString class]]) {
      return (NSString *)recordId;
    }
  }
  return nil;
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
  [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forExperienceId:self.experienceId];
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
