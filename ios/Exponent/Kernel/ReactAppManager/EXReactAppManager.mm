#import "EXApiUtil.h"
#import "EXBuildConstants.h"
#import "EXEnvironment.h"
#import "EXErrorRecoveryManager.h"
#import "EXUserNotificationManager.h"
#import "EXKernel.h"
#import "EXAppLoader.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelServiceRegistry.h"
#import "EXKernelUtil.h"
#import "EXLog.h"
#import "ExpoKit.h"
#import "EXReactAppManager.h"
#import "EXReactAppManager+Private.h"
#import "EXVersionManager.h"
#import "EXVersions.h"
#import <UMCore/UMModuleRegistryProvider.h>
#import <EXSplashScreen/EXSplashScreenService.h>

#import <React/RCTBridge.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/JSCExecutorFactory.h>
#import <React/RCTRootView.h>
#import <ReactCommon/RCTTurboModuleManager.h>

@interface EXVersionManager (Legacy)
// TODO: remove after non-unimodules SDK versions are dropped

- (void)bridgeDidForeground;
- (void)bridgeDidBackground;

@end

typedef void (^SDK21RCTSourceLoadBlock)(NSError *error, NSData *source, int64_t sourceLength);

/**
 * TODO: Remove once SDK 38 is phased out.
 */
@protocol PreSDK39EXSplashScreenManagerProtocol

@property (assign) BOOL started;
@property (assign) BOOL finished;

@end

@implementation RCTSource (EXReactAppManager)

- (instancetype)initWithURL:(nonnull NSURL *)url data:(nonnull NSData *)data
{
  if (self = [super init]) {
    // Use KVO since RN publicly declares these properties as readonly and privately defines the
    // ivars
    [self setValue:url forKey:@"url"];
    [self setValue:data forKey:@"data"];
    [self setValue:@(data.length) forKey:@"length"];
    [self setValue:@(RCTSourceFilesChangedCountNotBuiltByBundler) forKey:@"filesChangedCount"];
  }
  return self;
}

@end

@interface EXReactAppManager () <RCTBridgeDelegate, RCTCxxBridgeDelegate>

@property (nonatomic, strong) UIView * __nullable reactRootView;
@property (nonatomic, copy) RCTSourceLoadBlock loadCallback;
@property (nonatomic, strong) NSDictionary *initialProps;
@property (nonatomic, strong) NSTimer *viewTestTimer;
@property (nonatomic, strong) RCTTurboModuleManager *turboModuleManager;

@end

@implementation EXReactAppManager

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record initialProps:(NSDictionary *)initialProps
{
  if (self = [super init]) {
    _appRecord = record;
    _initialProps = initialProps;
    _isHeadless = NO;
    _exceptionHandler = [[EXReactAppExceptionHandler alloc] initWithAppRecord:_appRecord];
  }
  return self;
}

- (void)setAppRecord:(EXKernelAppRecord *)appRecord
{
  _appRecord = appRecord;
  _exceptionHandler = [[EXReactAppExceptionHandler alloc] initWithAppRecord:appRecord];
}

- (EXReactAppManagerStatus)status
{
  if (!_appRecord) {
    return kEXReactAppManagerStatusError;
  }
  if (_loadCallback) {
    // we have a RCTBridge load callback so we're ready to receive load events
    return kEXReactAppManagerStatusBridgeLoading;
  }
  if (_isBridgeRunning) {
    return kEXReactAppManagerStatusRunning;
  }
  return kEXReactAppManagerStatusNew;
}

- (UIView *)rootView
{
  return _reactRootView;
}

