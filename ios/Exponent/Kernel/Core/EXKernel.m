// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXAppState.h"
#import "EXBuildConstants.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "EXKernelModule.h"
#import "EXKernelLinkingManager.h"
#import "EXLinkingManager.h"
#import "EXVersions.h"
#import "EXViewController.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTModuleData.h>
#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

NSString *kEXKernelErrorDomain = @"EXKernelErrorDomain";
NSNotificationName kEXKernelJSIsLoadedNotification = @"EXKernelJSIsLoadedNotification";
NSNotificationName kEXKernelAppDidDisplay = @"EXKernelAppDidDisplay";
NSString *kEXKernelShouldForegroundTaskEvent = @"foregroundTask";
NSString * const kEXDeviceInstallUUIDKey = @"EXDeviceInstallUUIDKey";
NSString * const kEXKernelClearJSCacheUserDefaultsKey = @"EXKernelClearJSCacheUserDefaultsKey";
NSString * const EXKernelDisableNuxDefaultsKey = @"EXKernelDisableNuxDefaultsKey";

@interface EXKernel () <EXKernelAppRegistryDelegate>

@property (nonatomic, weak) EXViewController *vcExponentRoot;

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

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_onKernelJSLoaded) name:kEXKernelJSIsLoadedNotification object:nil];
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

- (void)registerRootExponentViewController:(EXViewController *)exponentViewController
{
  _vcExponentRoot = exponentViewController;
}

- (EXViewController *)rootViewController
{
  return _vcExponentRoot;
}

- (void)_onKernelJSLoaded
{
  // used by appetize: optionally disable nux
  BOOL disableNuxDefaultsValue = [[NSUserDefaults standardUserDefaults] boolForKey:EXKernelDisableNuxDefaultsKey];
  if (disableNuxDefaultsValue) {
    [self dispatchKernelJSEvent:@"resetNuxState" body:@{ @"isNuxCompleted": @YES } onSuccess:nil onFailure:nil];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:EXKernelDisableNuxDefaultsKey];
  }
}

#pragma mark - Misc

- (void)openUrl:(NSString *)urlString onAppManager:(EXReactAppManager *)appManager
{
  // fire a Linking url event on this (possibly versioned) bridge
  id linkingModule = [self nativeModuleForAppManager:appManager named:@"LinkingManager"];
  if (!linkingModule) {
    DDLogError(@"Could not find the Linking module to open URL (%@)", urlString);
  } else if ([linkingModule respondsToSelector:@selector(dispatchOpenUrlEvent:)]) {
    [linkingModule dispatchOpenUrlEvent:[NSURL URLWithString:urlString]];
  } else {
    DDLogError(@"Linking module doesn't support the API we use to open URL (%@)", urlString);
  }
  [self _moveAppManagerToForeground:appManager];
}

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

#pragma mark - interfacing with app managers

- (void)dispatchKernelJSEvent:(NSString *)eventName body:(NSDictionary *)eventBody onSuccess:(void (^_Nullable)(NSDictionary * _Nullable))success onFailure:(void (^_Nullable)(NSString * _Nullable))failure
{
  EXKernelModule *kernelModule = [self nativeModuleForAppManager:_appRegistry.kernelAppManager named:@"ExponentKernel"];
  if (kernelModule) {
    [kernelModule dispatchJSEvent:eventName body:eventBody onSuccess:success onFailure:failure];
  }
}

- (void)_dispatchJSEvent:(NSString *)eventName body:(NSDictionary *)eventBody onAppManager:(EXReactAppManager *)appManager
{
  [appManager.reactBridge enqueueJSCall:@"RCTDeviceEventEmitter.emit"
                                   args:eventBody ? @[eventName, eventBody] : @[eventName]];
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
    DDLogError(@"Bridge does not support the API we use to get its underlying batched bridge");
  }
  return nil;
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

- (void)sendNotification:(NSDictionary *)notifBody
      toExperienceWithId:(NSString *)destinationExperienceId
          fromBackground:(BOOL)isFromBackground
                isRemote:(BOOL)isRemote
{
  EXReactAppManager *destinationAppManager = _appRegistry.kernelAppManager;
  EXKernelAppRecord *recordWithExperienceId = [_appRegistry newestRecordWithExperienceId:destinationExperienceId];
  if (recordWithExperienceId && recordWithExperienceId.appManager) {
    destinationAppManager = recordWithExperienceId.appManager;
  }
  // if the notification came from the background, in most but not all cases, this means the user acted on an iOS notification
  // and caused the app to launch.
  // From SO:
  // > Note that "App opened from Notification" will be a false positive if the notification is sent while the user is on a different
  // > screen (for example, if they pull down the status bar and then receive a notification from your app).
  NSDictionary *bodyWithOrigin = @{
                                   @"origin": (isFromBackground) ? @"selected" : @"received",
                                   @"remote": @(isRemote),
                                   @"data": notifBody,
                                   };
  if (destinationAppManager) {
    if (destinationAppManager == _appRegistry.kernelAppManager) {
      // send both the body and the experience id, so we can open a new experience from the kernel
      [self _dispatchJSEvent:@"Exponent.notification"
                        body:@{
                               @"body": bodyWithOrigin,
                               @"experienceId": destinationExperienceId,
                               }
                onAppManager:_appRegistry.kernelAppManager];
    } else {
      // send the body to the already-open experience
      [self _dispatchJSEvent:@"Exponent.notification" body:bodyWithOrigin onAppManager:destinationAppManager];
      [self _moveAppManagerToForeground:destinationAppManager];
    }
  }
}

