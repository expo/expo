// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXAppState.h"
#import "EXAppViewController.h"
#import "EXBuildConstants.h"
#import "EXKernel.h"
#import "EXAppLoader.h"
#import "EXKernelAppRecord.h"
#import "EXKernelLinkingManager.h"
#import "EXLinkingManager.h"
#import "EXVersions.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTModuleData.h>
#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

NSString *kEXKernelErrorDomain = @"EXKernelErrorDomain";
NSString *kEXKernelShouldForegroundTaskEvent = @"foregroundTask";
NSString * const kEXDeviceInstallUUIDKey = @"EXDeviceInstallUUIDKey";
NSString * const kEXKernelClearJSCacheUserDefaultsKey = @"EXKernelClearJSCacheUserDefaultsKey";

@interface EXKernel () <EXKernelAppRegistryDelegate>

@end

// Protocol that should be implemented by all versions of EXAppState class.
@protocol EXAppStateProtocol

@property (nonatomic, strong, readonly) NSString *lastKnownState;

- (void)setState:(NSString *)state;

@end

@implementation EXKernel

+ (instancetype)sharedInstance
{
  static EXKernel *theKernel;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theKernel) {
      theKernel = [[EXKernel alloc] init];
    }
  });
  return theKernel;
}

- (instancetype)init
{
  if (self = [super init]) {
    // init app registry: keep track of RN bridges we are running
    _appRegistry = [[EXKernelAppRegistry alloc] init];
    _appRegistry.delegate = self;

    // init service registry: classes which manage shared resources among all bridges
    _serviceRegistry = [[EXKernelServiceRegistry alloc] init];

    for (NSString *name in @[UIApplicationDidBecomeActiveNotification,
                             UIApplicationDidEnterBackgroundNotification,
                             UIApplicationDidFinishLaunchingNotification,
                             UIApplicationWillResignActiveNotification,
                             UIApplicationWillEnterForegroundNotification]) {
      
      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(_handleAppStateDidChange:)
                                                   name:name
                                                 object:nil];
    }
    NSLog(@"Expo iOS Runtime Version %@", [EXBuildConstants sharedInstance].expoRuntimeVersion);
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Misc

+ (NSString *)deviceInstallUUID
{
  NSString *uuid = [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallUUIDKey];
  if (!uuid) {
    uuid = [[NSUUID UUID] UUIDString];
    [[NSUserDefaults standardUserDefaults] setObject:uuid forKey:kEXDeviceInstallUUIDKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
  }
  return uuid;
}

- (void)logAnalyticsEvent:(NSString *)eventId forAppRecord:(EXKernelAppRecord *)appRecord
{
  if (_appRegistry.homeAppRecord && appRecord == _appRegistry.homeAppRecord) {
    return;
  }
  NSString *validatedSdkVersion = [[EXVersions sharedInstance] availableSdkVersionForManifest:appRecord.appLoader.manifest];
  NSDictionary *props = (validatedSdkVersion) ? @{ @"SDK_VERSION": validatedSdkVersion } : @{};
  [[EXAnalytics sharedInstance] logEvent:eventId
                             manifestUrl:appRecord.appLoader.manifestUrl
                         eventProperties:props];
}

#pragma mark - bridge registry delegate

- (void)appRegistry:(EXKernelAppRegistry *)registry didRegisterAppRecord:(EXKernelAppRecord *)appRecord
{
  // forward to service registry
  [_serviceRegistry appRegistry:registry didRegisterAppRecord:appRecord];
}

- (void)appRegistry:(EXKernelAppRegistry *)registry willUnregisterAppRecord:(EXKernelAppRecord *)appRecord
{
  // forward to service registry
  [_serviceRegistry appRegistry:registry willUnregisterAppRecord:appRecord];
}

#pragma mark - Interfacing with JS

- (void)sendUrl:(NSString *)urlString toAppRecord:(EXKernelAppRecord *)app
{
  // fire a Linking url event on this (possibly versioned) bridge
  EXReactAppManager *appManager = app.appManager;
  id linkingModule = [self nativeModuleForAppManager:appManager named:@"LinkingManager"];
  if (!linkingModule) {
    DDLogError(@"Could not find the Linking module to open URL (%@)", urlString);
  } else if ([linkingModule respondsToSelector:@selector(dispatchOpenUrlEvent:)]) {
    [linkingModule dispatchOpenUrlEvent:[NSURL URLWithString:urlString]];
  } else {
    DDLogError(@"Linking module doesn't support the API we use to open URL (%@)", urlString);
  }
  [self _moveAppToVisible:app];
}

- (id)nativeModuleForAppManager:(EXReactAppManager *)appManager named:(NSString *)moduleName
{
  id destinationBridge = appManager.reactBridge;

  if ([destinationBridge respondsToSelector:@selector(batchedBridge)]) {
    id batchedBridge = [destinationBridge batchedBridge];
    id moduleData = [batchedBridge moduleDataForName:moduleName];
    
    // React Native before SDK 11 didn't strip the "RCT" prefix from module names
    if (!moduleData && ![moduleName hasPrefix:@"RCT"]) {
      moduleData = [batchedBridge moduleDataForName:[@"RCT" stringByAppendingString:moduleName]];
    }
    
    if (moduleData) {
      return [moduleData instance];
    }
  } else {
    // bridge can be null if the record is in an error state and never created a bridge.
    if (destinationBridge) {
      DDLogError(@"Bridge does not support the API we use to get its underlying batched bridge");
    }
  }
  return nil;
}

- (BOOL)sendNotification:(EXPendingNotification *)notification
{
  EXKernelAppRecord *destinationApp = [_appRegistry standaloneAppRecord] ?: [_appRegistry newestRecordWithExperienceId:notification.experienceId];

  // This allows home app record to receive notification events as well.
  if (!destinationApp && [_appRegistry.homeAppRecord.experienceId isEqualToString:notification.experienceId]) {
    destinationApp = _appRegistry.homeAppRecord;
  }

  if (destinationApp) {
    // send the body to the already-open experience
    BOOL success = [self _dispatchJSEvent:@"Exponent.notification" body:notification.properties toApp:destinationApp];
    [self _moveAppToVisible:destinationApp];
    return success;
  } else {
    // no app is currently running for this experience id.
    // if we're Expo Client, we can query Home for a past experience in the user's history, and route the notification there.
    if (_browserController) {
      __weak typeof(self) weakSelf = self;
      [_browserController getHistoryUrlForExperienceId:notification.experienceId completion:^(NSString *urlString) {
        if (urlString) {
          NSURL *url = [NSURL URLWithString:urlString];
          if (url) {
            [weakSelf createNewAppWithUrl:url initialProps:@{ @"notification": notification.properties }];
          }
        }
      }];
      // If we're here, there's no active app in appRegistry matching notification.experienceId
      // and we are in Expo Client, since _browserController is not nil.
      // If so, we can return YES (meaning "notification has been successfully dispatched")
      // because we pass the notification as initialProps in completion handler
      // of getHistoryUrlForExperienceId:. If urlString passed to completion handler is empty,
      // the notification is forgotten (this is the expected behavior).
      return YES;
    }
  }

  return NO;
}

/**
 *  If the bridge has a batchedBridge or parentBridge selector, posts the notification on that object as well.
 */
- (void)_postNotificationName: (NSNotificationName)name onAbstractBridge: (id)bridge
{
  [[NSNotificationCenter defaultCenter] postNotificationName:name object:bridge];
  if ([bridge respondsToSelector:@selector(batchedBridge)]) {
    [[NSNotificationCenter defaultCenter] postNotificationName:name object:[bridge batchedBridge]];
  } else if ([bridge respondsToSelector:@selector(parentBridge)]) {
    [[NSNotificationCenter defaultCenter] postNotificationName:name object:[bridge parentBridge]];
  }
}

- (BOOL)_dispatchJSEvent:(NSString *)eventName body:(NSDictionary *)eventBody toApp:(EXKernelAppRecord *)appRecord
{
  if (!appRecord.appManager.reactBridge) {
    return NO;
  }
  [appRecord.appManager.reactBridge enqueueJSCall:@"RCTDeviceEventEmitter.emit"
                                             args:eventBody ? @[eventName, eventBody] : @[eventName]];
  return YES;
}

#pragma mark - App props

- (nullable NSDictionary *)initialAppPropsFromLaunchOptions:(NSDictionary *)launchOptions
{
  return nil;
}

#pragma mark - App State

- (EXKernelAppRecord *)createNewAppWithUrl:(NSURL *)url initialProps:(nullable NSDictionary *)initialProps
{
  NSString *recordId = [_appRegistry registerAppWithManifestUrl:url initialProps:initialProps];
  EXKernelAppRecord *record = [_appRegistry recordForId:recordId];
  [self _moveAppToVisible:record];
  return record;
}

- (void)switchTasks
{
  if (!_browserController) {
    return;
  }
  
  if (_visibleApp != _appRegistry.homeAppRecord) {
    [EXUtil performSynchronouslyOnMainThread:^{
      [self->_browserController toggleMenuWithCompletion:nil];
    }];
  } else {
    EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
    for (NSString *recordId in appRegistry.appEnumerator) {
      EXKernelAppRecord *record = [appRegistry recordForId:recordId];
      // foreground the first thing we find
      [self _moveAppToVisible:record];
    }
  }
}

- (void)reloadAppWithExperienceId:(NSString *)experienceId
{
  EXKernelAppRecord *appRecord = [_appRegistry newestRecordWithExperienceId:experienceId];
  if (_browserController) {
    [self createNewAppWithUrl:appRecord.appLoader.manifestUrl initialProps:nil];
  } else if (_appRegistry.standaloneAppRecord && appRecord == _appRegistry.standaloneAppRecord) {
    [appRecord.viewController refresh];
  }
}

- (void)reloadAppFromCacheWithExperienceId:(NSString *)experienceId
{
  EXKernelAppRecord *appRecord = [_appRegistry newestRecordWithExperienceId:experienceId];
  [appRecord.viewController reloadFromCache];
}

- (void)viewController:(__unused EXViewController *)vc didNavigateAppToVisible:(EXKernelAppRecord *)appRecord
{
  EXKernelAppRecord *appRecordPreviouslyVisible = _visibleApp;
  if (appRecord != appRecordPreviouslyVisible) {
    if (appRecordPreviouslyVisible) {
      [appRecordPreviouslyVisible.viewController appStateDidBecomeInactive];
      [self _postNotificationName:kEXKernelBridgeDidBackgroundNotification onAbstractBridge:appRecordPreviouslyVisible.appManager.reactBridge];
      id<EXAppStateProtocol> appStateModule = [self nativeModuleForAppManager:appRecordPreviouslyVisible.appManager named:@"AppState"];
      if (appStateModule != nil) {
        [appStateModule setState:@"background"];
      }
    }
    if (appRecord) {
      [appRecord.viewController appStateDidBecomeActive];
      [self _postNotificationName:kEXKernelBridgeDidForegroundNotification onAbstractBridge:appRecord.appManager.reactBridge];
      id<EXAppStateProtocol> appStateModule = [self nativeModuleForAppManager:appRecord.appManager named:@"AppState"];
      if (appStateModule != nil) {
        [appStateModule setState:@"active"];
      }
      _visibleApp = appRecord;
      [[EXAnalytics sharedInstance] logAppVisibleEvent];
    } else {
      _visibleApp = nil;
    }
    
    if (_visibleApp && _visibleApp != _appRegistry.homeAppRecord) {
      [self _unregisterUnusedAppRecords];
    }
  }
}

- (void)_unregisterUnusedAppRecords
{
  for (NSString *recordId in _appRegistry.appEnumerator) {
    EXKernelAppRecord *record = [_appRegistry recordForId:recordId];
    if (record && record != _visibleApp) {
      [_appRegistry unregisterAppWithRecordId:recordId];
      break;
    }
  }
}

- (void)_handleAppStateDidChange:(NSNotification *)notification
{
  NSString *newState;
  
  if ([notification.name isEqualToString:UIApplicationWillResignActiveNotification]) {
    newState = @"inactive";
  } else if ([notification.name isEqualToString:UIApplicationWillEnterForegroundNotification]) {
    newState = @"background";
  } else {
    switch (RCTSharedApplication().applicationState) {
      case UIApplicationStateActive:
        newState = @"active";
        break;
      case UIApplicationStateBackground: {
        newState = @"background";
        break;
      }
      default: {
        newState = @"unknown";
        break;
      }
    }
  }
  
  if (_visibleApp) {
    EXReactAppManager *appManager = _visibleApp.appManager;
    id<EXAppStateProtocol> appStateModule = [self nativeModuleForAppManager:appManager named:@"AppState"];
    NSString *lastKnownState;
    if (appStateModule != nil) {
      lastKnownState = [appStateModule lastKnownState];
      [appStateModule setState:newState];
    }
    if (!lastKnownState || ![newState isEqualToString:lastKnownState]) {
      if ([newState isEqualToString:@"active"]) {
        [_visibleApp.viewController appStateDidBecomeActive];
        [self _postNotificationName:kEXKernelBridgeDidForegroundNotification onAbstractBridge:appManager.reactBridge];
      } else if ([newState isEqualToString:@"background"]) {
        [_visibleApp.viewController appStateDidBecomeInactive];
        [self _postNotificationName:kEXKernelBridgeDidBackgroundNotification onAbstractBridge:appManager.reactBridge];
      }
    }
  }
}

- (void)_moveAppToVisible:(EXKernelAppRecord *)appRecord
{
  if (_browserController) {
    [EXUtil performSynchronouslyOnMainThread:^{
      [self->_browserController moveAppToVisible:appRecord];
    }];
  }
}

@end

NS_ASSUME_NONNULL_END
