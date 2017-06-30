// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXAppState.h"
#import "EXKernelDevMenuViewController.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernel.h"
#import "EXKernelBridgeRecord.h"
#import "EXKernelDevMotionHandler.h"
#import "EXKernelDevKeyCommands.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelModule.h"
#import "EXLinkingManager.h"
#import "EXManifestResource.h"
#import "EXShellManager.h"
#import "EXVersions.h"
#import "EXViewController.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTModuleData.h>
#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

NSString *kEXKernelErrorDomain = @"EXKernelErrorDomain";
NSNotificationName kEXKernelRefreshForegroundTaskNotification = @"EXKernelRefreshForegroundTaskNotification";
NSNotificationName kEXKernelGetPushTokenNotification = @"EXKernelGetPushTokenNotification";
NSNotificationName kEXKernelJSIsLoadedNotification = @"EXKernelJSIsLoadedNotification";
NSString *kEXKernelShouldForegroundTaskEvent = @"foregroundTask";
NSString * const kEXDeviceInstallUUIDKey = @"EXDeviceInstallUUIDKey";
NSString * const kEXKernelClearJSCacheUserDefaultsKey = @"EXKernelClearJSCacheUserDefaultsKey";
NSString * const EXKernelDisableNuxDefaultsKey = @"EXKernelDisableNuxDefaultsKey";
NSString * const kEXChangeForegroundTaskSupportedOrientationsNotification = @"EXChangeForegroundTaskSupportedOrientations";

@interface EXKernel ()

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

+ (BOOL)isDevKernel
{
  return NO;
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

- (instancetype)init
{
  if (self = [super init]) {
    _bridgeRegistry = [[EXKernelBridgeRegistry alloc] init];
    _serviceRegistry = [[EXKernelServiceRegistry alloc] init];
    [EXKernelDevMotionHandler sharedInstance];
    [EXKernelDevKeyCommands sharedInstance];
    [EXKernelLinkingManager sharedInstance];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_refreshForegroundTask:)
                                                 name:kEXKernelRefreshForegroundTaskNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_changeSupportedOrientations:)
                                                 name:kEXChangeForegroundTaskSupportedOrientationsNotification
                                               object:nil];
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
    NSLog(@"Expo iOS Client Version %@", [[[NSBundle mainBundle] infoDictionary] objectForKey:@"EXClientVersion"]);
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)sendNotification:(NSDictionary *)notifBody
      toExperienceWithId:(NSString *)destinationExperienceId
          fromBackground:(BOOL)isFromBackground
                isRemote:(BOOL)isRemote
{
  EXReactAppManager *destinationAppManager = _bridgeRegistry.kernelAppManager;
  for (id bridge in [_bridgeRegistry bridgeEnumerator]) {
    EXKernelBridgeRecord *bridgeRecord = [_bridgeRegistry recordForBridge:bridge];
    if (bridgeRecord.experienceId && [bridgeRecord.experienceId isEqualToString:destinationExperienceId]) {
      destinationAppManager = bridgeRecord.appManager;
      break;
    }
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
    if (destinationAppManager == _bridgeRegistry.kernelAppManager) {
      // send both the body and the experience id, so we can open a new experience from the kernel
      [self _dispatchJSEvent:@"Exponent.notification"
                        body:@{
                               @"body": bodyWithOrigin,
                               @"experienceId": destinationExperienceId,
                               }
                onAppManager:_bridgeRegistry.kernelAppManager];
    } else {
      // send the body to the already-open experience
      [self _dispatchJSEvent:@"Exponent.notification" body:bodyWithOrigin onAppManager:destinationAppManager];
      [self _moveAppManagerToForeground:destinationAppManager];
    }
  }
}

- (void)registerRootExponentViewController:(EXViewController *)exponentViewController
{
  _vcExponentRoot = exponentViewController;
}