#pragma mark - App State

- (void)handleJSTaskDidForegroundWithType:(NSInteger)type params:(NSDictionary *)params
{
  EXKernelRoute routetype = (EXKernelRoute)type;
  [[EXAnalytics sharedInstance] logForegroundEventForRoute:routetype fromJS:YES];
  
  NSString *urlToForeground, *urlToBackground;
  if (params) {
    urlToForeground = RCTNilIfNull(params[@"url"]);
    urlToBackground = RCTNilIfNull(params[@"urlToBackground"]);
  }
  
  EXReactAppManager *appManagerToForeground = nil;
  EXReactAppManager *appManagerToBackground = nil;
  
  if (routetype == kEXKernelRouteHome) {
    appManagerToForeground = _appRegistry.kernelAppManager;
  }
  if (routetype == kEXKernelRouteBrowser && !urlToBackground) {
    appManagerToBackground = _appRegistry.kernelAppManager;
  }
  
  for (NSString *recordId in [_appRegistry appEnumerator]) {
    EXKernelAppRecord *appRecord = [_appRegistry recordForId:recordId];
    if (!appRecord || appRecord.status != EXKernelAppRecordStatusRunning) {
      continue;
    }
    if (urlToForeground && appRecord.appManager && [appRecord.appManager.frame.initialUri.absoluteString isEqualToString:urlToForeground]) {
      appManagerToForeground = appRecord.appManager;
    } else if (urlToBackground && appRecord.appManager && [appRecord.appManager.frame.initialUri.absoluteString isEqualToString:urlToBackground]) {
      appManagerToBackground = appRecord.appManager;
    }
  }
  
  if ([_serviceRegistry.linkingManager isRefreshExpectedForAppManager:appManagerToForeground]) {
    // shell app foregrounded the same bridge as before.
    // this would be a no-op, so we force a reload on the existing frame.
    // this is usually triggered by calling Util.reload() when no new JS bundle is available.
    [((EXFrameReactAppManager *)_appRegistry.lastKnownForegroundAppManager).frame reload];
  } else {
    if (appManagerToBackground) {
      [self _postNotificationName:kEXKernelBridgeDidBackgroundNotification onAbstractBridge:appManagerToBackground.reactBridge];
      id appStateModule = [self nativeModuleForAppManager:appManagerToBackground named:@"AppState"];
      if ([appStateModule respondsToSelector:@selector(setState:)]) {
        [appStateModule setState:@"background"];
      }
    }
    if (appManagerToForeground) {
      [self _postNotificationName:kEXKernelBridgeDidForegroundNotification onAbstractBridge:appManagerToForeground.reactBridge];
      id appStateModule = [self nativeModuleForAppManager:appManagerToForeground named:@"AppState"];
      if ([appStateModule respondsToSelector:@selector(setState:)]) {
        [appStateModule setState:@"active"];
      }
      _appRegistry.lastKnownForegroundAppManager = appManagerToForeground;
    } else {
      _appRegistry.lastKnownForegroundAppManager = nil;
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
  
  if (_appRegistry.lastKnownForegroundAppManager) {
    EXReactAppManager *appManager = [_appRegistry lastKnownForegroundAppManager];
    id appStateModule = [self nativeModuleForAppManager:appManager named:@"AppState"];
    NSString *lastKnownState;
    if ([appStateModule respondsToSelector:@selector(lastKnownState)]) {
      lastKnownState = [appStateModule lastKnownState];
    }
    if ([appStateModule respondsToSelector:@selector(setState:)]) {
      [appStateModule setState:newState];
    }
    if (!lastKnownState || ![newState isEqualToString:lastKnownState]) {
      if ([newState isEqualToString:@"active"]) {
        [self _postNotificationName:kEXKernelBridgeDidForegroundNotification onAbstractBridge:_appRegistry.lastKnownForegroundAppManager.reactBridge];
      } else if ([newState isEqualToString:@"background"]) {
        [self _postNotificationName:kEXKernelBridgeDidBackgroundNotification onAbstractBridge:_appRegistry.lastKnownForegroundAppManager.reactBridge];
      }
    }
  }
}

- (void)_moveAppManagerToForeground: (EXReactAppManager *)appManager
{
  if (appManager != _appRegistry.kernelAppManager) {
    EXFrameReactAppManager *frameAppManager = (EXFrameReactAppManager *)appManager;
    // kernel JS needs to bring the relevant frame/bridge to visibility.
    NSURL *frameUrlToForeground = frameAppManager.frame.initialUri;
    [self dispatchKernelJSEvent:kEXKernelShouldForegroundTaskEvent body:@{ @"taskUrl":frameUrlToForeground.absoluteString } onSuccess:nil onFailure:nil];
  }
}

@end

NS_ASSUME_NONNULL_END
