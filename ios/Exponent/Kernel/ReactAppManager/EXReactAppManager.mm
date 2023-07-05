#import "EXApiUtil.h"
#import "EXBuildConstants.h"
#import "EXEnvironment.h"
#import "EXErrorRecoveryManager.h"
#import "EXUserNotificationManager.h"
#import "EXKernel.h"
#import "EXAbstractLoader.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelServiceRegistry.h"
#import "EXKernelUtil.h"
#import "EXLog.h"
#import "ExpoKit.h"
#import "EXReactAppManager.h"
#import "EXReactAppManager+Private.h"
#import "EXVersionManager.h"
#import "EXVersions.h"
#import "EXAppViewController.h"
#import <ExpoModulesCore/EXModuleRegistryProvider.h>
#import <EXConstants/EXConstantsService.h>
#import <EXSplashScreen/EXSplashScreenService.h>

// When `use_frameworks!` is used, the generated Swift header is inside modules.
// Otherwise, it's available only locally with double-quoted imports.
#if __has_include(<EXManifests/EXManifests-Swift.h>)
#import <EXManifests/EXManifests-Swift.h>
#else
#import "EXManifests-Swift.h"
#endif

#import <React/RCTBridge.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/JSCExecutorFactory.h>
#import <React/RCTRootView.h>

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

  // Assert early so we can catch the error before instantiating the bridge, otherwise we would be passing a
  // nullish scope key to the scoped modules.
  // Alternatively we could skip instantiating the scoped modules but then singletons like the one used in
  // expo-updates would be loaded as bare modules. In the case of expo-updates, this would throw a fatal error
  // because Expo.plist is not available in the Expo Go app.
  NSAssert(_appRecord.scopeKey, @"Experience scope key should be nonnull when getting initial properties for root view. This can occur when the manifest JSON, loaded from the server, is missing keys.");


  if ([self isReadyToLoad]) {
    Class versionManagerClass = [self versionedClassFromString:@"EXVersionManager"];
    Class bridgeClass = [self versionedClassFromString:@"RCTBridge"];
    Class rootViewClass = [self versionedClassFromString:@"RCTRootView"];

    _versionManager = [[versionManagerClass alloc] initWithParams:[self extraParams]
                                                         manifest:_appRecord.appLoader.manifest
                                                     fatalHandler:handleFatalReactError
                                                      logFunction:[self logFunction]
                                                     logThreshold:[self logLevel]];
    _reactBridge = [[bridgeClass alloc] initWithDelegate:self launchOptions:[self launchOptionsForBridge]];

    if (!_isHeadless) {
      // We don't want to run the whole JS app if app launches in the background,
      // so we're omitting creation of RCTRootView that triggers runApplication and sets up React view hierarchy.
      _reactRootView = [[rootViewClass alloc] initWithBridge:_reactBridge
                                                  moduleName:[self applicationKeyForRootView]
                                           initialProperties:[self initialPropertiesForRootView]];
    }

    [self setupWebSocketControls];
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
    @"manifest": _appRecord.appLoader.manifest.rawManifestJSON,
    @"constants": @{
        @"linkingUri": RCTNullIfNil([EXKernelLinkingManager linkingUriForExperienceUri:_appRecord.appLoader.manifestUrl useLegacy:[self _compareVersionTo:27] == NSOrderedAscending]),
        @"experienceUrl": RCTNullIfNil(_appRecord.appLoader.manifestUrl? _appRecord.appLoader.manifestUrl.absoluteString: nil),
        @"expoRuntimeVersion": [EXBuildConstants sharedInstance].expoRuntimeVersion,
        @"manifest": _appRecord.appLoader.manifest.rawManifestJSON,
        @"executionEnvironment": [self _executionEnvironment],
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
    @"singletonModules": [EXModuleRegistryProvider singletonModules],
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

#pragma mark - EXAppFetcherDataSource

- (NSString *)bundleResourceNameForAppFetcher:(EXAppFetcher *)appFetcher withManifest:(nonnull EXManifestsManifest *)manifest
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    NSLog(@"Standalone bundle remote url is %@", [EXEnvironment sharedEnvironment].standaloneManifestUrl);
    return kEXEmbeddedBundleResourceName;
  } else {
    return manifest.legacyId;
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
  if (_appRecord.scopeKey) {
    [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:nil forScopeKey:_appRecord.scopeKey];
  }
  [self _stopObservingBridgeNotifications];
  [self _startObservingBridgeNotificationsForBridge:bridge];

  if ([self enablesDeveloperTools]) {
    if ([_appRecord.appLoader supportsBundleReload]) {
      [_appRecord.appLoader forceBundleReload];
    } else {
      NSAssert(_appRecord.scopeKey, @"EXKernelAppRecord.scopeKey should be nonnull if we have a manifest with developer tools enabled");
      [[EXKernel sharedInstance] reloadAppWithScopeKey:_appRecord.scopeKey];
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
    _loadCallback(nil, [[RCTSource alloc] initWithURL:[self bundleUrl] data:data]);
    _loadCallback = nil;
  }
}

- (void)appLoaderFailedWithError:(NSError *)error
{
  // RN is going to call RCTFatal() on this error, so keep a reference to it for later
  // so we can distinguish this non-fatal error from actual fatal cases.
  if (_appRecord.scopeKey) {
    [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forScopeKey:_appRecord.scopeKey];
  }

  // react won't post this for us
  [[NSNotificationCenter defaultCenter] postNotificationName:[self versionedString:RCTJavaScriptDidFailToLoadNotification] object:error];

  if (_loadCallback) {
    _loadCallback(error, nil);
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
  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong __typeof(self) strongSelf = weakSelf;
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

    // TODO: temporary solution for hiding LoadingProgressWindow
    if (_appRecord.viewController) {
      [_appRecord.viewController hideLoadingProgressWindow];
    }
  } else if ([notification.name isEqualToString:[self versionedString:RCTJavaScriptDidFailToLoadNotification]]) {
    NSError *error = (notification.userInfo) ? notification.userInfo[@"error"] : nil;
    if (_appRecord.scopeKey) {
      [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forScopeKey:_appRecord.scopeKey];
    }

    EX_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      EX_ENSURE_STRONGIFY(self);
      [self.delegate reactAppManager:self failedToLoadJavaScriptWithError:error];
    });
  }
}

