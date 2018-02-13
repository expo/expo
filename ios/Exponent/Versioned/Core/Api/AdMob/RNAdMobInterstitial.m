#import "RNAdMobInterstitial.h"

static NSString *const EXAdMobInterstitialDidLoad = @"interstitialDidLoad";
static NSString *const EXAdMobInterstitialDidFailToLoad = @"interstitialDidFailToLoad";
static NSString *const EXAdMobInterstitialDidOpen = @"interstitialDidOpen";
static NSString *const EXAdMobInterstitialDidClose = @"interstitialDidClose";
static NSString *const EXAdMobInterstitialWillLeaveApplication = @"interstitialWillLeaveApplication";

@implementation RNAdMobInterstitial {
  GADInterstitial  *_interstitial;
  NSString *_adUnitID;
  bool _hasListeners;
  NSString *_testDeviceID;
  RCTPromiseResolveBlock _showAdResolver;
  RCTPromiseResolveBlock _requestAdResolver;
  RCTPromiseRejectBlock _requestAdRejecter;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE();

# pragma mark - RCTEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           EXAdMobInterstitialDidLoad,
           EXAdMobInterstitialDidFailToLoad,
           EXAdMobInterstitialDidOpen,
           EXAdMobInterstitialDidClose,
           EXAdMobInterstitialWillLeaveApplication,
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

# pragma mark - Exported methods, React API

RCT_EXPORT_METHOD(setAdUnitID:(NSString *)adUnitID)
{
  _adUnitID = adUnitID;
}

RCT_EXPORT_METHOD(setTestDeviceID:(NSString *)testDeviceID)
{
  _testDeviceID = testDeviceID;
}

RCT_EXPORT_METHOD(requestAd:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
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

RCT_EXPORT_METHOD(showAd:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
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

RCT_EXPORT_METHOD(dismissAd:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  UIViewController *presentedViewController = [UIApplication sharedApplication].delegate.window.rootViewController.presentedViewController;
  if (presentedViewController != nil && [NSStringFromClass([presentedViewController class]) isEqualToString:@"GADInterstitialViewController"]) {
    [[UIApplication sharedApplication].delegate.window.rootViewController dismissViewControllerAnimated:true completion:^{
      resolve(nil);
      _interstitial = nil;
    }];
  } else {
    reject(@"E_AD_NOT_SHOWN", @"Ad is not being shown.", nil);
  }
}

RCT_EXPORT_METHOD(getIsReady:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([NSNumber numberWithBool:[_interstitial isReady]]);
}

# pragma mark - GADInterstitialDelegate

- (void)interstitialDidReceiveAd:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:EXAdMobInterstitialDidLoad body:nil];
  _requestAdResolver(nil);
  [self _cleanupRequestAdPromise];
}

- (void)interstitial:(GADInterstitial *)interstitial didFailToReceiveAdWithError:(GADRequestError *)error {
  [self _maybeSendEventWithName:EXAdMobInterstitialDidFailToLoad body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self _cleanupRequestAdPromise];
  _interstitial = nil;
}

- (void)interstitialWillPresentScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:EXAdMobInterstitialDidOpen body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)interstitialDidDismissScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:EXAdMobInterstitialDidClose body:nil];
}

- (void)interstitialWillLeaveApplication:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:EXAdMobInterstitialWillLeaveApplication body:nil];
}

- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

@end
