#import <EXCore/EXUIManager.h>
#import <EXCore/EXEventEmitterService.h>
#import <EXCore/EXUtilitiesInterface.h>
#import <EXAdsAdMob/EXAdsAdMobInterstitial.h>

static NSString *const EXAdsAdMobInterstitialDidLoad = @"interstitialDidLoad";
static NSString *const EXAdsAdMobInterstitialDidFailToLoad = @"interstitialDidFailToLoad";
static NSString *const EXAdsAdMobInterstitialDidOpen = @"interstitialDidOpen";
static NSString *const EXAdsAdMobInterstitialDidClose = @"interstitialDidClose";
static NSString *const EXAdsAdMobInterstitialWillLeaveApplication = @"interstitialWillLeaveApplication";

@interface EXAdsAdMobInterstitial ()

@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<EXUtilitiesInterface> utilities;

@end

@implementation EXAdsAdMobInterstitial {
  GADInterstitial  *_interstitial;
  NSString *_adUnitID;
  bool _hasListeners;
  NSString *_testDeviceID;
  EXPromiseResolveBlock _showAdResolver;
  EXPromiseResolveBlock _requestAdResolver;
  EXPromiseRejectBlock _requestAdRejecter;
}

EX_EXPORT_MODULE(ExpoAdsAdMobInterstitialManager);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           EXAdsAdMobInterstitialDidLoad,
           EXAdsAdMobInterstitialDidFailToLoad,
           EXAdsAdMobInterstitialDidOpen,
           EXAdsAdMobInterstitialDidClose,
           EXAdsAdMobInterstitialWillLeaveApplication,
           ];
}

- (void)startObserving {
  _hasListeners = YES;
}

- (void)_maybeSendEventWithName:(NSString *)name body:(id)body {
  if (_hasListeners) {
    [_eventEmitter sendEventWithName:name body:body];
  }
}

- (void)stopObserving {
  _hasListeners = NO;
}

EX_EXPORT_METHOD_AS(setAdUnitID,
                    setAdUnitID:(NSString *)adUnitID
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  _adUnitID = adUnitID;
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setTestDeviceID,
                    setTestDeviceID:(NSString *)testDeviceID
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  _testDeviceID = testDeviceID;
  resolve(nil);
}

EX_EXPORT_METHOD_AS(requestAd,
                    requestAd:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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

EX_EXPORT_METHOD_AS(showAd,
                    showAd:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if ([_interstitial isReady] && _showAdResolver == nil) {
    _showAdResolver = resolve;
    EX_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      EX_ENSURE_STRONGIFY(self);
      [self->_interstitial presentFromRootViewController:self.utilities.currentViewController];
    });
  } else if (_showAdResolver != nil) {
    reject(@"E_AD_ALREADY_SHOWING", @"An ad is already being shown, await the first promise.", nil);
  } else {
    reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
  }
}

EX_EXPORT_METHOD_AS(dismissAd,
                    dismissAd:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    UIViewController *presentedViewController = self.utilities.currentViewController;
    if (presentedViewController != nil && [NSStringFromClass([presentedViewController class]) isEqualToString:@"GADInterstitialViewController"]) {
      [presentedViewController dismissViewControllerAnimated:true completion:^{
        resolve(nil);
        EX_ENSURE_STRONGIFY(self);
        self->_interstitial = nil;
      }];
    } else {
      reject(@"E_AD_NOT_SHOWN", @"Ad is not being shown.", nil);
    }
  });
}

EX_EXPORT_METHOD_AS(getIsReady,
                    getIsReady:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  resolve([NSNumber numberWithBool:[_interstitial isReady]]);
}


- (void)interstitialDidReceiveAd:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidLoad body:nil];
  _requestAdResolver(nil);
  [self _cleanupRequestAdPromise];
}

- (void)interstitial:(GADInterstitial *)interstitial didFailToReceiveAdWithError:(GADRequestError *)error {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidFailToLoad body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self _cleanupRequestAdPromise];
  _interstitial = nil;
}

- (void)interstitialWillPresentScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidOpen body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)interstitialDidDismissScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidClose body:nil];
}

- (void)interstitialWillLeaveApplication:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialWillLeaveApplication body:nil];
}

- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

@end