- (EXViewController *)rootViewController
{
  return _vcExponentRoot;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForForegroundTask
{
  if (_bridgeRegistry.lastKnownForegroundBridge) {
    if (_bridgeRegistry.lastKnownForegroundBridge != _bridgeRegistry.kernelAppManager.reactBridge) {
      EXKernelBridgeRecord *foregroundBridgeRecord = [_bridgeRegistry recordForBridge:_bridgeRegistry.lastKnownForegroundBridge];
      if (foregroundBridgeRecord.appManager.frame) {
        return foregroundBridgeRecord.appManager.frame.supportedInterfaceOrientations;
      }
    }
  }
  // kernel or unknown bridge: lock to portrait
  return UIInterfaceOrientationMaskPortrait;
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

#pragma mark - Mis  c

- (void)openUrl:(NSString *)url onAppManager:(EXReactAppManager *)appManager
{
  // fire a Linking url event on this (possibly versioned) bridge
  id linkingModule = [self nativeModuleForAppManager:appManager named:@"LinkingManager"];
  if (!linkingModule) {
    DDLogError(@"Could not find the Linking module to open URL (%@)", url);
  } else if ([linkingModule respondsToSelector:@selector(dispatchOpenUrlEvent:)]) {
    [linkingModule dispatchOpenUrlEvent:[NSURL URLWithString:url]];
  } else {
    DDLogError(@"Linking module doesn't support the API we use to open URL (%@)", url);
  }
  [self _moveAppManagerToForeground:appManager];
}

- (void)_refreshForegroundTask:(NSNotification *)notif
{
  id notifBridge = notif.userInfo[@"bridge"];
  if ([notifBridge respondsToSelector:@selector(parentBridge)]) {
    notifBridge = [notifBridge parentBridge];
  }
  if (notifBridge == _bridgeRegistry.kernelAppManager.reactBridge) {
    DDLogError(@"Can't use ExponentUtil.reload() on the kernel bridge. Use RN dev tools to reload the bundle.");
    return;
  }
  if (notifBridge == _bridgeRegistry.lastKnownForegroundBridge) {
    // only the foreground task is allowed to force a reload
    [self dispatchKernelJSEvent:@"refresh" body:@{} onSuccess:nil onFailure:nil];
  }
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

#pragma mark - Bridge stuff

- (void)dispatchKernelJSEvent:(NSString *)eventName body:(NSDictionary *)eventBody onSuccess:(void (^_Nullable)(NSDictionary * _Nullable))success onFailure:(void (^_Nullable)(NSString * _Nullable))failure
{
  EXKernelModule *kernelModule = [self nativeModuleForAppManager:_bridgeRegistry.kernelAppManager named:@"ExponentKernel"];
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

- (void)_moveAppManagerToForeground: (EXReactAppManager *)appManager
{
  if (appManager != _bridgeRegistry.kernelAppManager) {
    EXFrameReactAppManager *frameAppManager = (EXFrameReactAppManager *)appManager;
    // kernel JS needs to bring the relevant frame/bridge to visibility.
    NSURL *frameUrlToForeground = frameAppManager.frame.initialUri;
    [self dispatchKernelJSEvent:kEXKernelShouldForegroundTaskEvent body:@{ @"taskUrl":frameUrlToForeground.absoluteString } onSuccess:nil onFailure:nil];
  }
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

#pragma mark - EXKernelModuleDelegate

- (BOOL)kernelModuleShouldEnableLegacyMenuBehavior:(EXKernelModule *)module
{
  return [EXKernelDevKeyCommands sharedInstance].isLegacyMenuBehaviorEnabled;
}

- (void)kernelModule:(EXKernelModule *)module didSelectEnableLegacyMenuBehavior:(BOOL)isEnabled
{
  [EXKernelDevKeyCommands sharedInstance].isLegacyMenuBehaviorEnabled = isEnabled;
}

- (BOOL)kernelModuleShouldEnableDevtools:(__unused EXKernelModule *)module
{
  return (
    _bridgeRegistry.lastKnownForegroundAppManager != _bridgeRegistry.kernelAppManager &&
    [_bridgeRegistry.lastKnownForegroundAppManager areDevtoolsEnabled]
  );
}

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForKernelModule:(EXKernelModule *)module
{
  return [_bridgeRegistry.lastKnownForegroundAppManager devMenuItems];
}

- (void)kernelModule:(EXKernelModule *)module didSelectDevMenuItemWithKey:(NSString *)key
{
  [_bridgeRegistry.lastKnownForegroundAppManager selectDevMenuItemWithKey:key];
}

- (void)kernelModuleDidSelectKernelDevMenu:(__unused EXKernelModule *)module
{
  EXKernelDevMenuViewController *vcDevMenu = [[EXKernelDevMenuViewController alloc] init];
  if (_vcExponentRoot) {
    [_vcExponentRoot presentViewController:vcDevMenu animated:YES completion:nil];
  }
}

- (BOOL)kernelModuleShouldAutoReloadCurrentTask:(EXKernelModule *)module
{
  NSString *foregroundTaskExperienceId = _bridgeRegistry.lastKnownForegroundAppManager.experienceId;
  return [_serviceRegistry.errorRecoveryManager experienceIdShouldReloadOnError:foregroundTaskExperienceId];
}

- (void)kernelModule:(__unused EXKernelModule *)module taskDidForegroundWithType:(NSInteger)type params:(NSDictionary *)params
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
    appManagerToForeground = _bridgeRegistry.kernelAppManager;
  }
  if (routetype == kEXKernelRouteBrowser && !urlToBackground) {
    appManagerToBackground = _bridgeRegistry.kernelAppManager;
  }

  for (id bridge in [_bridgeRegistry bridgeEnumerator]) {
    EXKernelBridgeRecord *bridgeRecord = [_bridgeRegistry recordForBridge:bridge];
    if (urlToForeground && [bridgeRecord.appManager.frame.initialUri.absoluteString isEqualToString:urlToForeground]) {
      appManagerToForeground = bridgeRecord.appManager;
    } else if (urlToBackground && [bridgeRecord.appManager.frame.initialUri.absoluteString isEqualToString:urlToBackground]) {
      appManagerToBackground = bridgeRecord.appManager;
    }
  }
  
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
    _bridgeRegistry.lastKnownForegroundBridge = appManagerToForeground.reactBridge;
  } else {
    _bridgeRegistry.lastKnownForegroundBridge = nil;
  }
}

- (void)kernelModule:(EXKernelModule *)module didRequestManifestWithUrl:(NSURL *)url originalUrl:(NSURL *)originalUrl success:(void (^)(NSString *))success failure:(void (^)(NSError *))failure
{
  if (!([url.scheme isEqualToString:@"http"] || [url.scheme isEqualToString:@"https"])) {
    NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:NO];
    components.scheme = @"http";
    url = [components URL];
  }
  EXCachedResourceBehavior cacheBehavior = kEXCachedResourceFallBackToCache;
  if ([url.host isEqualToString:@"localhost"]) {
    // we can't pre-detect if this person is using a developer tool, but using localhost is a pretty solid indicator.
    cacheBehavior = kEXCachedResourceNoCache;
  }
  EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:url originalUrl:originalUrl];
  [manifestResource loadResourceWithBehavior:cacheBehavior successBlock:^(NSData * _Nonnull data) {
    NSString *manifestString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    success(manifestString);
  } errorBlock:^(NSError * _Nonnull error) {
#if DEBUG
    if ([EXShellManager sharedInstance].isShell && error && error.code == 404) {
      NSString *message = error.localizedDescription;
      message = [NSString stringWithFormat:@"Make sure you are serving your project from XDE or exp (%@)", message];
      error = [NSError errorWithDomain:error.domain code:error.code userInfo:@{ NSLocalizedDescriptionKey: message }];
    }
#endif
    failure(error);
  }];
}