# pragma mark app loading & splash screen

- (void)_handleReactContentEvent:(NSNotification *)notification
{
  if ([notification.name isEqualToString:[self versionedString:RCTContentDidAppearNotification]]
      && notification.object == self.reactRootView) {
    EX_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      EX_ENSURE_STRONGIFY(self);
      [self.delegate reactAppManagerAppContentDidAppear:self];
      [self _appLoadingFinished];
    });
  }
}

- (void)_handleBridgeEvent:(NSNotification *)notification
{
  if ([notification.name isEqualToString:[self versionedString:RCTBridgeWillReloadNotification]]) {
    EX_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      EX_ENSURE_STRONGIFY(self);
      [self.delegate reactAppManagerAppContentWillReload:self];
    });
  }
}

- (void)_appLoadingFinished
{
  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    if (self.appRecord.scopeKey) {
      [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceFinishedLoadingWithScopeKey:self.appRecord.scopeKey];
    }
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
  EXManifestsManifest *manifest = _appRecord.appLoader.manifest;
  if (manifest) {
    return manifest.isUsingDeveloperTool;
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

- (void)toggleRemoteDebugging
{
  if ([self enablesDeveloperTools]) {
    [self.versionManager toggleRemoteDebuggingForBridge:self.reactBridge];
  }
}

- (void)togglePerformanceMonitor
{
  if ([self enablesDeveloperTools]) {
    [self.versionManager togglePerformanceMonitorForBridge:self.reactBridge];
  }
}

- (void)toggleElementInspector
{
  if ([self enablesDeveloperTools]) {
    [self.versionManager toggleElementInspectorForBridge:self.reactBridge];
  }
}

- (void)reconnectReactDevTools
{
  if ([self enablesDeveloperTools]) {
    // Emit the `RCTDevMenuShown` for the app to reconnect react-devtools
    // https://github.com/facebook/react-native/blob/22ba1e45c52edcc345552339c238c1f5ef6dfc65/Libraries/Core/setUpReactDevTools.js#L80
    [self.reactBridge enqueueJSCall:@"RCTNativeAppEventEmitter.emit" args:@[@"RCTDevMenuShown"]];
  }
}

- (void)toggleDevMenu
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    [[EXKernel sharedInstance].visibleApp.appManager showDevMenu];
  } else {
    [[EXKernel sharedInstance] switchTasks];
  }
}

