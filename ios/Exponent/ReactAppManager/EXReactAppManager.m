// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"
#import "EXFatalHandler.h"
#import "EXFrame.h"
#import "EXJavaScriptResource.h"
#import "EXKernel.h"
#import "EXKernelUtil.h"
#import "EXReactAppManager+Private.h"
#import "EXShellManager.h"
#import "EXVersionManager.h"
#import "EXVersions.h"

#import <React/RCTBridge.h>
#import <React/RCTDevLoadingView.h>
#import <React/RCTJavaScriptLoader.h>
#import <React/RCTRootView.h>

NSString * const kEXDevToolShowDevMenuKey = @"devmenu";
NSTimeInterval const kEXJavaScriptResourceLongerTimeout = 120;

typedef void (^SDK21RCTSourceLoadBlock)(NSError *error, NSData *source, int64_t sourceLength);

@interface EXReactAppManager ()

@property (nonnull, strong) EXJavaScriptResource *jsResource;

@end


@interface RCTSource (EXReactAppManager)

- (instancetype)initWithURL:(nonnull NSURL *)url data:(nonnull NSData *)data;

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


@implementation EXReactAppManager

- (void)reload
{
  EXAssertMainThread();
  NSAssert((_delegate != nil), @"Cannot init react app without EXReactAppManagerDelegate");
  [self invalidate];
  [self computeVersionSymbolPrefix];
  [RCTDevLoadingView setEnabled:NO];
  
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

    [_delegate reactAppManagerDidInitApp:self];
    
    NSAssert([_reactBridge isLoading], @"React bridge should be loading once initialized");
    [self registerBridge];
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
    [self unregisterBridge];
    [_reactBridge invalidate];
    _reactBridge = nil;
    if (_delegate) {
      [_delegate reactAppManagerDidDestroyApp:self];
    }
  }
  [self _invalidateVersionState];
  _jsResource = nil;
}

- (void)showDevMenu
{
  if ([self areDevtoolsEnabled]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self.versionManager showDevMenuForBridge:self.reactBridge];
    });
  }
}

- (void)reloadBridge
{
  if ([self areDevtoolsEnabled]) {
    [self.reactBridge reload];
  }
}

- (void)disableRemoteDebugging
{
  if ([self areDevtoolsEnabled]) {
    [self.versionManager disableRemoteDebuggingForBridge:self.reactBridge];
  }
}

- (void)toggleElementInspector
{
  if ([self areDevtoolsEnabled]) {
    [self.versionManager toggleElementInspectorForBridge:self.reactBridge];
  }
}

- (NSDictionary<NSString *, NSString *> *)devMenuItems
{
  if ([self.versionManager respondsToSelector:@selector(devMenuItemsForBridge:)]) {
    return [self.versionManager devMenuItemsForBridge:self.reactBridge];
  }
  // pre-SDK 15 default: just make old RN dev menu available
  return @{
    kEXDevToolShowDevMenuKey: @{ @"label": @"Show Dev Menu", @"isEnabled": @YES },
  };
}

- (void)selectDevMenuItemWithKey:(NSString *)key
{
  if ([self.versionManager respondsToSelector:@selector(selectDevMenuItemWithKey:onBridge:)]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self.versionManager selectDevMenuItemWithKey:key onBridge:self.reactBridge];
    });
  } else {
    // pre-SDK 15 default: only option is RN dev menu
    if ([key isEqualToString:kEXDevToolShowDevMenuKey]) {
      [self showDevMenu];
    }
  }
}