- (void)rebuildBridge
{
  EXAssertMainThread();
  NSAssert((_delegate != nil), @"Cannot init react app without EXReactAppManagerDelegate");
  [self _invalidateAndClearDelegate:NO];
  [self computeVersionSymbolPrefix];
  
  if ([self isReadyToLoad]) {
    Class versionManagerClass = [self versionedClassFromString:@"EXVersionManager"];
    Class bridgeClass = [self versionedClassFromString:@"RCTBridge"];
    Class rootViewClass = [self versionedClassFromString:@"RCTRootView"];
    
    _versionManager = [[versionManagerClass alloc]
                       initWithParams:[self extraParams]
                       fatalHandler:handleFatalReactError
                       logFunction:[self logFunction]
                       logThreshold:[self logLevel]
                       ];
    _reactBridge = [[bridgeClass alloc] initWithDelegate:self launchOptions:[self launchOptionsForBridge]];

    if (!_isHeadless) {
      // We don't want to run the whole JS app if app launches in the background,
      // so we're omitting creation of RCTRootView that triggers runApplication and sets up React view hierarchy.
      _reactRootView = [[rootViewClass alloc] initWithBridge:_reactBridge
                                                  moduleName:[self applicationKeyForRootView]
                                           initialProperties:[self initialPropertiesForRootView]];
    }

    [_delegate reactAppManagerIsReadyForLoad:self];
    
    NSAssert([_reactBridge isLoading], @"React bridge should be loading once initialized");
    [_versionManager bridgeWillStartLoading:_reactBridge];
  }
}

- (NSDictionary *)extraParams
{
  // we allow the vanilla RN dev menu in some circumstances.
  BOOL isStandardDevMenuAllowed = [EXEnvironment sharedEnvironment].isDetached;
  NSMutableDictionary *params = [NSMutableDictionary dictionaryWithDictionary:@{
    @"manifest": _appRecord.appLoader.manifest,
    @"constants": @{
        @"linkingUri": RCTNullIfNil([EXKernelLinkingManager linkingUriForExperienceUri:_appRecord.appLoader.manifestUrl useLegacy:[self _compareVersionTo:27] == NSOrderedAscending]),
        @"experienceUrl": RCTNullIfNil(_appRecord.appLoader.manifestUrl? _appRecord.appLoader.manifestUrl.absoluteString: nil),
        @"expoRuntimeVersion": [EXBuildConstants sharedInstance].expoRuntimeVersion,
        @"manifest": _appRecord.appLoader.manifest,
        @"appOwnership": [self _appOwnership],
        @"isHeadless": @(_isHeadless),
        @"supportedExpoSdks": [EXVersions sharedInstance].versions[@"sdkVersions"],
    },
    @"exceptionsManagerDelegate": _exceptionHandler,
    @"initialUri": RCTNullIfNil([EXKernelLinkingManager initialUriWithManifestUrl:_appRecord.appLoader.manifestUrl]),
    @"isDeveloper": @([self enablesDeveloperTools]),
    @"isStandardDevMenuAllowed": @(isStandardDevMenuAllowed),
    @"testEnvironment": @([EXEnvironment sharedEnvironment].testEnvironment),
    @"services": [EXKernel sharedInstance].serviceRegistry.allServices,
    @"singletonModules": [UMModuleRegistryProvider singletonModules],
    @"moduleRegistryDelegateClass": RCTNullIfNil([self moduleRegistryDelegateClass]),
  }];
  if ([@"expo" isEqualToString:[self _appOwnership]]) {
    [params addEntriesFromDictionary:@{
      @"fileSystemDirectories": @{
          @"documentDirectory": [self scopedDocumentDirectory],
          @"cachesDirectory": [self scopedCachesDirectory]
      }
    }];
  }
  return params;
}

- (void)invalidate
{
  [self _invalidateAndClearDelegate:YES];
}

- (void)_invalidateAndClearDelegate:(BOOL)clearDelegate
{
  [self _stopObservingBridgeNotifications];
  if (_viewTestTimer) {
    [_viewTestTimer invalidate];
    _viewTestTimer = nil;
  }
  if (_versionManager) {
    [_versionManager invalidate];
    _versionManager = nil;
  }
  if (_reactRootView) {
    [_reactRootView removeFromSuperview];
    _reactRootView = nil;
  }
  if (_reactBridge) {
    [_reactBridge invalidate];
    _reactBridge = nil;
    if (_delegate) {
      [_delegate reactAppManagerDidInvalidate:self];
      if (clearDelegate) {
        _delegate = nil;
      }
    }
  }
  _isBridgeRunning = NO;
  [self _invalidateVersionState];
}

- (void)computeVersionSymbolPrefix
{
  // TODO: ben: kernel checks detached versions here
  _validatedVersion = [[EXVersions sharedInstance] availableSdkVersionForManifest:_appRecord.appLoader.manifest];
  _versionSymbolPrefix = [[EXVersions sharedInstance] symbolPrefixForSdkVersion:self.validatedVersion isKernel:NO];
}