- (void)setupWebSocketControls
{
  if ([self enablesDeveloperTools]) {
    if ([_versionManager respondsToSelector:@selector(addWebSocketNotificationHandler:queue:forMethod:)]) {
      __weak __typeof(self) weakSelf = self;

      // Attach listeners to the bundler's dev server web socket connection.
      // This enables tools to automatically reload the client remotely (i.e. in expo-cli).

      // Enable a lot of tools under the same command namespace
      [_versionManager addWebSocketNotificationHandler:^(id params) {
        if (params != [NSNull null] && (NSDictionary *)params) {
          NSDictionary *_params = (NSDictionary *)params;
          if (_params[@"name"] != nil && (NSString *)_params[@"name"]) {
            NSString *name = _params[@"name"];
            if ([name isEqualToString:@"reload"]) {
              [[EXKernel sharedInstance] reloadVisibleApp];
            } else if ([name isEqualToString:@"toggleDevMenu"]) {
              [weakSelf toggleDevMenu];
            } else if ([name isEqualToString:@"toggleRemoteDebugging"]) {
              [weakSelf toggleRemoteDebugging];
            } else if ([name isEqualToString:@"toggleElementInspector"]) {
              [weakSelf toggleElementInspector];
            } else if ([name isEqualToString:@"togglePerformanceMonitor"]) {
              [weakSelf togglePerformanceMonitor];
            } else if ([name isEqualToString:@"reconnectReactDevTools"]) {
              [weakSelf reconnectReactDevTools];
            }
          }
        }
      }
                                                 queue:dispatch_get_main_queue()
                                             forMethod:@"sendDevCommand"];

      // These (reload and devMenu) are here to match RN dev tooling.

      // Reload the app on "reload"
      [_versionManager addWebSocketNotificationHandler:^(id params) {
        [[EXKernel sharedInstance] reloadVisibleApp];
      }
                                                 queue:dispatch_get_main_queue()
                                             forMethod:@"reload"];

      // Open the dev menu on "devMenu"
      [_versionManager addWebSocketNotificationHandler:^(id params) {
        [weakSelf toggleDevMenu];
      }
                                                 queue:dispatch_get_main_queue()
                                             forMethod:@"devMenu"];
    }
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
  EXManifestsManifest *manifest = _appRecord.appLoader.manifest;
  if (manifest && manifest.appKey) {
    return manifest.appKey;
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

  NSAssert(_appRecord.scopeKey, @"Experience scope key should be nonnull when getting initial properties for root view");

  NSDictionary *errorRecoveryProps = [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager developerInfoForScopeKey:_appRecord.scopeKey];
  if ([[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager scopeKeyIsRecoveringFromError:_appRecord.scopeKey]) {
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
  EXPendingNotification *initialNotification = [[EXKernel sharedInstance].serviceRegistry.notificationsManager initialNotification];
  if (initialNotification) {
    expProps[@"notification"] = initialNotification.properties;
  }

  NSString *manifestString = nil;
  EXManifestsManifest *manifest = _appRecord.appLoader.manifest;
  if (manifest && [NSJSONSerialization isValidJSONObject:manifest.rawManifestJSON]) {
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:manifest.rawManifestJSON options:0 error:&error];
    if (jsonData) {
      manifestString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    } else {
      DDLogWarn(@"Failed to serialize JSON manifest: %@", error);
    }
  }

  expProps[@"manifestString"] = manifestString;
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

- (NSString *)_executionEnvironment
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return EXConstantsExecutionEnvironmentStandalone;
  } else {
    return EXConstantsExecutionEnvironmentStoreClient;
  }
}

- (NSString *)scopedDocumentDirectory
{
  NSString *escapedScopeKey = [self escapedResourceName:_appRecord.scopeKey];
  NSString *mainDocumentDirectory = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  NSString *exponentDocumentDirectory = [mainDocumentDirectory stringByAppendingPathComponent:@"ExponentExperienceData"];
  return [[exponentDocumentDirectory stringByAppendingPathComponent:escapedScopeKey] stringByStandardizingPath];
}

- (NSString *)scopedCachesDirectory
{
  NSString *escapedScopeKey = [self escapedResourceName:_appRecord.scopeKey];
  NSString *mainCachesDirectory = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *exponentCachesDirectory = [mainCachesDirectory stringByAppendingPathComponent:@"ExponentExperienceData"];
  return [[exponentCachesDirectory stringByAppendingPathComponent:escapedScopeKey] stringByStandardizingPath];
}

- (void *)jsExecutorFactoryForBridge:(id)bridge
{
  return [_versionManager versionedJsExecutorFactoryForBridge:bridge];
}

@end