#pragma mark - RCTBridgeDelegate

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
  if (cacheBehavior == kEXCachedResourceNoCache) {
    // no cache - wait longer before timing out
    _jsResource.requestTimeoutInterval = kEXJavaScriptResourceLongerTimeout;
  }
  if ([self shouldInvalidateJSResourceCache]) {
    [_jsResource removeCache];
  }
  [_jsResource loadResourceWithBehavior:cacheBehavior progressBlock:^(EXLoadingProgress * _Nonnull progress) {
    [weakSelf.delegate reactAppManager:weakSelf loadedJavaScriptWithProgress:progress];
  } successBlock:^(NSData * _Nonnull sourceData) {
    if ([self _compareVersionTo:22] == NSOrderedAscending) {
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
      [[NSNotificationCenter defaultCenter] postNotificationName:[strongSelf _versionedString:RCTJavaScriptDidFailToLoadNotification] object:error];
    }
    
    if ([self _compareVersionTo:22] == NSOrderedAscending) {
      SDK21RCTSourceLoadBlock legacyLoadCallback = (SDK21RCTSourceLoadBlock)loadCallback;
      legacyLoadCallback(error, nil, 0);
    } else {
      loadCallback(error, nil);
    }
  }];
}

#pragma mark - JavaScript loading

- (void)_startObservingBridgeNotifications
{
  NSAssert(_reactBridge, @"Must subscribe to loading notifs for a non-null bridge");
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptStartLoadingEvent:)
                                               name:[self _versionedString:RCTJavaScriptWillStartLoadingNotification]
                                             object:_reactBridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:[self _versionedString:RCTJavaScriptDidLoadNotification]
                                             object:_reactBridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleJavaScriptLoadEvent:)
                                               name:[self _versionedString:RCTJavaScriptDidFailToLoadNotification]
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
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self _versionedString:RCTJavaScriptWillStartLoadingNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self _versionedString:RCTJavaScriptDidLoadNotification] object:_reactBridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:[self _versionedString:RCTJavaScriptDidFailToLoadNotification] object:_reactBridge];
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
  if ([notification.name isEqualToString:[self _versionedString:RCTJavaScriptDidLoadNotification]]) {
    [_versionManager bridgeFinishedLoading];
    [self _handleBridgeForegroundEvent:nil];
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceFinishedLoadingWithId:strongSelf.experienceId];
        [strongSelf.delegate reactAppManagerFinishedLoadingJavaScript:strongSelf];
      }
    });
  } else if ([notification.name isEqualToString:[self _versionedString:RCTJavaScriptDidFailToLoadNotification]]) {
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

#pragma mark - internal

- (void)_invalidateVersionState
{
  _versionSymbolPrefix = @"";
  _validatedVersion = nil;
}

- (Class)versionedClassFromString: (NSString *)classString
{
  return NSClassFromString([self _versionedString:classString]);
}

- (NSString *)_versionedString: (NSString *)string
{
  return [EXVersions versionedString:string withPrefix:_versionSymbolPrefix];
}

- (NSComparisonResult)_compareVersionTo:(NSUInteger)version
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
EX_APP_MANAGER_ABSTRACT(- (BOOL)areDevtoolsEnabled)
EX_APP_MANAGER_ABSTRACT(- (void)computeVersionSymbolPrefix)
EX_APP_MANAGER_ABSTRACT(- (NSString *)bundleNameForJSResource)
EX_APP_MANAGER_ABSTRACT(- (EXCachedResourceBehavior)cacheBehaviorForJSResource)
EX_APP_MANAGER_ABSTRACT(- (BOOL)shouldInvalidateJSResourceCache)
EX_APP_MANAGER_ABSTRACT(- (NSURL *)bundleUrlForBridge)
EX_APP_MANAGER_ABSTRACT(- (NSDictionary * _Nullable)launchOptionsForBridge)
EX_APP_MANAGER_ABSTRACT(- (NSDictionary * _Nullable)initialPropertiesForRootView)
EX_APP_MANAGER_ABSTRACT(- (NSString *)applicationKeyForRootView)
EX_APP_MANAGER_ABSTRACT(- (RCTLogFunction)logFunction)
EX_APP_MANAGER_ABSTRACT(- (RCTLogLevel)logLevel)
EX_APP_MANAGER_ABSTRACT(- (void)registerBridge)
EX_APP_MANAGER_ABSTRACT(- (void)unregisterBridge)
EX_APP_MANAGER_ABSTRACT(- (NSString *)experienceId)

@end