- (void)_invalidateVersionState
{
  _versionSymbolPrefix = @"";
  _validatedVersion = nil;
}

- (Class)versionedClassFromString: (NSString *)classString
{
  return NSClassFromString([self versionedString:classString]);
}

- (NSString *)versionedString: (NSString *)string
{
  return [EXVersions versionedString:string withPrefix:_versionSymbolPrefix];
}

- (NSString *)escapedResourceName:(NSString *)string
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [string stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

- (BOOL)isReadyToLoad
{
  if (_appRecord) {
    return (_appRecord.appLoader.status == kEXAppLoaderStatusHasManifest || _appRecord.appLoader.status == kEXAppLoaderStatusHasManifestAndBundle);
  }
  return NO;
}

- (NSURL *)bundleUrl
{
  return [EXApiUtil bundleUrlFromManifest:_appRecord.appLoader.manifest];
}

- (void)appStateDidBecomeActive
{
  if ([_versionManager respondsToSelector:@selector(bridgeDidForeground)]) {
    // supported before SDK 29 / unimodules
    [_versionManager bridgeDidForeground];
  }
}

- (void)appStateDidBecomeInactive
{
  if ([_versionManager respondsToSelector:@selector(bridgeDidBackground)]) {
    [_versionManager bridgeDidBackground];
  }
}

#pragma mark - EXAppFetcherDataSource

- (NSString *)bundleResourceNameForAppFetcher:(EXAppFetcher *)appFetcher withManifest:(nonnull NSDictionary *)manifest
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    NSLog(@"Standalone bundle remote url is %@", [EXEnvironment sharedEnvironment].standaloneManifestUrl);
    return kEXEmbeddedBundleResourceName;
  } else {
    return manifest[@"id"];
  }
}

- (BOOL)appFetcherShouldInvalidateBundleCache:(EXAppFetcher *)appFetcher
{
  return NO;
}

#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleUrl];
}

- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback
{
  // clear any potentially old loading state
  [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:nil forExperienceId:_appRecord.experienceId];
  [self _stopObservingBridgeNotifications];
  [self _startObservingBridgeNotificationsForBridge:bridge];
  
  if ([self enablesDeveloperTools]) {
    if ([_appRecord.appLoader supportsBundleReload]) {
      [_appRecord.appLoader forceBundleReload];
    } else {
      [[EXKernel sharedInstance] reloadAppWithExperienceId:_appRecord.experienceId];
    }
  }
  
  _loadCallback = loadCallback;
  if (_appRecord.appLoader.status == kEXAppLoaderStatusHasManifestAndBundle) {
    // finish loading immediately (app loader won't call this since it's already done)
    [self appLoaderFinished];
  } else {
    // wait for something else to call `appLoaderFinished` or `appLoaderFailed` later.
  }
}

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  return [self.versionManager extraModulesForBridge:bridge];
}

- (void)appLoaderFinished
{
  NSData *data = _appRecord.appLoader.bundle;
  if (_loadCallback) {
    if ([self _compareVersionTo:22] == NSOrderedAscending) {
      SDK21RCTSourceLoadBlock legacyLoadCallback = (SDK21RCTSourceLoadBlock)_loadCallback;
      legacyLoadCallback(nil, data, data.length);
    } else {
      _loadCallback(nil, [[RCTSource alloc] initWithURL:[self bundleUrl] data:data]);
    }
    _loadCallback = nil;
  }
}

- (void)appLoaderFailedWithError:(NSError *)error
{
  // RN is going to call RCTFatal() on this error, so keep a reference to it for later
  // so we can distinguish this non-fatal error from actual fatal cases.
  if (_appRecord.experienceId) {
    [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forExperienceId:_appRecord.experienceId];
  }
  
  // react won't post this for us
  [[NSNotificationCenter defaultCenter] postNotificationName:[self versionedString:RCTJavaScriptDidFailToLoadNotification] object:error];
  
  if (_loadCallback) {
    if ([self _compareVersionTo:22] == NSOrderedAscending) {
      SDK21RCTSourceLoadBlock legacyLoadCallback = (SDK21RCTSourceLoadBlock)_loadCallback;
      legacyLoadCallback(error, nil, 0);
    } else {
      _loadCallback(error, nil);
    }
    _loadCallback = nil;
  }
}

