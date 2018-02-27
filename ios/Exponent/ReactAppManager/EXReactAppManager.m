
#import "EXReactAppManager.h"
#import "EXReactAppManager+Private.h"
#import "EXBuildConstants.h"
#import "EXErrorRecoveryManager.h"
#import "EXFatalHandler.h"
#import "EXKernel.h"
#import "EXKernelAppLoader.h"
#import "EXKernelDevKeyCommands.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelServiceRegistry.h"
#import "EXKernelUtil.h"
#import "EXLog.h"
#import "EXShellManager.h"
#import "EXVersionManager.h"
#import "EXVersions.h"

#import <React/RCTBridge.h>
#import <React/RCTRootView.h>

typedef void (^SDK21RCTSourceLoadBlock)(NSError *error, NSData *source, int64_t sourceLength);

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

@interface EXReactAppManager () <RCTBridgeDelegate>

@property (nonatomic, strong) UIView * __nullable reactRootView;
@property (nonatomic, copy) RCTSourceLoadBlock loadCallback;

@end

@implementation EXReactAppManager

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record
{
  if (self = [super init]) {
    _appRecord = record;
  }
  return self;
}

- (EXReactAppManagerStatus)status
{
  if (!_appRecord ||
      [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:_appRecord.experienceId]) {
    return kEXReactAppManagerStatusError;
  }
  if (_isBridgeRunning) {
    return kEXReactAppManagerStatusRunning;
  }
  if (_loadCallback) {
    // we have a RCTBridge load callback so we're ready to receive load events
    return kEXReactAppManagerStatusBridgeLoading;
  }
  return kEXReactAppManagerStatusNew;
}

- (UIView *)rootView
{
  return _reactRootView;
}

- (void)reload
{
  EXAssertMainThread();
  // TODO: BEN NSAssert((_delegate != nil), @"Cannot init react app without EXReactAppManagerDelegate");
  [self _invalidateAndClearDelegate:NO];
  [self computeVersionSymbolPrefix];
  
  if ([self isReadyToLoad]) {
    Class versionManagerClass = [self versionedClassFromString:@"EXVersionManager"];
    Class bridgeClass = [self versionedClassFromString:@"RCTBridge"];
    Class rootViewClass = [self versionedClassFromString:@"RCTRootView"];
    
    _versionManager = [[versionManagerClass alloc]
                       initWithFatalHandler:handleFatalReactError
                       logFunction:[self logFunction]
                       logThreshold:[self logLevel]
                       ];
    _reactBridge = [[bridgeClass alloc] initWithDelegate:self launchOptions:[self launchOptionsForBridge]];
    _reactRootView = [[rootViewClass alloc] initWithBridge:_reactBridge
                                                moduleName:[self applicationKeyForRootView]
                                         initialProperties:[self initialPropertiesForRootView]];
    
    [_delegate reactAppManagerIsReadyForDisplay:self];
    
    NSAssert([_reactBridge isLoading], @"React bridge should be loading once initialized");
    [self _startObservingBridgeNotifications];
    [_versionManager bridgeWillStartLoading:_reactBridge];
  }
}

- (void)_invalidateAndClearDelegate:(BOOL)clearDelegate
{
  [self _stopObservingBridgeNotifications];
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
  // TODO: kernel checks detached versions here
  _validatedVersion = [[EXVersions sharedInstance] availableSdkVersionForManifest:_appRecord.appLoader.manifest];
  _versionSymbolPrefix = [[EXVersions sharedInstance] symbolPrefixForSdkVersion:self.validatedVersion isKernel:NO];
}

- (Class)versionedClassFromString: (NSString *)classString
{
  return NSClassFromString([self versionedString:classString]);
}

- (NSString *)versionedString: (NSString *)string
{
  return [EXVersions versionedString:string withPrefix:_versionSymbolPrefix];
}

// TODO: move to delegate?
- (RCTLogFunction)logFunction
{
  return (([self _doesManifestEnableDeveloperTools]) ? EXDeveloperRCTLogFunction : EXDefaultRCTLogFunction);
}

// TODO: move to delegate?
- (RCTLogLevel)logLevel
{
  return ([self _doesManifestEnableDeveloperTools]) ? RCTLogLevelInfo : RCTLogLevelWarning;
}

