#import "ABI29_0_0RNAdMobInterstitial.h"

static NSString *const ABI29_0_0EXAdMobInterstitialDidLoad = @"interstitialDidLoad";
static NSString *const ABI29_0_0EXAdMobInterstitialDidFailToLoad = @"interstitialDidFailToLoad";
static NSString *const ABI29_0_0EXAdMobInterstitialDidOpen = @"interstitialDidOpen";
static NSString *const ABI29_0_0EXAdMobInterstitialDidClose = @"interstitialDidClose";
static NSString *const ABI29_0_0EXAdMobInterstitialWillLeaveApplication = @"interstitialWillLeaveApplication";

@implementation ABI29_0_0RNAdMobInterstitial {
  GADInterstitial  *_interstitial;
  NSString *_adUnitID;
  bool _hasListeners;
  NSString *_testDeviceID;
  ABI29_0_0RCTPromiseResolveBlock _showAdResolver;
  ABI29_0_0RCTPromiseResolveBlock _requestAdResolver;
  ABI29_0_0RCTPromiseRejectBlock _requestAdRejecter;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI29_0_0RCT_EXPORT_MODULE();

# pragma mark - ABI29_0_0RCTEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           ABI29_0_0EXAdMobInterstitialDidLoad,
           ABI29_0_0EXAdMobInterstitialDidFailToLoad,
           ABI29_0_0EXAdMobInterstitialDidOpen,
           ABI29_0_0EXAdMobInterstitialDidClose,
           ABI29_0_0EXAdMobInterstitialWillLeaveApplication,
           ];
}

- (void)startObserving {
  _hasListeners = YES;
}

- (void)_maybeSendEventWithName:(NSString *)name body:(id)body {
  if (_hasListeners) {
    [self sendEventWithName:name body:body];
  }
}

- (void)stopObserving {
  _hasListeners = NO;
}

# pragma mark - Exported methods, ReactABI29_0_0 API

ABI29_0_0RCT_EXPORT_METHOD(setAdUnitID:(NSString *)adUnitID)
{
  _adUnitID = adUnitID;
}

ABI29_0_0RCT_EXPORT_METHOD(setTestDeviceID:(NSString *)testDeviceID)
{
  _testDeviceID = testDeviceID;
}

ABI29_0_0RCT_EXPORT_METHOD(requestAd:(ABI29_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
{
  if ([_interstitial hasBeenUsed] || _interstitial == nil) {
    _requestAdResolver = resolve;
    _requestAdRejecter = reject;
    
    _interstitial = [[GADInterstitial alloc] initWithAdUnitID:_adUnitID];
    _interstitial.delegate = self;
    
    GADRequest *request = [GADRequest request];
    if (_testDeviceID) {
      if ([_testDeviceID isEqualToString:@"EMULATOR"]) {
        request.testDevices = @[kGADSimulatorID];
      } else {
        request.testDevices = @[_testDeviceID];
      }
    }
    [_interstitial loadRequest:request];
  } else {
    reject(@"E_AD_ALREADY_LOADED", @"Ad is already loaded.", nil);
  }
}

ABI29_0_0RCT_EXPORT_METHOD(showAd:(ABI29_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
{
  if ([_interstitial isReady] && _showAdResolver == nil) {
    _showAdResolver = resolve;
    [_interstitial presentFromRootViewController:[UIApplication sharedApplication].delegate.window.rootViewController];
  } else if (_showAdResolver != nil) {
    reject(@"E_AD_ALREADY_SHOWING", @"An ad is already being shown, await the first promise.", nil);
  } else {
    reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
  }
}

ABI29_0_0RCT_EXPORT_METHOD(dismissAd:(ABI29_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
{
  UIViewController *presentedViewController = [UIApplication sharedApplication].delegate.window.rootViewController.presentedViewController;
  if (presentedViewController != nil && [NSStringFromClass([presentedViewController class]) isEqualToString:@"GADInterstitialViewController"]) {
    [[UIApplication sharedApplication].delegate.window.rootViewController dismissViewControllerAnimated:true completion:^{
      resolve(nil);
      self->_interstitial = nil;
    }];
  } else {
    reject(@"E_AD_NOT_SHOWN", @"Ad is not being shown.", nil);
  }
}

ABI29_0_0RCT_EXPORT_METHOD(getIsReady:(ABI29_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
{
  resolve([NSNumber numberWithBool:[_interstitial isReady]]);
}

# pragma mark - GADInterstitialDelegate

- (void)interstitialDidReceiveAd:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI29_0_0EXAdMobInterstitialDidLoad body:nil];
  _requestAdResolver(nil);
  [self _cleanupRequestAdPromise];
}

- (void)interstitial:(GADInterstitial *)interstitial didFailToReceiveAdWithError:(GADRequestError *)error {
  [self _maybeSendEventWithName:ABI29_0_0EXAdMobInterstitialDidFailToLoad body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self _cleanupRequestAdPromise];
  _interstitial = nil;
}

- (void)interstitialWillPresentScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI29_0_0EXAdMobInterstitialDidOpen body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)interstitialDidDismissScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI29_0_0EXAdMobInterstitialDidClose body:nil];
}

- (void)interstitialWillLeaveApplication:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI29_0_0EXAdMobInterstitialWillLeaveApplication body:nil];
}

- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

@end