#pragma mark - JavaScript loading

- (void)_startObservingBridgeNotificationsForBridge:(RCTBridge *)bridge
{
  NSAssert(bridge, @"Must subscribe to loading notifs for a non-null bridge");
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptStartLoadingEvent:)
                                               name:[self versionedString:RCTJavaScriptWillStartLoadingNotification]
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:[self versionedString:RCTJavaScriptDidLoadNotification]
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:[self versionedString:RCTJavaScriptDidFailToLoadNotification]
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleReactContentEvent:)
                                               name:[self versionedString:RCTContentDidAppearNotification]
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleBridgeEvent:)
                                               name:[self versionedString:RCTBridgeWillReloadNotification]
                                             object:bridge];
}

- (void)_stopObservingBridgeNotifications
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self versionedString:RCTJavaScriptWillStartLoadingNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self versionedString:RCTJavaScriptDidLoadNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self versionedString:RCTJavaScriptDidFailToLoadNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self versionedString:RCTContentDidAppearNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self versionedString:RCTBridgeWillReloadNotification] object:_reactBridge];
}

- (void)_handleJavaScriptStartLoadingEvent:(NSNotification *)notification
{
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.delegate reactAppManagerStartedLoadingJavaScript:strongSelf];
    }
  });
}

- (void)_handleJavaScriptLoadEvent:(NSNotification *)notification
{
  if ([notification.name isEqualToString:[self versionedString:RCTJavaScriptDidLoadNotification]]) {
    _isBridgeRunning = YES;
    _hasBridgeEverLoaded = YES;
    [_versionManager bridgeFinishedLoading:_reactBridge];
    [self appStateDidBecomeActive];
    
    // TODO: To be removed once SDK 38 is phased out
    // Above SDK 38 this code is invoked in different place
    if ([self _compareVersionTo:39] == NSOrderedAscending) {
      [self _preSDK39BeginWaitingForAppLoading];
    }
  } else if ([notification.name isEqualToString:[self versionedString:RCTJavaScriptDidFailToLoadNotification]]) {
    NSError *error = (notification.userInfo) ? notification.userInfo[@"error"] : nil;
    [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forExperienceId:_appRecord.experienceId];

    UM_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      UM_ENSURE_STRONGIFY(self);
      [self.delegate reactAppManager:self failedToLoadJavaScriptWithError:error];
    });
  }
}

# pragma mark app loading & splash screen

- (void)_handleReactContentEvent:(NSNotification *)notification
{
  if ([notification.name isEqualToString:[self versionedString:RCTContentDidAppearNotification]]
      && notification.object == self.reactRootView) {
    UM_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      UM_ENSURE_STRONGIFY(self);
      [self.delegate reactAppManagerAppContentDidAppear:self];
      
      if ([self _compareVersionTo:38] == NSOrderedDescending) {
        // Post SDK 38 code
        // Up to SDK 38 this code is invoked in different place
        [self _appLoadingFinished];
      }
    });
  }
}

- (void)_handleBridgeEvent:(NSNotification *)notification
{
  if ([notification.name isEqualToString:[self versionedString:RCTBridgeWillReloadNotification]]) {
    UM_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      UM_ENSURE_STRONGIFY(self);
      [self.delegate reactAppManagerAppContentWillReload:self];
    });
  }
}

/**
 * TODO: Remove once SDK 38 is phased out.
 */
- (void)_preSDK39BeginWaitingForAppLoading
{
  if (_viewTestTimer) {
    [_viewTestTimer invalidate];
    _viewTestTimer = nil;
  }
  
  // SplashScreen.preventAutoHide is called despite actual JS method call.
  // Prior SDK 39, SplashScreen was basing on started & finished flags that are set via legacy Expo.SplashScreen JS methods calls.
  EXSplashScreenService *splashScreenService = (EXSplashScreenService *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXSplashScreenService class]];
  [splashScreenService preventSplashScreenAutoHideFor:(UIViewController *) _appRecord.viewController
                                      successCallback:^(BOOL hasEffect) {}
                                      failureCallback:^(NSString * _Nonnull message) { RCTLogWarn(@"%@", message); }];
  _viewTestTimer = [NSTimer scheduledTimerWithTimeInterval:0.02
                                                    target:self
                                                  selector:@selector(_preSDK39CheckAppFinishedLoading:)
                                                  userInfo:nil
                                                   repeats:YES];
}

