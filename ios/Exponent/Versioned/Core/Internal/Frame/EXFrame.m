// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppLoadingManager.h"
#import "EXFrame.h"
#import "EXUnversioned.h"

#import <React/RCTBridge.h>
#import <React/RCTExceptionsManager.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#define EX_FRAME_RELOAD_DEBOUNCE_SEC 0.05
#define EX_FRAME_ORIENTATION_USE_MANIFEST 0

NS_ASSUME_NONNULL_BEGIN

// we don't import EXFrameReactAppManager.h because it's unversioned,
// so we need to let the compiler know that somebody, somewhere, supports this interface.
@interface EXFrameReactAppManagerWithNoWarningsHack

- (instancetype)initWithEXFrame:(id)frame;
- (void)logKernelAnalyticsEventWithParams:(NSDictionary *)params;
- (void)registerErrorForBridge:(NSError *)error;
- (id)appLoadingManagerInstance;

@property (nonatomic, strong) UIView * __nullable reactRootView;
@property (nonatomic, strong) id __nullable reactBridge;

@end

@interface EXFrame () <RCTInvalidating, RCTExceptionsManagerDelegate>

@property (nonatomic, assign) BOOL sourceSet;
@property (nonatomic, assign) BOOL needsReload;

@property (nonatomic, copy) RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingProgress;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) RCTDirectEventBlock onError;

@property (nonatomic, strong) NSTimer *viewTestTimer;
@property (nonatomic, strong) NSTimer *tmrReload;

// unversioned
@property (nonatomic, strong) id appManager;

@end

@implementation EXFrame

@synthesize supportedInterfaceOrientations = _supportedInterfaceOrientations;

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)coder)

- (instancetype)init
{
  if (self = [super init]) {
    Class unversionedAppManagerClass = NSClassFromString(EX_UNVERSIONED(@"EXFrameReactAppManager"));
    RCTAssert(unversionedAppManagerClass, @"Cannot init a Frame with no %@ class", EX_UNVERSIONED(@"EXFrameReactAppManager"));

    _appManager = [[unversionedAppManagerClass alloc] initWithEXFrame:self];
    [_appManager setDelegate:self];
    _supportedInterfaceOrientations = EX_FRAME_ORIENTATION_USE_MANIFEST;
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
      [self _sendLoadingError:[NSError errorWithDomain:EX_UNVERSIONED(@"EXKernelErrorDomain") code:-1 userInfo:errorInfo]];
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
      [self _sendLoadingError:[NSError errorWithDomain:EX_UNVERSIONED(@"EXKernelErrorDomain") code:-1 userInfo:errorInfo]];
      isValid = NO;
    }
  }
  return isValid;
}

- (void)reload
{
  if ([self validateProps:@[ @"manifest", @"source" ]]) {
    [_appManager logKernelAnalyticsEventWithParams:@{
                                                     @"eventIdentifier": EX_UNVERSIONED(@"RELOAD_EXPERIENCE"),
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
                                                   @"eventIdentifier": EX_UNVERSIONED(@"LOAD_EXPERIENCE"),
                                                   @"manifestUrl": _initialUri,
                                                   @"eventProperties": @{
                                                       @"SDK_VERSION": manifestSdkVersion,
                                                       },
                                                   }];
  [_appManager reload];
}

- (void)_checkForReload
{
  RCTAssertMainQueue();
  if (_needsReload) {
    _sourceSet = NO;
    _needsReload = NO;
    
    if (_tmrReload) {
      [_tmrReload invalidate];
      _tmrReload = nil;
    }
    _tmrReload = [NSTimer scheduledTimerWithTimeInterval:EX_FRAME_RELOAD_DEBOUNCE_SEC target:self selector:@selector(load) userInfo:nil repeats:NO];
  }
}

#pragma mark - Layout

- (void)layoutSubviews
{
  [super layoutSubviews];
  if ([_appManager reactRootView]) {
    [_appManager reactRootView].frame = self.bounds;
  }
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  if (_supportedInterfaceOrientations != EX_FRAME_ORIENTATION_USE_MANIFEST) {
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
  RCTAssertMainQueue();
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

#pragma mark - EXReactAppManagerDelegate

- (void)reactAppManagerDidInitApp:(id)appManager
{
  UIView *reactRootView = [appManager reactRootView];
  reactRootView.frame = self.bounds;
  [self addSubview:reactRootView];
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

- (void)reactAppManager:(id)appManager loadedJavaScriptWithProgress:(RCTLoadingProgress *)progress;
{
  if (_onLoadingProgress) {
    _onLoadingProgress(@{
      @"status": RCTNullIfNil(progress.status),
      @"done": RCTNullIfNil(progress.done),
      @"total": RCTNullIfNil(progress.total),
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
  if ([_appManager reactRootView] &&
      [_appManager reactRootView].subviews.count > 0 &&
      [_appManager reactRootView].subviews.firstObject.subviews.count > 0) {
    EXAppLoadingManager *appLoading = [_appManager appLoadingManagerInstance];
    if (!appLoading || !appLoading.started || appLoading.finished) {
      [[NSNotificationCenter defaultCenter] postNotificationName:EX_UNVERSIONED(@"EXKernelAppDidDisplay") object:self];
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
  [[NSNotificationCenter defaultCenter] postNotificationName:EX_UNVERSIONED(@"EXKernelAppDidDisplay") object:self];
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
  // mark the experience as hitting an error so we can recover later
  [_appManager registerErrorForBridge:RCTErrorWithMessage(message)];

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
