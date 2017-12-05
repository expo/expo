// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXAppLoadingManager.h"
#import "ABI20_0_0EXFrame.h"
#import "ABI20_0_0EXUnversioned.h"

#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/ABI20_0_0RCTExceptionsManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUtils.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>

#define ABI20_0_0EX_FRAME_RELOAD_DEBOUNCE_SEC 0.05
#define ABI20_0_0EX_FRAME_ORIENTATION_USE_MANIFEST 0

NS_ASSUME_NONNULL_BEGIN

// we don't import ABI20_0_0EXFrameReactABI20_0_0AppManager.h because it's unversioned,
// so we need to let the compiler know that somebody, somewhere, supports this interface.
@interface ABI20_0_0EXFrameReactABI20_0_0AppManagerWithNoWarningsHack

- (instancetype)initWithEXFrame:(id)frame;
- (void)logKernelAnalyticsEventWithParams:(NSDictionary *)params;
- (void)registerErrorForBridge:(NSError *)error;
- (id)appLoadingManagerInstance;

@property (nonatomic, strong) UIView * __nullable ReactABI20_0_0RootView;
@property (nonatomic, strong) id __nullable ReactABI20_0_0Bridge;

@end

@interface ABI20_0_0EXFrame () <ABI20_0_0RCTInvalidating, ABI20_0_0RCTExceptionsManagerDelegate>

@property (nonatomic, assign) BOOL sourceSet;
@property (nonatomic, assign) BOOL needsReload;

@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onLoadingProgress;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onError;

@property (nonatomic, strong) NSTimer *viewTestTimer;
@property (nonatomic, strong) NSTimer *tmrReload;

// unversioned
@property (nonatomic, strong) id appManager;

@end

@implementation ABI20_0_0EXFrame

@synthesize supportedInterfaceOrientations = _supportedInterfaceOrientations;

ABI20_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)coder)

- (instancetype)init
{
  if (self = [super init]) {
    Class unversionedAppManagerClass = NSClassFromString(@"EXFrameReactAppManager");
    ABI20_0_0RCTAssert(unversionedAppManagerClass, @"Cannot init a Frame with no %@ class", @"EXFrameReactAppManager");

    _appManager = [[unversionedAppManagerClass alloc] initWithEXFrame:self];
    [_appManager setDelegate:self];
    _supportedInterfaceOrientations = ABI20_0_0EX_FRAME_ORIENTATION_USE_MANIFEST;
  }
  return self;
}

- (void)dealloc
{
  [self invalidate];
}

#pragma mark - Invalidation

- (void)invalidate
{
  if (_tmrReload) {
    [_tmrReload invalidate];
    _tmrReload = nil;
  }
  [_appManager invalidate];
  if (_viewTestTimer) {
    [_viewTestTimer invalidate];
    _viewTestTimer = nil;
  }
  
  _sourceSet = NO;
  _needsReload = NO;
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
      [self _sendLoadingError:[NSError errorWithDomain:@"EXKernelErrorDomain" code:-1 userInfo:errorInfo]];
      isValid = NO;
    }
  }
  if ([changedProps containsObject:@"source"]) {
    // Performed in additon to JS-side validation because RN iOS websockets will crash without a port.
    _source = [[self class] _ensureUrlHasPort:_source];
    if (_source) {
      _sourceSet = YES;
    } else {
      // we had issues with this bundle url
      NSDictionary *errorInfo = @{
                                  NSLocalizedDescriptionKey: @"Cannot open the given bundle url",
                                  NSLocalizedFailureReasonErrorKey: [NSString stringWithFormat:@"Cannot parse bundle url %@", [_source absoluteString]],
                                  };
      [self _sendLoadingError:[NSError errorWithDomain:@"EXKernelErrorDomain" code:-1 userInfo:errorInfo]];
      isValid = NO;
    }
  }
  return isValid;
}

