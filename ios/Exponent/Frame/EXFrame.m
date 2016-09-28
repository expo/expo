// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFrame.h"

#import "EXAppDelegate.h"
#import "EXAnalytics.h"
#import "EXFatalHandler.h"
#import "EXFrameExceptionsManager.h"
#import "EXFrameUtils.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXKernelBridgeRecord.h"
#import "EXLog.h"
#import "EXAppLoadingManager.h"
#import "EXVersionManager.h"
#import "EXShellManager.h"

#import "RCTBridge.h"
#import "RCTRootView.h"
#import "UIView+React.h"

#define EX_FRAME_RELOAD_DEBOUNCE_SEC 0.05

NS_ASSUME_NONNULL_BEGIN

@interface EXFrame () <RCTInvalidating, RCTBridgeDelegate, RCTExceptionsManagerDelegate>
{
  // unversioned-- belongs to the bridge that owns the EXFrame
  RCTEventDispatcher *_eventDispatcher;
}

@property (nonatomic, strong) EXFrameUtils *utils;

@property (nonatomic, assign) BOOL valid;
@property (nonatomic, assign) BOOL sourceSet;
@property (nonatomic, assign) BOOL needsReload;
@property (nonnull, strong) EXJavaScriptResource *jsResource;

@property (nonatomic, copy) RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) RCTDirectEventBlock onError;

@property (nonatomic, strong) NSTimer *viewTestTimer;

// versioned
@property (nonatomic, strong) UIView * __nullable reactRootView;
@property (nonatomic, strong) id versionManager;
@property (nonatomic, strong) id reactBridge;
@property (nonatomic, strong) NSTimer *tmrReload;

@end

@implementation EXFrame

RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)coder)

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  _eventDispatcher = eventDispatcher;
  _valid = YES;
  return [super initWithFrame:CGRectZero];
}

- (void)dealloc
{
  if (_valid) {
    [self invalidate];
  }
}

#pragma mark - Invalidation

- (void)invalidate
{
  if (_reactRootView) {
    [self _removeReactRootView];
  }
  if (_tmrReload) {
    [_tmrReload invalidate];
    _tmrReload = nil;
  }
  if (_viewTestTimer) {
    [_viewTestTimer invalidate];
    _viewTestTimer = nil;
  }
  _valid = NO;
  
  _sourceSet = NO;
  _needsReload = NO;
  _utils = nil;
  _jsResource = nil;
}

#pragma mark - Setting Properties

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  NSSet <NSString *> *changedPropsSet = [NSSet setWithArray:changedProps];
  NSSet <NSString *> *propsForReload = [NSSet setWithArray:@[
    @"initialUri", @"manifest", @"source", @"applicationKey", @"debuggerHostname", @"debuggerPort",
  ]];
  if ([changedPropsSet intersectsSet:propsForReload]) {
    if ([self validateProps:changedProps]) {
      _needsReload = YES;
      [self performSelectorOnMainThread:@selector(_checkForReload) withObject:nil waitUntilDone:YES];
    } else {
      if (_tmrReload) {
        [_tmrReload invalidate];
        _tmrReload = nil;
      }
    }
  }
}

- (BOOL)validateProps:(NSArray<NSString *> *)changedProps
{
  BOOL isValid = YES;
  if ([changedProps containsObject:@"manifest"]) {
    if (!_manifest || ![_manifest objectForKey:@"id"]) {
      // we can't load an experience with no id
      NSDictionary *errorInfo = @{
                                  NSLocalizedDescriptionKey: @"Cannot open an experience with no id",
                                  NSLocalizedFailureReasonErrorKey: @"Tried to load a manifest with no experience id, or a null manifest",
                                  };
      [self _sendLoadingError:[NSError errorWithDomain:kEXKernelErrorDomain code:-1 userInfo:errorInfo]];
      isValid = NO;
    }
  }
  if ([changedProps containsObject:@"source"]) {
    // Performed in additon to JS-side validation because RN iOS websockets will crash without a port.
    _source = [EXFrameUtils ensureUrlHasPort:_source];
    if (_source) {
      _sourceSet = YES;
    } else {
      // we had issues with this bundle url
      NSDictionary *errorInfo = @{
                                  NSLocalizedDescriptionKey: @"Cannot open the given bundle url",
                                  NSLocalizedFailureReasonErrorKey: [NSString stringWithFormat:@"Cannot parse bundle url %@", [_source absoluteString]],
                                  };
      [self _sendLoadingError:[NSError errorWithDomain:kEXKernelErrorDomain code:-1 userInfo:errorInfo]];
      isValid = NO;
    }
  }
  return isValid;
}

- (void)reload
{
  if ([self validateProps:@[ @"manifest", @"source" ]]) {
    [[EXAnalytics sharedInstance] logEvent:@"RELOAD_EXPERIENCE" manifestUrl:_source eventProperties:nil];
    [self _reloadContent];
  }
}

