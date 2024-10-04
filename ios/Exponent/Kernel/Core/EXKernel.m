// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppState.h"
#import "EXAppViewController.h"
#import "EXBuildConstants.h"
#import "EXKernel.h"
#import "EXAbstractLoader.h"
#import "EXKernelAppRecord.h"
#import "EXKernelLinkingManager.h"
#import "EXLinkingManager.h"
#import "EXVersions.h"
#import "EXHomeModule.h"

#import <EXConstants/EXConstantsService.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTModuleData.h>
#import <React/RCTUtils.h>

#ifndef EX_DETACHED
// Kernel is DevMenu's delegate only in non-detached builds.
#import "EXDevMenuManager.h"
#import "EXDevMenuDelegateProtocol.h"

@interface EXKernel () <EXDevMenuDelegateProtocol>
@end
#endif

NS_ASSUME_NONNULL_BEGIN

NSString *kEXKernelErrorDomain = @"EXKernelErrorDomain";
NSString *kEXKernelShouldForegroundTaskEvent = @"foregroundTask";
NSString * const kEXKernelClearJSCacheUserDefaultsKey = @"EXKernelClearJSCacheUserDefaultsKey";
NSString * const kEXReloadActiveAppRequest = @"EXReloadActiveAppRequest";

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

#ifndef EX_DETACHED
    // Set the delegate of dev menu manager. Maybe it should be a separate class? Will see later once the delegate protocol gets too big.
    [[EXDevMenuManager sharedInstance] setDelegate:self];
#endif

    // register for notifications to request reloading the visible app
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleRequestReloadVisibleApp:)
                                                 name:kEXReloadActiveAppRequest
                                               object:nil];

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
  EXKernelAppRecord *destinationApp = [_appRegistry standaloneAppRecord] ?: [_appRegistry newestRecordWithScopeKey:notification.scopeKey];

  // This allows home app record to receive notification events as well.
  if (!destinationApp && [_appRegistry.homeAppRecord.scopeKey isEqualToString:notification.scopeKey]) {
    destinationApp = _appRegistry.homeAppRecord;
  }

  if (destinationApp) {
    // send the body to the already-open experience
    BOOL success = [self _dispatchJSEvent:@"Exponent.notification" body:notification.properties toApp:destinationApp];
    [self _moveAppToVisible:destinationApp];
    return success;
  } else {
    // no app is currently running for this experience id.
    // if we're Expo Go, we can query Home for a past experience in the user's history, and route the notification there.
    if (_browserController) {
      __weak typeof(self) weakSelf = self;
      [_browserController getHistoryUrlForScopeKey:notification.scopeKey completion:^(NSString *urlString) {
        if (urlString) {
          NSURL *url = [NSURL URLWithString:urlString];
          if (url) {
            [weakSelf createNewAppWithUrl:url initialProps:@{ @"notification": notification.properties }];
          }
        }
      }];
      // If we're here, there's no active app in appRegistry matching notification.experienceId
      // and we are in Expo Go, since _browserController is not nil.
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


- (void)reloadVisibleApp
{
  if (_browserController) {
    [EXUtil performSynchronouslyOnMainThread:^{
      [self->_browserController reloadVisibleApp];
    }];
  }
}

- (void)switchTasks
{
  if (!_browserController) {
    return;
  }
  
  if (_visibleApp != _appRegistry.homeAppRecord) {
#ifndef EX_DETACHED // Just to compile without access to EXDevMenuManager, we wouldn't get here either way because browser controller is unset in this case.
    [EXUtil performSynchronouslyOnMainThread:^{
      [[EXDevMenuManager sharedInstance] toggle];
    }];
#endif
  } else {
    EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
    for (NSString *recordId in appRegistry.appEnumerator) {
      EXKernelAppRecord *record = [appRegistry recordForId:recordId];
      // foreground the first thing we find
      [self _moveAppToVisible:record];
    }
  }
}

- (void)reloadAppWithScopeKey:(NSString *)scopeKey
{
  EXKernelAppRecord *appRecord = [_appRegistry newestRecordWithScopeKey:scopeKey];
  if (_browserController) {
    [self createNewAppWithUrl:appRecord.appLoader.manifestUrl initialProps:nil];
  } else if (_appRegistry.standaloneAppRecord && appRecord == _appRegistry.standaloneAppRecord) {
    [appRecord.viewController refresh];
  }
}

- (void)reloadAppFromCacheWithScopeKey:(NSString *)scopeKey
{
  EXKernelAppRecord *appRecord = [_appRegistry newestRecordWithScopeKey:scopeKey];
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


- (void)_handleRequestReloadVisibleApp:(NSNotification *)notification
{
  [self reloadVisibleApp];
}

- (void)_moveAppToVisible:(EXKernelAppRecord *)appRecord
{
  if (_browserController) {
    [EXUtil performSynchronouslyOnMainThread:^{
      [self->_browserController moveAppToVisible:appRecord];
    }];
  }
}

#ifndef EX_DETACHED
#pragma mark - EXDevMenuDelegateProtocol

- (RCTBridge *)mainBridgeForDevMenuManager:(EXDevMenuManager *)manager
{
  return _appRegistry.homeAppRecord.appManager.reactBridge;
}

- (nullable RCTBridge *)appBridgeForDevMenuManager:(EXDevMenuManager *)manager
{
  if (_visibleApp == _appRegistry.homeAppRecord) {
    return nil;
  }
  return _visibleApp.appManager.reactBridge;
}

- (BOOL)devMenuManager:(EXDevMenuManager *)manager canChangeVisibility:(BOOL)visibility
{
  return !visibility || _visibleApp != _appRegistry.homeAppRecord;
}

#endif

@end

NS_ASSUME_NONNULL_END