- (void)reload
{
  if ([self validateProps:@[ @"manifest", @"source" ]]) {
    [_appManager logKernelAnalyticsEventWithParams:@{
                                                     @"eventIdentifier": @"RELOAD_EXPERIENCE",
                                                     @"manifestUrl": _initialUri,
                                                     }];
    [_appManager reload];
  }
}

- (void)load
{
  // we haven't yet validated or loaded this experience, so just record whatever the manifest says.
  NSString *manifestSdkVersion = (_manifest) ? _manifest[@"sdkVersion"] : nil;
  [_appManager logKernelAnalyticsEventWithParams:@{
                                                   @"eventIdentifier": @"LOAD_EXPERIENCE",
                                                   @"manifestUrl": _initialUri,
                                                   @"eventProperties": @{
                                                       @"SDK_VERSION": manifestSdkVersion,
                                                       },
                                                   }];
  [_appManager reload];
}

- (void)_checkForReload
{
  ABI20_0_0RCTAssertMainThread();
  if (_needsReload) {
    _sourceSet = NO;
    _needsReload = NO;
    
    if (_tmrReload) {
      [_tmrReload invalidate];
      _tmrReload = nil;
    }
    _tmrReload = [NSTimer scheduledTimerWithTimeInterval:ABI20_0_0EX_FRAME_RELOAD_DEBOUNCE_SEC target:self selector:@selector(load) userInfo:nil repeats:NO];
  }
}

#pragma mark - Layout

- (void)layoutSubviews
{
  [super layoutSubviews];
  if ([_appManager ReactABI20_0_0RootView]) {
    [_appManager ReactABI20_0_0RootView].frame = self.bounds;
  }
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  if (_supportedInterfaceOrientations != ABI20_0_0EX_FRAME_ORIENTATION_USE_MANIFEST) {
    return _supportedInterfaceOrientations;
  }
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

- (void)setSupportedInterfaceOrientations:(UIInterfaceOrientationMask)orientation
{
  _supportedInterfaceOrientations = orientation;
  [self enforceDesiredDeviceOrientation];
}

/**
 *  If a developer has locked their experience to a particular orientation,
 *  but some other experience has allowed the device to rotate to something unsupported,
 *  attempt to resolve that discrepancy here by forcing the device to rotate.
 */
- (void)enforceDesiredDeviceOrientation
{
  ABI20_0_0RCTAssertMainThread();
  UIInterfaceOrientationMask mask = [self supportedInterfaceOrientations];
  UIDeviceOrientation currentOrientation = [[UIDevice currentDevice] orientation];
  UIInterfaceOrientation newOrientation = UIInterfaceOrientationUnknown;
  switch (mask) {
    case UIInterfaceOrientationMaskPortrait:
      if (!UIDeviceOrientationIsPortrait(currentOrientation)) {
        newOrientation = UIInterfaceOrientationPortrait;
      }
      break;
    case UIInterfaceOrientationMaskPortraitUpsideDown:
        newOrientation = UIInterfaceOrientationPortraitUpsideDown;
      break;
    case UIInterfaceOrientationMaskLandscape:
      if (!UIDeviceOrientationIsLandscape(currentOrientation)) {
        newOrientation = UIInterfaceOrientationLandscapeLeft;
      }
      break;
    case UIInterfaceOrientationMaskLandscapeLeft:
      newOrientation = UIInterfaceOrientationLandscapeLeft;
      break;
    case UIInterfaceOrientationMaskLandscapeRight:
      newOrientation = UIInterfaceOrientationLandscapeRight;
      break;
    case UIInterfaceOrientationMaskAllButUpsideDown:
      if (currentOrientation == UIDeviceOrientationFaceDown) {
        newOrientation = UIInterfaceOrientationPortrait;
      }
      break;
    default:
      break;
  }
  if (newOrientation != UIInterfaceOrientationUnknown) {
    [[UIDevice currentDevice] setValue:@(newOrientation) forKey:@"orientation"];
  }
  [UIViewController attemptRotationToDeviceOrientation];
}

#pragma mark - ABI20_0_0EXReactABI20_0_0AppManagerDelegate

- (void)reactAppManagerDidInitApp:(id)appManager
{
  UIView *ReactABI20_0_0RootView = [appManager ReactABI20_0_0RootView];
  ReactABI20_0_0RootView.frame = self.bounds;
  [self addSubview:ReactABI20_0_0RootView];
}

- (void)reactAppManagerDidDestroyApp:(id)appManager
{
  if (_tmrReload) {
    [_tmrReload invalidate];
    _tmrReload = nil;
  }
}

- (void)reactAppManagerStartedLoadingJavaScript:(id)appManager
{
  if (_onLoadingStart) {
    _onLoadingStart(nil);
  }
}

- (void)reactAppManager:(id)appManager loadedJavaScriptWithProgress:(ABI20_0_0RCTLoadingProgress *)progress;
{
  if (_onLoadingProgress) {
    _onLoadingProgress(@{
      @"status": ABI20_0_0RCTNullIfNil(progress.status),
      @"done": ABI20_0_0RCTNullIfNil(progress.done),
      @"total": ABI20_0_0RCTNullIfNil(progress.total),
    });
  }
}

- (void)reactAppManagerFinishedLoadingJavaScript:(id)appManager
{
  if (_viewTestTimer) {
    [_viewTestTimer invalidate];
  }
  _viewTestTimer = [NSTimer scheduledTimerWithTimeInterval:0.02
                                                    target:self
                                                  selector:@selector(_checkAppFinishedLoading:)
                                                  userInfo:nil
                                                   repeats:YES];
}

- (void)reactAppManager:(id)appManager failedToLoadJavaScriptWithError:(NSError *)error
{
  [self _sendLoadingError:error];
}

- (void)reactAppManager:(id)appManager failedToDownloadBundleWithError:(NSError *)error
{
  
}

- (void)reactAppManagerDidForeground:(id)appManager
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
  
  dispatch_async(dispatch_get_main_queue(), ^{
    [self enforceDesiredDeviceOrientation];
  });
}