- (void)_checkForReload
{
  EXAssertMainThread();
  if (_needsReload) {
    if (_sourceSet && _source) {
      [[EXAnalytics sharedInstance] logEvent:@"LOAD_EXPERIENCE" manifestUrl:_source eventProperties:nil];
    }
    _sourceSet = NO;
    _needsReload = NO;
    
    if (_tmrReload) {
      [_tmrReload invalidate];
      _tmrReload = nil;
    }
    _tmrReload = [NSTimer scheduledTimerWithTimeInterval:EX_FRAME_RELOAD_DEBOUNCE_SEC target:self selector:@selector(_reloadContent) userInfo:nil repeats:NO];
  }
}

#pragma mark - Layout

- (void)layoutSubviews
{
  [super layoutSubviews];
  _reactRootView.frame = self.bounds;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  if (_manifest) {
    NSString *orientationConfig = _manifest[@"orientation"];
    if ([orientationConfig isEqualToString:@"portrait"]) {
      // lock to portrait
      return UIInterfaceOrientationMaskPortrait;
    } else if ([orientationConfig isEqualToString:@"landscape"]) {
      // lock to landscape
      return UIInterfaceOrientationMaskLandscape;
    }
  }
  // no config or default value: allow autorotation
  return UIInterfaceOrientationMaskAllButUpsideDown;
}

#pragma mark - Loading Content

- (void)_reloadContent
{
  if (_tmrReload) {
    [_tmrReload invalidate];
    _tmrReload = nil;
  }
  [self _removeReactRootView];
  _utils = [[EXFrameUtils alloc] initWithFrame:self];

  if (_source) {
    NSAssert(_valid, @"Frame must be valid when loading content");

    Class versionManagerClass = [_utils versionedClassFromString:@"EXVersionManager"];
    Class bridgeClass = [_utils versionedClassFromString:@"RCTBridge"];
    Class rootViewClass = [_utils versionedClassFromString:@"RCTRootView"];

    BOOL isDeveloper = [_utils doesManifestEnableDeveloperTools];
    _versionManager = [[versionManagerClass alloc]
                       initWithFatalHandler:handleFatalReactError
                       logFunction:((isDeveloper) ? EXDeveloperRCTLogFunction : EXDefaultRCTLogFunction)
                       logThreshold:(isDeveloper) ? RCTLogLevelInfo : RCTLogLevelWarning
                       ];
    _reactBridge = [[bridgeClass alloc] initWithDelegate:self launchOptions:nil];
    _reactRootView = [[rootViewClass alloc] initWithBridge:_reactBridge
                                                moduleName:[_utils computedApplicationKey]
                                         initialProperties:[_utils initialProperties]];
    _reactRootView.frame = self.bounds;
    [self addSubview:_reactRootView];

    NSAssert([_reactBridge isLoading], @"React bridge should be loading once initialized");
    [[EXKernel sharedInstance].bridgeRegistry registerBridge:_reactBridge
                                             forExperienceId:_manifest[@"id"]
                                                       frame:self];
    [self _startObservingBridgeNotifications];
    [_versionManager bridgeWillStartLoading:_reactBridge];
  }
}

- (void)_handleJavaScriptStartLoadingEvent:(NSNotification *)notification
{
  if (_onLoadingStart) {
    _onLoadingStart(nil);
  }
}

- (void)_handleJavaScriptLoadEvent:(NSNotification *)notification
{
  if ([notification.name isEqualToString:[_utils versionedString:RCTJavaScriptDidLoadNotification]]) {
    [_versionManager bridgeFinishedLoading];
    [self _handleBridgeForegroundEvent:nil];
    if (_viewTestTimer) {
      [_viewTestTimer invalidate];
    }
    _viewTestTimer = [NSTimer scheduledTimerWithTimeInterval:0.02
                                                      target:self
                                                    selector:@selector(_checkAppFinishedLoading:)
                                                    userInfo:nil
                                                     repeats:YES];
  } else if ([notification.name isEqualToString:[_utils versionedString:RCTJavaScriptDidFailToLoadNotification]]) {
    NSError *error = notification.userInfo[@"error"];
    [self _sendLoadingError:error];
  }
}

- (void)_checkAppFinishedLoading:(NSTimer *)timer
{
  // When root view has been filled with something, there are two cases:
  //   1. AppLoading was never mounted, in which case we hide the loading indicator immediately
  //   2. AppLoading was mounted, in which case we wait till it is unmounted to hide the loading indicator
  if (_reactRootView &&
      _reactRootView.subviews.count > 0 &&
      _reactRootView.subviews.firstObject.subviews.count > 0) {
    EXAppLoadingManager *appLoading = nil;
    for (Class class in [_reactBridge moduleClasses]) {
      if ([class isSubclassOfClass:[EXAppLoadingManager class]]) {
        appLoading = [_reactBridge moduleForClass:[EXAppLoadingManager class]];
        break;
      }
    }
    if (!appLoading || !appLoading.started || appLoading.finished) {
      if (_onLoadingFinish) {
        _onLoadingFinish(nil);
      }
      [_viewTestTimer invalidate];
      _viewTestTimer = nil;
    }
  }
}

