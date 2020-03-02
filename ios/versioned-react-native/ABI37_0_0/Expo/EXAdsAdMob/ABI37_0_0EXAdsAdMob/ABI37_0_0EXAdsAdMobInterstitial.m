#import <ABI37_0_0UMCore/ABI37_0_0UMUIManager.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitterService.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUtilitiesInterface.h>
#import <ABI37_0_0EXAdsAdMob/ABI37_0_0EXAdsAdMobInterstitial.h>

static NSString *const ABI37_0_0EXAdsAdMobInterstitialDidLoad = @"interstitialDidLoad";
static NSString *const ABI37_0_0EXAdsAdMobInterstitialDidFailToLoad = @"interstitialDidFailToLoad";
static NSString *const ABI37_0_0EXAdsAdMobInterstitialDidOpen = @"interstitialDidOpen";
static NSString *const ABI37_0_0EXAdsAdMobInterstitialDidClose = @"interstitialDidClose";
static NSString *const ABI37_0_0EXAdsAdMobInterstitialWillLeaveApplication = @"interstitialWillLeaveApplication";

@interface ABI37_0_0EXAdsAdMobInterstitial ()

@property (nonatomic, weak) id<ABI37_0_0UMEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI37_0_0UMUtilitiesInterface> utilities;

@end

@implementation ABI37_0_0EXAdsAdMobInterstitial {
  GADInterstitial  *_interstitial;
  NSString *_adUnitID;
  bool _hasListeners;
  ABI37_0_0UMPromiseResolveBlock _showAdResolver;
  ABI37_0_0UMPromiseResolveBlock _requestAdResolver;
  ABI37_0_0UMPromiseRejectBlock _requestAdRejecter;
}

ABI37_0_0UM_EXPORT_MODULE(ExpoAdsAdMobInterstitialManager);

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMUtilitiesInterface)];
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           ABI37_0_0EXAdsAdMobInterstitialDidLoad,
           ABI37_0_0EXAdsAdMobInterstitialDidFailToLoad,
           ABI37_0_0EXAdsAdMobInterstitialDidOpen,
           ABI37_0_0EXAdsAdMobInterstitialDidClose,
           ABI37_0_0EXAdsAdMobInterstitialWillLeaveApplication,
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

ABI37_0_0UM_EXPORT_METHOD_AS(setAdUnitID,
                    setAdUnitID:(NSString *)adUnitID
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  _adUnitID = adUnitID;
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(requestAd,
                    requestAdWithAdditionalRequestParams:(NSDictionary *)additionalRequestParams
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
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

ABI37_0_0UM_EXPORT_METHOD_AS(showAd,
                    showAd:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if ([_interstitial isReady] && _showAdResolver == nil) {
    _showAdResolver = resolve;
    ABI37_0_0UM_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI37_0_0UM_ENSURE_STRONGIFY(self);
      [self->_interstitial presentFromRootViewController:self.utilities.currentViewController];
    });
  } else if (_showAdResolver != nil) {
    reject(@"E_AD_ALREADY_SHOWING", @"An ad is already being shown, await the first promise.", nil);
  } else {
    reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
  }
}

ABI37_0_0UM_EXPORT_METHOD_AS(dismissAd,
                    dismissAd:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  ABI37_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI37_0_0UM_ENSURE_STRONGIFY(self);
    UIViewController *presentedViewController = self.utilities.currentViewController;
    if (presentedViewController != nil && [NSStringFromClass([presentedViewController class]) hasPrefix:@"GAD"]) {
      [presentedViewController dismissViewControllerAnimated:true completion:^{
        resolve(nil);
        ABI37_0_0UM_ENSURE_STRONGIFY(self);
        self->_interstitial = nil;
      }];
    } else {
      reject(@"E_AD_NOT_SHOWN", @"Ad is not being shown.", nil);
    }
  });
}

ABI37_0_0UM_EXPORT_METHOD_AS(getIsReady,
                    getIsReady:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  resolve([NSNumber numberWithBool:[_interstitial isReady]]);
}


- (void)interstitialDidReceiveAd:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI37_0_0EXAdsAdMobInterstitialDidLoad body:nil];
  _requestAdResolver(nil);
  [self _cleanupRequestAdPromise];
}

- (void)interstitial:(GADInterstitial *)interstitial didFailToReceiveAdWithError:(GADRequestError *)error {
  [self _maybeSendEventWithName:ABI37_0_0EXAdsAdMobInterstitialDidFailToLoad body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self _cleanupRequestAdPromise];
  _interstitial = nil;
}

- (void)interstitialWillPresentScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI37_0_0EXAdsAdMobInterstitialDidOpen body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)interstitialDidDismissScreen:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI37_0_0EXAdsAdMobInterstitialDidClose body:nil];
}

- (void)interstitialWillLeaveApplication:(GADInterstitial *)ad {
  [self _maybeSendEventWithName:ABI37_0_0EXAdsAdMobInterstitialWillLeaveApplication body:nil];
}

- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

@end