- (BOOL)isReadyToLoad
{
  if (_appRecord) {
    // TODO: BEN: outside dev mode, this should only check for manifest
    // and then wire up loading callbacks.
    return (_appRecord.appLoader.status == kEXKernelAppLoaderStatusHasManifestAndBundle);
  }
  return NO;
}

- (NSURL *)bundleUrl
{
  return [NSURL URLWithString:[_appRecord.appLoader.manifest objectForKey:@"bundleUrl"]];
}

- (void)_invalidateVersionState
{
  _versionSymbolPrefix = @"";
  _validatedVersion = nil;
}

- (BOOL)_doesManifestEnableDeveloperTools
{
  NSDictionary *manifest = _appRecord.appLoader.manifest;
  if (manifest) {
    NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
    BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
    return (isDeployedFromTool);
  }
  return false;
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
  
  _loadCallback = loadCallback;
  if (_appRecord.appLoader.status == kEXKernelAppLoaderStatusHasManifestAndBundle) {
    // finish loading immediately (app loader won't call this late)
    [self appLoader:_appRecord.appLoader didFinishLoadingBundle:_appRecord.appLoader.bundle];
  } else {
    // TODO: mark self as ready to receive loading events
  }
}

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  // we allow the vanilla RN dev menu in some circumstances.
  BOOL isDetached = [EXShellManager sharedInstance].isDetached;
  BOOL isStandardDevMenuAllowed = [EXKernelDevKeyCommands sharedInstance].isLegacyMenuBehaviorEnabled || isDetached;
  
  // TODO: used to provide `frame` here
  NSDictionary *params = @{
                           @"manifest": _appRecord.appLoader.manifest,
                           @"constants": @{
                               @"linkingUri": [EXKernelLinkingManager linkingUriForExperienceUri:_appRecord.appLoader.manifestUrl], // TODO: _frame.initialUri
                               @"deviceId": [EXKernel deviceInstallUUID],
                               @"expoRuntimeVersion": [EXBuildConstants sharedInstance].expoRuntimeVersion,
                               @"manifest": _appRecord.appLoader.manifest,
                               @"appOwnership": @"expo", // TODO: BEN (used to derive from frame initial props)
                               },
                           @"initialUri": [EXKernelLinkingManager uriTransformedForLinking:_appRecord.appLoader.manifestUrl isUniversalLink:NO], // TODO: _frame.initialUri
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
  /* TODO: pass to view controller?
   if (self.delegate) {
    [self.delegate reactAppManager:self loadedJavaScriptWithProgress:progress];
  } */
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didFinishLoadingBundle:(NSData *)data
{
  if (_loadCallback) {
    if ([self compareVersionTo:22] == NSOrderedAscending) {
      SDK21RCTSourceLoadBlock legacyLoadCallback = (SDK21RCTSourceLoadBlock)_loadCallback;
      legacyLoadCallback(nil, data, data.length);
    } else {
      _loadCallback(nil, [[RCTSource alloc] initWithURL:[self bundleUrl] data:data]);
    }
  }
}

- (void)appLoader:(EXKernelAppLoader *)appLoader didFailLoadingBundleWithError:(NSError *)error
{
  // TODO: delegate [self.delegate reactAppManager:self failedToDownloadBundleWithError:error];
  
  // RN is going to call RCTFatal() on this error, so keep a reference to it for later
  // so we can distinguish this non-fatal error from actual fatal cases.
  [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forExperienceId:_appRecord.experienceId];
  
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

#pragma mark - JavaScript loading

- (void)_startObservingBridgeNotifications
{
  NSAssert(_reactBridge, @"Must subscribe to loading notifs for a non-null bridge");
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptStartLoadingEvent:)
                                               name:[self versionedString:RCTJavaScriptWillStartLoadingNotification]
                                             object:_reactBridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:[self versionedString:RCTJavaScriptDidLoadNotification]
                                             object:_reactBridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:[self versionedString:RCTJavaScriptDidFailToLoadNotification]
                                             object:_reactBridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleBridgeForegroundEvent:)
                                               name:kEXKernelBridgeDidForegroundNotification
                                             object:_reactBridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleBridgeBackgroundEvent:)
                                               name:kEXKernelBridgeDidBackgroundNotification
                                             object:_reactBridge];
}

- (void)_stopObservingBridgeNotifications
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self versionedString:RCTJavaScriptWillStartLoadingNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self versionedString:RCTJavaScriptDidLoadNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self versionedString:RCTJavaScriptDidFailToLoadNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:kEXKernelBridgeDidForegroundNotification object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:kEXKernelBridgeDidBackgroundNotification object:_reactBridge];
}