- (void)_handleBridgeForegroundEvent:(NSNotification * _Nullable)notification
{
  if (_debuggerHostname) {
    [[NSUserDefaults standardUserDefaults] setObject:_debuggerHostname forKey:@"websocket-executor-hostname"];
  } else {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"websocket-executor-hostname"];
  }
  if (_debuggerPort != -1) {
    [[NSUserDefaults standardUserDefaults] setInteger:_debuggerPort forKey:@"websocket-executor-port"];
  } else {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"websocket-executor-port"];
  }
  [_versionManager bridgeDidForeground];
}

- (void)_handleBridgeBackgroundEvent:(NSNotification *)notification
{
  [_versionManager bridgeDidBackground];
}

- (void)_sendLoadingError: (NSError *)error
{
  [[EXKernel sharedInstance].bridgeRegistry setError:error forBridge:_reactBridge];
  if (_onLoadingError) {
    NSMutableDictionary *event = [@{
                                    @"domain": error.domain,
                                    @"code": @(error.code),
                                    @"description": error.localizedDescription,
                                    } mutableCopy];
    if (error.localizedFailureReason) {
      event[@"reason"] = error.localizedFailureReason;
    }
    if (error.userInfo && error.userInfo[@"stack"]) {
      event[@"stack"] = error.userInfo[@"stack"];
    }
    _onLoadingError(event);
  }
}

- (void)_removeReactRootView
{
  [self _stopObservingBridgeNotifications];

  if (_versionManager) {
    [_versionManager invalidate];
    _versionManager = nil;
  }
  [[EXKernel sharedInstance].bridgeRegistry unregisterBridge:_reactBridge];
  [_reactRootView removeFromSuperview];
  [_reactBridge invalidate];
  _reactRootView = nil;
  _reactBridge = nil;
  _utils = nil;
  [[EXKernel sharedInstance].bridgeRegistry setError:nil forBridge:_reactBridge];
}

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

# pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return _source;
}

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSDictionary *params = @{
                           @"frame": self,
                           @"manifest": _manifest,
                           @"constants": @{
                               @"linkingUri": [EXKernel linkingUriForExperienceUri:_initialUri],
                               @"deviceId": [EXKernel deviceInstallUUID],
                               @"manifest": _manifest,
                               @"appOwnership": [_initialProps objectForKey:@"appOwnership"] ?: @"exponent",
                               },
                           @"initialUri": _initialUri,
                           @"isDeveloper": @([_utils doesManifestEnableDeveloperTools]),
                           };
  return [_versionManager extraModulesWithParams:params];
}

- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback
{
  // clear any potentially old loading state
  [[EXKernel sharedInstance].bridgeRegistry setError:nil forBridge:_reactBridge];

  NSString *bundleName;
  if (_initialProps && [_initialProps[@"shell"] boolValue]) {
    bundleName = kEXShellBundleResourceName;
    NSLog(@"EXFrame: Standalone bundle remote url is %@", bridge.bundleURL);
  } else {
    bundleName = _manifest[@"id"];
  }
  _jsResource = [[EXJavaScriptResource alloc] initWithBundleName:bundleName remoteUrl:bridge.bundleURL];
  _jsResource.abiVersion = _utils.validatedVersion;
  EXCachedResourceBehavior cacheBehavior = ([_utils doesManifestEnableDeveloperTools]) ? kEXCachedResourceNoCache : kEXCachedResourceFallBackToCache;
  
  [_jsResource loadResourceWithBehavior:cacheBehavior successBlock:^(NSData * _Nonnull sourceData) {
    loadCallback(nil, sourceData, sourceData.length);
  } errorBlock:^(NSError * _Nonnull error) {
    // RN is going to call RCTFatal() on this error, so keep a reference to it for later
    // so we can distinguish this non-fatal error from actual fatal cases.
    [[EXKernel sharedInstance].bridgeRegistry setError:error forBridge:_reactBridge];
    
    // also, for some reason RN doesn't post this for us
    [[NSNotificationCenter defaultCenter] postNotificationName:[_utils versionedString:RCTJavaScriptDidFailToLoadNotification] object:error];
    
    loadCallback(error, nil, 0);
  }];
}

# pragma mark - RCTExceptionsManagerDelegate

- (void)handleSoftJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId
{
  // send the error to the JS console
  if (_onError) {
    _onError(@{
               @"id": exceptionId,
               @"message": message,
               @"stack": stack,
               @"fatal": @(NO),
               });
  }
}

- (void)handleFatalJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId
{
  // send the error to the JS console
  if (_onError) {
    _onError(@{
               @"id": exceptionId,
               @"message": message,
               @"stack": stack,
               @"fatal": @(YES),
               });
  }
}

- (void)updateJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId
{
  // send the error to the JS console
  if (_onError) {
    _onError(@{
               @"id": exceptionId,
               @"message": message,
               @"stack": stack,
               });
  }
}

@end

NS_ASSUME_NONNULL_END
