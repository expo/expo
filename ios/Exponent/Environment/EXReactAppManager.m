// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXDevMenuViewController.h"
#import "EXExceptionHandler.h"
#import "EXFatalHandler.h"
#import "EXFrame.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXKernelModuleProvider.h"
#import "EXLog.h"
#import "EXReactAppManager.h"
#import "EXReactAppManagerUtils.h"
#import "EXShellManager.h"
#import "EXVersionManager.h"

#import "RCTBridge.h"
#import "RCTDevLoadingView.h"
#import "RCTRootView.h"

@interface EXReactAppManager ()

@property (nonatomic, strong) EXReactAppManagerUtils *utils;
@property (nonatomic, weak) EXFrame *frame;
@property (nonatomic, assign) BOOL isKernel;
@property (nonnull, strong) EXJavaScriptResource *jsResource;

// versioned
@property (nonatomic, strong) id versionManager;

@end

@implementation EXReactAppManager

- (instancetype)initWithFrame:(EXFrame *)frame isKernel:(BOOL)isKernel launchOptions:(NSDictionary *)launchOptions
{
  if (self = [super init]) {
    _frame = frame;
    _isKernel = isKernel;
    _launchOptions = launchOptions;
  }
  return self;
}

- (void)reload
{
  EXAssertMainThread();
  NSAssert((_delegate != nil), @"Cannot init react app without EXReactAppManagerDelegate");
  [self invalidate];
  [RCTDevLoadingView setEnabled:NO];
  _utils = [[EXReactAppManagerUtils alloc] initWithFrame:_frame isKernel:_isKernel];
  
  if ([_delegate isReadyToLoad]) {
    RCTLogFunction logFunction;
    if (_isKernel) {
      logFunction = EXGetKernelRCTLogFunction();
    } else {
      logFunction = (([_utils doesManifestEnableDeveloperTools]) ? EXDeveloperRCTLogFunction : EXDefaultRCTLogFunction);
    }
    
    Class versionManagerClass = [_utils versionedClassFromString:@"EXVersionManager"];
    Class bridgeClass = [_utils versionedClassFromString:@"RCTBridge"];
    Class rootViewClass = [_utils versionedClassFromString:@"RCTRootView"];
    
    BOOL isDeveloper = [_utils doesManifestEnableDeveloperTools];
    _versionManager = [[versionManagerClass alloc]
                       initWithFatalHandler:handleFatalReactError
                       logFunction:logFunction
                       logThreshold:(isDeveloper || _isKernel) ? RCTLogLevelInfo : RCTLogLevelWarning
                       ];
    _reactBridge = [[bridgeClass alloc] initWithDelegate:self launchOptions:_launchOptions];
    _reactRootView = [[rootViewClass alloc] initWithBridge:_reactBridge
                                                moduleName:[_utils computedApplicationKey]
                                         initialProperties:[_utils initialProperties]];

    [_delegate reactAppManagerDidInitApp:self];
    
    NSAssert([_reactBridge isLoading], @"React bridge should be loading once initialized");
    if (_isKernel) {
      [[EXKernel sharedInstance].bridgeRegistry registerKernelBridge:_reactBridge];
    } else {
      [[EXKernel sharedInstance].bridgeRegistry registerBridge:_reactBridge
                                               forExperienceId:_frame.manifest[@"id"]
                                                         frame:_frame];
    }
    [self _startObservingBridgeNotifications];
    [_versionManager bridgeWillStartLoading:_reactBridge];
  }
}

- (void)invalidate
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
    [[EXKernel sharedInstance].bridgeRegistry setError:nil forBridge:_reactBridge];
    if (_isKernel) {
      [[EXKernel sharedInstance].bridgeRegistry unregisterKernelBridge];
    } else {
      [[EXKernel sharedInstance].bridgeRegistry unregisterBridge:_reactBridge];
    }
    [_reactBridge invalidate];
    _reactBridge = nil;
    if (_delegate) {
      [_delegate reactAppManagerDidDestroyApp:self];
    }
  }
  _utils = nil;
  _jsResource = nil;
}


#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  NSAssert((_delegate != nil), @"Cannot init react app without EXReactAppManagerDelegate");
  return [_delegate bundleUrl];
}

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  if (_isKernel) {
    // TODO: pass this into versionManager
    static NSString * const EXExceptionHandlerKey = @"EXExceptionHandler";
    EXExceptionHandler *exceptionHandler = [[EXExceptionHandler alloc] initWithBridge:bridge];
    RCTExceptionsManager *exceptionsManager = [[RCTExceptionsManager alloc] initWithDelegate:exceptionHandler];
    objc_setAssociatedObject(exceptionsManager, &EXExceptionHandlerKey, exceptionHandler, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    
    NSMutableArray *modules = [EXKernelModuleProvider(_launchOptions) mutableCopy];
    [modules addObject:exceptionsManager];
    
    return modules;
  } else {
    NSDictionary *params = @{
                             @"frame": self,
                             @"manifest": _frame.manifest,
                             @"constants": @{
                                 @"linkingUri": [EXKernel linkingUriForExperienceUri:_frame.initialUri],
                                 @"deviceId": [EXKernel deviceInstallUUID],
                                 @"manifest": _frame.manifest,
                                 @"appOwnership": [_frame.initialProps objectForKey:@"appOwnership"] ?: @"exponent",
                                 },
                             @"initialUri": _frame.initialUri,
                             @"isDeveloper": @([_utils doesManifestEnableDeveloperTools]),
                             };
    return [_versionManager extraModulesWithParams:params];
  }
}

- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback
{
  // clear any potentially old loading state
  if (!_isKernel) {
    [[EXKernel sharedInstance].bridgeRegistry setError:nil forBridge:_reactBridge];
  }
  
  NSString *bundleName;
  if (_isKernel) {
    bundleName = kEXKernelBundleResourceName;
  } else {
    if (_frame.initialProps && [_frame.initialProps[@"shell"] boolValue]) {
      bundleName = kEXShellBundleResourceName;
      NSLog(@"EXFrame: Standalone bundle remote url is %@", bridge.bundleURL);
    } else {
      bundleName = _frame.manifest[@"id"];
    }
  }
  _jsResource = [[EXJavaScriptResource alloc] initWithBundleName:bundleName remoteUrl:bridge.bundleURL];
  _jsResource.abiVersion = _utils.validatedVersion;
  
  // TODO: pass cache behavior unto utils
  EXCachedResourceBehavior cacheBehavior;
  if (_isKernel) {
    cacheBehavior = [[NSUserDefaults standardUserDefaults] boolForKey:kEXSkipCacheUserDefaultsKey] ?
      kEXCachedResourceNoCache :
      kEXCachedResourceUseCacheImmediately;
  } else {
    cacheBehavior = ([_utils doesManifestEnableDeveloperTools]) ? kEXCachedResourceNoCache : kEXCachedResourceFallBackToCache;
  }
  
  [_jsResource loadResourceWithBehavior:cacheBehavior successBlock:^(NSData * _Nonnull sourceData) {
    loadCallback(nil, sourceData, sourceData.length);
  } errorBlock:^(NSError * _Nonnull error) {
    [_delegate reactAppManager:self failedToDownloadBundleWithError:error];

    // RN is going to call RCTFatal() on this error, so keep a reference to it for later
    // so we can distinguish this non-fatal error from actual fatal cases.
    [[EXKernel sharedInstance].bridgeRegistry setError:error forBridge:_reactBridge];
    
    // react won't post this for us
    [[NSNotificationCenter defaultCenter] postNotificationName:[_utils versionedString:RCTJavaScriptDidFailToLoadNotification] object:error];
    loadCallback(error, nil, 0);
  }];
}

#pragma mark - JavaScript loading

- (void)_startObservingBridgeNotifications
{
  NSAssert(_reactBridge, @"Must subscribe to loading notifs for a non-null bridge");
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptStartLoadingEvent:)
                                               name:[_utils versionedString:RCTJavaScriptWillStartLoadingNotification]
                                             object:_reactBridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:[_utils versionedString:RCTJavaScriptDidLoadNotification]
                                             object:_reactBridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:[_utils versionedString:RCTJavaScriptDidFailToLoadNotification]
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
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[_utils versionedString:RCTJavaScriptWillStartLoadingNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[_utils versionedString:RCTJavaScriptDidLoadNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[_utils versionedString:RCTJavaScriptDidFailToLoadNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:kEXKernelBridgeDidForegroundNotification object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:kEXKernelBridgeDidBackgroundNotification object:_reactBridge];
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
  __weak typeof(self) weakSelf = self;
  if ([notification.name isEqualToString:[_utils versionedString:RCTJavaScriptDidLoadNotification]]) {
    [_versionManager bridgeFinishedLoading];
    [self _handleBridgeForegroundEvent:nil];
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        [strongSelf.delegate reactAppManagerFinishedLoadingJavaScript:strongSelf];
      }
    });
  } else if ([notification.name isEqualToString:[_utils versionedString:RCTJavaScriptDidFailToLoadNotification]]) {
    NSError *error = (notification.userInfo) ? notification.userInfo[@"error"] : nil;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        [strongSelf.delegate reactAppManager:strongSelf failedToLoadJavaScriptWithError:error];
      }
    });
  }
}

- (void)_handleBridgeForegroundEvent:(NSNotification * _Nullable)notification
{
  if ([_delegate respondsToSelector:@selector(reactAppManagerDidForeground:)]) {
    [_delegate reactAppManagerDidForeground:self];
  }
  [_versionManager bridgeDidForeground];
}

- (void)_handleBridgeBackgroundEvent:(NSNotification *)notification
{
  if ([_delegate respondsToSelector:@selector(reactAppManagerDidBackground:)]) {
    [_delegate reactAppManagerDidBackground:self];
  }
  [_versionManager bridgeDidBackground];
}


@end