#pragma mark - Internal

- (void)_checkAppFinishedLoading:(NSTimer *)timer
{
  // When root view has been filled with something, there are two cases:
  //   1. AppLoading was never mounted, in which case we hide the loading indicator immediately
  //   2. AppLoading was mounted, in which case we wait till it is unmounted to hide the loading indicator
  if ([_appManager ReactABI20_0_0RootView] &&
      [_appManager ReactABI20_0_0RootView].subviews.count > 0 &&
      [_appManager ReactABI20_0_0RootView].subviews.firstObject.subviews.count > 0) {
    ABI20_0_0EXAppLoadingManager *appLoading = [_appManager appLoadingManagerInstance];
    if (!appLoading || !appLoading.started || appLoading.finished) {
      if (_onLoadingFinish) {
        _onLoadingFinish(nil);
      }
      [_viewTestTimer invalidate];
      _viewTestTimer = nil;
    }
  }
}

- (void)_sendLoadingError: (NSError *)error
{
  [_appManager registerErrorForBridge:error];
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

+ (NSURL *)_ensureUrlHasPort:(NSURL *)url
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:YES];
  if (components) {
    NSString *host = components.host;
    if (host) {
      if (!components.port) {
        if ([url.scheme isEqualToString:@"https"] || [url.scheme isEqualToString:@"exps"]) {
          components.port = @443;
        } else {
          components.port = @80;
        }
      }
      return [components URL];
    }
  }
  return nil;
}

# pragma mark - ABI20_0_0RCTExceptionsManagerDelegate

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
  // mark the experience as hitting an error so we can recover later
  [_appManager registerErrorForBridge:ABI20_0_0RCTErrorWithMessage(message)];

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