- (void)_handleJavaScriptStartLoadingEvent:(NSNotification *)notification
{
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      // TODO: how do we want to delegate? [strongSelf.delegate reactAppManagerStartedLoadingJavaScript:strongSelf];
    }
  });
}

- (void)_handleJavaScriptLoadEvent:(NSNotification *)notification
{
  __weak typeof(self) weakSelf = self;
  if ([notification.name isEqualToString:[self versionedString:RCTJavaScriptDidLoadNotification]]) {
    [_versionManager bridgeFinishedLoading];
    [self _handleBridgeForegroundEvent:nil];
    _isBridgeRunning = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceFinishedLoadingWithId:strongSelf.appRecord.experienceId];
        // TODO: delegate [strongSelf.delegate reactAppManagerFinishedLoadingJavaScript:strongSelf];
      }
    });
  } else if ([notification.name isEqualToString:[self versionedString:RCTJavaScriptDidFailToLoadNotification]]) {
    NSError *error = (notification.userInfo) ? notification.userInfo[@"error"] : nil;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        // TODO: delegate [strongSelf.delegate reactAppManager:strongSelf failedToLoadJavaScriptWithError:error];
      }
    });
  }
}

- (NSComparisonResult)compareVersionTo:(NSUInteger)version
{
  // Unversioned projects are always considered to be on the latest version
  if (!_validatedVersion || _validatedVersion.length == 0) {
    return NSOrderedDescending;
  }
  
  NSUInteger projectVersionNumber = _validatedVersion.integerValue;
  if (projectVersionNumber == version) {
    return NSOrderedSame;
  }
  return (projectVersionNumber < version) ? NSOrderedAscending : NSOrderedDescending;
}

#pragma mark - TODO: BEN

- (void)_handleBridgeForegroundEvent:(NSNotification * _Nullable)notification
{
  /* TODO: delegate if ([_delegate respondsToSelector:@selector(reactAppManagerDidForeground:)]) {
   [_delegate reactAppManagerDidForeground:self];
   } */
  [_versionManager bridgeDidForeground];
}

- (void)_handleBridgeBackgroundEvent:(NSNotification *)notification
{
  /* TODO: delegate if ([_delegate respondsToSelector:@selector(reactAppManagerDidBackground:)]) {
   [_delegate reactAppManagerDidBackground:self];
   } */
  [_versionManager bridgeDidBackground];
}

- (void)showDevMenu
{
  if ([self _doesManifestEnableDeveloperTools]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self.versionManager showDevMenuForBridge:self.reactBridge];
    });
  }
}

- (void)reloadBridge
{
  if ([self _doesManifestEnableDeveloperTools]) {
    [self.reactBridge reload];
  }
}

- (void)disableRemoteDebugging
{
  if ([self _doesManifestEnableDeveloperTools]) {
    [self.versionManager disableRemoteDebuggingForBridge:self.reactBridge];
  }
}

- (void)toggleElementInspector
{
  if ([self _doesManifestEnableDeveloperTools]) {
    [self.versionManager toggleElementInspectorForBridge:self.reactBridge];
  }
}

// TODO: menu: reimpl native
- (NSDictionary<NSString *, NSString *> *)devMenuItems
{
  return [self.versionManager devMenuItemsForBridge:self.reactBridge];
}

// TODO: menu: reimpl native
- (void)selectDevMenuItemWithKey:(NSString *)key
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self.versionManager selectDevMenuItemWithKey:key onBridge:self.reactBridge];
  });
}

// TODO: remove?
- (NSDictionary *)launchOptionsForBridge
{
  return @{};
}

// TODO: remove?
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

// TODO: simplify
- (NSDictionary * _Nullable)initialPropertiesForRootView
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  NSMutableDictionary *expProps = [NSMutableDictionary dictionary];
  
  NSDictionary *errorRecoveryProps = [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager developerInfoForExperienceId:_appRecord.experienceId];
  if (errorRecoveryProps && [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceIdIsRecoveringFromError:_appRecord.experienceId]) {
    expProps[@"errorRecovery"] = errorRecoveryProps;
    [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager increaseAutoReloadBuffer];
  }
  
  props[@"exp"] = expProps;
  
  return props;
}