#pragma mark - App State

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
  
  if (_bridgeRegistry.lastKnownForegroundBridge) {
    EXReactAppManager *appManager = [_bridgeRegistry lastKnownForegroundAppManager];
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
        [self _postNotificationName:kEXKernelBridgeDidForegroundNotification onAbstractBridge:_bridgeRegistry.lastKnownForegroundBridge];
      } else if ([newState isEqualToString:@"background"]) {
        [self _postNotificationName:kEXKernelBridgeDidBackgroundNotification onAbstractBridge:_bridgeRegistry.lastKnownForegroundBridge];
      }
    }
  }
}

- (void)_changeSupportedOrientations:(NSNotification *)notification
{
  NSNumber *orientationNumber = notification.userInfo[@"orientation"];
  if (_bridgeRegistry.lastKnownForegroundBridge) {
    if (_bridgeRegistry.lastKnownForegroundBridge != _bridgeRegistry.kernelAppManager.reactBridge) {
      EXKernelBridgeRecord *foregroundBridgeRecord = [_bridgeRegistry recordForBridge:_bridgeRegistry.lastKnownForegroundBridge];
      if (foregroundBridgeRecord.appManager.frame) {
        foregroundBridgeRecord.appManager.frame.supportedInterfaceOrientations = [orientationNumber unsignedIntegerValue];
      }
    }
  }
}

@end

NS_ASSUME_NONNULL_END