/**
 * TODO: Remove once SDK 38 is phased out.
 */
- (id)_preSDK39AppLoadingManagerInstance
{
  Class loadingManagerClass = [self versionedClassFromString:@"EXSplashScreen"];
  for (Class klass in [self.reactBridge moduleClasses]) {
    if ([klass isSubclassOfClass:loadingManagerClass]) {
      return [self.reactBridge moduleForClass:loadingManagerClass];
    }
  }
  return nil;
}

/**
 * TODO: Remove once SDK 38 is phased out.
 */
- (void)_preSDK39CheckAppFinishedLoading:(NSTimer *)timer
{
  // When root view has been filled with something, there are two cases:
  //   1. AppLoading was never mounted, in which case we hide the loading indicator immediately
  //   2. AppLoading was mounted, in which case we wait till it is unmounted to hide the loading indicator
  if ([_appRecord.appManager rootView] &&
      [_appRecord.appManager rootView].subviews.count > 0 &&
      [_appRecord.appManager rootView].subviews.firstObject.subviews.count > 0) {

    // Remove once SDK 38 is phased out.
    id<PreSDK39EXSplashScreenManagerProtocol> splashManager = [self _preSDK39AppLoadingManagerInstance];
    
    // SplashScreen: at this point SplashScreen is prevented from autohiding,
    // so we can safely hide it when the flags set.
    if (!splashManager || !splashManager.started || splashManager.finished) {
      [_viewTestTimer invalidate];
      _viewTestTimer = nil;
      
      EXSplashScreenService *splashScreenService = (EXSplashScreenService *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXSplashScreenService class]];
      [splashScreenService hideSplashScreenFor:(UIViewController *) _appRecord.viewController
                               successCallback:^(BOOL hasEffect) {}
                               failureCallback:^(NSString * _Nonnull message) { RCTLogWarn(@"%@", message); }];
      [self _appLoadingFinished];
    }
  }
}

- (void)_appLoadingFinished
{
  UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    UM_ENSURE_STRONGIFY(self);
    [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceFinishedLoadingWithId:self.appRecord.experienceId];
    [self.delegate reactAppManagerFinishedLoadingJavaScript:self];
  });
}

#pragma mark - dev tools

- (RCTLogFunction)logFunction
{
  return (([self enablesDeveloperTools]) ? EXDeveloperRCTLogFunction : EXDefaultRCTLogFunction);
}

- (RCTLogLevel)logLevel
{
  return ([self enablesDeveloperTools]) ? RCTLogLevelInfo : RCTLogLevelWarning;
}

- (BOOL)enablesDeveloperTools
{
  NSDictionary *manifest = _appRecord.appLoader.manifest;
  if (manifest) {
    NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
    BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
    return (isDeployedFromTool);
  }
  return false;
}

- (BOOL)requiresValidManifests
{
  return YES;
}

- (void)showDevMenu
{
  if ([self enablesDeveloperTools]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self.versionManager showDevMenuForBridge:self.reactBridge];
    });
  }
}

- (void)reloadBridge
{
  if ([self enablesDeveloperTools]) {
    [self.reactBridge reload];
  }
}

- (void)disableRemoteDebugging
{
  if ([self enablesDeveloperTools]) {
    [self.versionManager disableRemoteDebuggingForBridge:self.reactBridge];
  }
}

- (void)toggleElementInspector
{
  if ([self enablesDeveloperTools]) {
    [self.versionManager toggleElementInspectorForBridge:self.reactBridge];
  }
}

- (NSDictionary<NSString *, NSString *> *)devMenuItems
{
  return [self.versionManager devMenuItemsForBridge:self.reactBridge];
}

- (void)selectDevMenuItemWithKey:(NSString *)key
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self.versionManager selectDevMenuItemWithKey:key onBridge:self.reactBridge];
  });
}

#pragma mark - RN configuration