/**
 TODO: BEN: here's all the old things that could be overridden
 #pragma mark - abstract stubs
 
 #define EX_APP_MANAGER_ABSTRACT(method) \
 method \
 { \
 @throw [NSException exceptionWithName:NSInternalInconsistencyException \
 reason:[NSString stringWithFormat:@"Do not call %@ directly, use a subclass", NSStringFromSelector(_cmd)] \
 userInfo:nil]; \
 }
 
 EX_APP_MANAGER_ABSTRACT(- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge)
 EX_APP_MANAGER_ABSTRACT(- (BOOL)isReadyToLoad)
 EX_APP_MANAGER_ABSTRACT(- (NSString *)bundleNameForJSResource)
 EX_APP_MANAGER_ABSTRACT(- (EXCachedResourceBehavior)cacheBehaviorForJSResource)
 EX_APP_MANAGER_ABSTRACT(- (BOOL)shouldInvalidateJSResourceCache)
 EX_APP_MANAGER_ABSTRACT(- (NSDictionary * _Nullable)launchOptionsForBridge)
 EX_APP_MANAGER_ABSTRACT(- (NSDictionary * _Nullable)initialPropertiesForRootView)
 EX_APP_MANAGER_ABSTRACT(- (void)registerBridge)
 EX_APP_MANAGER_ABSTRACT(- (void)unregisterBridge)
 EX_APP_MANAGER_ABSTRACT(- (NSString *)experienceId)
 EX_APP_MANAGER_ABSTRACT(- (void)experienceFinishedLoading)
 */

/* TODO: ben: here is the old load source method

- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback
{
  // clear any potentially old loading state
  [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:nil forExperienceId:self.experienceId];
  
  NSURL *bundleUrl = bridge.bundleURL;
  _jsResource = [[EXJavaScriptResource alloc] initWithBundleName:[self bundleNameForJSResource]
                                                       remoteUrl:bundleUrl
                                                 devToolsEnabled:[self areDevtoolsEnabled]];
  _jsResource.abiVersion = _validatedVersion;
  
  __weak typeof(self) weakSelf = self;
  EXCachedResourceBehavior cacheBehavior = [self cacheBehaviorForJSResource];
  if (cacheBehavior == EXCachedResourceNoCache) {
    // no cache - wait longer before timing out
    _jsResource.requestTimeoutInterval = kEXJavaScriptResourceLongerTimeout;
  }
  if ([self shouldInvalidateJSResourceCache]) {
    [_jsResource removeCache];
  }
  [_jsResource loadResourceWithBehavior:cacheBehavior progressBlock:^(EXLoadingProgress * _Nonnull progress) {
    __strong typeof(self) strongSelf = weakSelf;
    __strong id<EXReactAppManagerDelegate> delegate = weakSelf.delegate;
    if (strongSelf && delegate) {
      [strongSelf.delegate reactAppManager:strongSelf loadedJavaScriptWithProgress:progress];
    }
  } successBlock:^(NSData * _Nonnull sourceData) {
    if ([self compareVersionTo:22] == NSOrderedAscending) {
      SDK21RCTSourceLoadBlock legacyLoadCallback = (SDK21RCTSourceLoadBlock)loadCallback;
      legacyLoadCallback(nil, sourceData, sourceData.length);
    } else {
      loadCallback(nil, [[RCTSource alloc] initWithURL:bundleUrl data:sourceData]);
    }
  } errorBlock:^(NSError * _Nonnull error) {
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.delegate reactAppManager:strongSelf failedToDownloadBundleWithError:error];
      
      // RN is going to call RCTFatal() on this error, so keep a reference to it for later
      // so we can distinguish this non-fatal error from actual fatal cases.
      [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forExperienceId:strongSelf.experienceId];
      
      // react won't post this for us
      [[NSNotificationCenter defaultCenter] postNotificationName:[strongSelf versionedString:RCTJavaScriptDidFailToLoadNotification] object:error];
    }
    
    if ([self compareVersionTo:22] == NSOrderedAscending) {
      SDK21RCTSourceLoadBlock legacyLoadCallback = (SDK21RCTSourceLoadBlock)loadCallback;
      legacyLoadCallback(error, nil, 0);
    } else {
      loadCallback(error, nil);
    }
  }];
} */

/*
#pragma mark - Unversioned utilities for EXFrame from EXFrameReactAppManager

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
} */

@end
