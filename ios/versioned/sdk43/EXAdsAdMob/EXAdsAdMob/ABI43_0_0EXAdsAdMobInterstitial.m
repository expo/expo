#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUIManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitterService.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilitiesInterface.h>
#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsAdMobInterstitial.h>

static NSString *const ABI43_0_0EXAdsAdMobInterstitialDidLoad = @"interstitialDidLoad";
static NSString *const ABI43_0_0EXAdsAdMobInterstitialDidFailToLoad = @"interstitialDidFailToLoad";
static NSString *const ABI43_0_0EXAdsAdMobInterstitialDidOpen = @"interstitialDidOpen";
static NSString *const ABI43_0_0EXAdsAdMobInterstitialDidClose = @"interstitialDidClose";
static NSString *const ABI43_0_0EXAdsAdMobInterstitialWillLeaveApplication = @"interstitialWillLeaveApplication";

@interface ABI43_0_0EXAdsAdMobInterstitial ()

@property (nonatomic, weak) id<ABI43_0_0EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI43_0_0EXUtilitiesInterface> utilities;

@end

@implementation ABI43_0_0EXAdsAdMobInterstitial {
  GADInterstitial  *_interstitial;
  NSString *_adUnitID;
  bool _hasListeners;
  ABI43_0_0EXPromiseResolveBlock _showAdResolver;
  ABI43_0_0EXPromiseResolveBlock _requestAdResolver;
  ABI43_0_0EXPromiseRejectBlock _requestAdRejecter;
}

ABI43_0_0EX_EXPORT_MODULE(ExpoAdsAdMobInterstitialManager);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUtilitiesInterface)];
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           ABI43_0_0EXAdsAdMobInterstitialDidLoad,
           ABI43_0_0EXAdsAdMobInterstitialDidFailToLoad,
           ABI43_0_0EXAdsAdMobInterstitialDidOpen,
           ABI43_0_0EXAdsAdMobInterstitialDidClose,
           ABI43_0_0EXAdsAdMobInterstitialWillLeaveApplication,
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

ABI43_0_0EX_EXPORT_METHOD_AS(setAdUnitID,
                    setAdUnitID:(NSString *)adUnitID
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  _adUnitID = adUnitID;
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(requestAd,
                    requestAdWithAdditionalRequestParams:(NSDictionary *)additionalRequestParams
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if ([_interstitial hasBeenUsed] || _interstitial == nil) {
    _requestAdResolver = resolve;
    _requestAdRejecter = reject;
    
    _interstitial = [[GADInterstitial alloc] initWithAdUnitID:_adUnitID];
    _interstitial.delegate = self;
    
    GADRequest *request = [GADRequest request];
    if (additionalRequestParams) {
      GADExtras *extras = [[GADExtras alloc] init];
      extras.additionalParameters = additionalRequestParams;
      [request registerAdNetworkExtras:extras];
    }
    [_interstitial loadRequest:request];
  } else {
    reject(@"E_AD_ALREADY_LOADED", @"Ad is already loaded.", nil);
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(showAd,
                    showAd:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if ([_interstitial isReady] && _showAdResolver == nil) {
    _showAdResolver = resolve;
    ABI43_0_0EX_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI43_0_0EX_ENSURE_STRONGIFY(self);
      [self->_interstitial presentFromRootViewController:self.utilities.currentViewController];
    });
  } else if (_showAdResolver != nil) {
    reject(@"E_AD_ALREADY_SHOWING", @"An ad is already being shown, await the first promise.", nil);
  } else {
    reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(dismissAd,
                    dismissAd:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  ABI43_0_0EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI43_0_0EX_ENSURE_STRONGIFY(self);
    UIViewController *presentedViewController = self.utilities.currentViewController;
    if (presentedViewController != nil && [NSStringFromClass([presentedViewController class]) hasPrefix:@"GAD"]) {
      [presentedViewController dismissViewControllerAnimated:true completion:^{
        resolve(nil);
        ABI43_0_0EX_ENSURE_STRONGIFY(self);
        self->_interstitial = nil;
      }];
    } else {
      reject(@"E_AD_NOT_SHOWN", @"Ad is not being shown.", nil);
    }
  });
}

ABI43_0_0EX_EXPORT_METHOD_AS(getIsReady,
                    getIsReady:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve([NSNumber numberWithBool:[_interstitial isReady]]);
}


- (void)interstitialDidReceiveAd:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobInterstitialDidLoad body:nil];
  _requestAdResolver(nil);
  [self _cleanupRequestAdPromise];
}

- (void)interstitial:(GADInterstitial *)interstitial didFailToReceiveAdWithError:(GADRequestError *)error {
  [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobInterstitialDidFailToLoad body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self _cleanupRequestAdPromise];
  _interstitial = nil;
}

- (void)interstitialWillPresentScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobInterstitialDidOpen body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)interstitialDidDismissScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobInterstitialDidClose body:nil];
}

- (void)interstitialWillLeaveApplication:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobInterstitialWillLeaveApplication body:nil];
}

- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

@end