- (NSComparisonResult)_compareVersionTo:(NSUInteger)version
{
  // Unversioned projects are always considered to be on the latest version
  if (!_validatedVersion || _validatedVersion.length == 0 || [_validatedVersion isEqualToString:@"UNVERSIONED"]) {
    return NSOrderedDescending;
  }
  
  NSUInteger projectVersionNumber = _validatedVersion.integerValue;
  if (projectVersionNumber == version) {
    return NSOrderedSame;
  }
  return (projectVersionNumber < version) ? NSOrderedAscending : NSOrderedDescending;
}

- (NSDictionary *)launchOptionsForBridge
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    // pass the native app's launch options to standalone bridge.
    return [ExpoKit sharedInstance].launchOptions;
  }
  return @{};
}

- (Class)moduleRegistryDelegateClass
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return [ExpoKit sharedInstance].moduleRegistryDelegateClass;
  }
  return nil;
}

- (NSString *)applicationKeyForRootView
{
  NSDictionary *manifest = _appRecord.appLoader.manifest;
  if (manifest && manifest[@"appKey"]) {
    return manifest[@"appKey"];
  }
  
  NSURL *bundleUrl = [self bundleUrl];
  if (bundleUrl) {
    NSURLComponents *components = [NSURLComponents componentsWithURL:bundleUrl resolvingAgainstBaseURL:YES];
    NSArray<NSURLQueryItem *> *queryItems = components.queryItems;
    for (NSURLQueryItem *item in queryItems) {
      if ([item.name isEqualToString:@"app"]) {
        return item.value;
      }
    }
  }
  
  return @"main";
}

- (NSDictionary * _Nullable)initialPropertiesForRootView
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  NSMutableDictionary *expProps = [NSMutableDictionary dictionary];

  NSDictionary *errorRecoveryProps = [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager developerInfoForExperienceId:_appRecord.experienceId];
  if ([[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:_appRecord.experienceId]) {
    [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager increaseAutoReloadBuffer];
    if (errorRecoveryProps) {
      expProps[@"errorRecovery"] = errorRecoveryProps;
    }
  }

  expProps[@"shell"] = @(_appRecord == [EXKernel sharedInstance].appRegistry.standaloneAppRecord);
  expProps[@"appOwnership"] = [self _appOwnership];
  if (_initialProps) {
    [expProps addEntriesFromDictionary:_initialProps];
  }
  EXPendingNotification *initialNotification = [[EXKernel sharedInstance].serviceRegistry.notificationsManager initialNotificationForExperience:_appRecord.experienceId];
  if (initialNotification) {
    expProps[@"notification"] = initialNotification.properties;
  }

  expProps[@"manifest"] = _appRecord.appLoader.manifest;
  if (_appRecord.appLoader.manifestUrl) {
    expProps[@"initialUri"] = [_appRecord.appLoader.manifestUrl absoluteString];
  }
  props[@"exp"] = expProps;
  return props;
}

- (NSString *)_appOwnership
{
  if (_appRecord == [EXKernel sharedInstance].appRegistry.standaloneAppRecord) {
    return @"standalone";
  }
  return @"expo";
}

- (NSString *)scopedDocumentDirectory
{
  NSString *escapedExperienceId = [self escapedResourceName:_appRecord.experienceId];
  NSString *mainDocumentDirectory = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  NSString *exponentDocumentDirectory = [mainDocumentDirectory stringByAppendingPathComponent:@"ExponentExperienceData"];
  return [[exponentDocumentDirectory stringByAppendingPathComponent:escapedExperienceId] stringByStandardizingPath];
}

- (NSString *)scopedCachesDirectory
{
  NSString *escapedExperienceId = [self escapedResourceName:_appRecord.experienceId];
  NSString *mainCachesDirectory = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *exponentCachesDirectory = [mainCachesDirectory stringByAppendingPathComponent:@"ExponentExperienceData"];
  return [[exponentCachesDirectory stringByAppendingPathComponent:escapedExperienceId] stringByStandardizingPath];
}

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  __weak __typeof(self) weakSelf = self;
  return std::make_unique<facebook::react::JSCExecutorFactory>([weakSelf, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      strongSelf->_turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                                             delegate:strongSelf.versionManager
                                                                            jsInvoker:bridge.jsCallInvoker];
      [strongSelf->_turboModuleManager installJSBindingWithRuntime:&runtime];
    }
  });
}

@end
