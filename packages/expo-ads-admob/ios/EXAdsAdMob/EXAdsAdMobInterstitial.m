#import <ExpoModulesCore/EXUIManager.h>
#import <ExpoModulesCore/EXEventEmitterService.h>
#import <ExpoModulesCore/EXUtilitiesInterface.h>
#import <EXAdsAdMob/EXAdsAdMobInterstitial.h>

static NSString *const EXAdsAdMobInterstitialDidLoad = @"interstitialDidLoad";
static NSString *const EXAdsAdMobInterstitialDidFailToLoad = @"interstitialDidFailToLoad";
static NSString *const EXAdsAdMobInterstitialDidOpen = @"interstitialDidOpen";
static NSString *const EXAdsAdMobInterstitialDidClose = @"interstitialDidClose";

@interface EXAdsAdMobInterstitial ()

@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<EXUtilitiesInterface> utilities;

@end

@implementation EXAdsAdMobInterstitial {
  GADInterstitialAd  *_interstitial;
  NSString *_adUnitID;
  bool _hasListeners;
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

EX_EXPORT_METHOD_AS(requestAd,
                    requestAdWithAdditionalRequestParams:(NSDictionary *)additionalRequestParams
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_interstitial) {
    bool canPresent = [_interstitial canPresentFromRootViewController:self.utilities.currentViewController error:nil];
    
    if (canPresent) {
      reject(@"E_AD_ALREADY_LOADED", @"Ad is already loaded.", nil);
      return;
    }
  }
  
  _requestAdResolver = resolve;
  _requestAdRejecter = reject;
  
  GADRequest *request = [GADRequest request];
  if (additionalRequestParams) {
    GADExtras *extras = [[GADExtras alloc] init];
    extras.additionalParameters = additionalRequestParams;
    [request registerAdNetworkExtras:extras];
  }

  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    [GADInterstitialAd loadWithAdUnitID:self->_adUnitID request:request completionHandler:^(GADInterstitialAd *ad, NSError *error) {
      EX_ENSURE_STRONGIFY(self);
      if (error) {
        [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidFailToLoad body:@{ @"name": [error description] }];
        self->_requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
        [self _cleanupRequestAdPromise];
        self->_interstitial = nil;
      } else {
        self->_interstitial = ad;
        self->_interstitial.fullScreenContentDelegate = self;
        
        [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidLoad body:nil];
        self->_requestAdResolver(nil);
        [self _cleanupRequestAdPromise];
      }
    }];
  });
}

EX_EXPORT_METHOD_AS(showAd,
                    showAd:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (!_interstitial) {
    reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
    return;
  }
  
  if (_showAdResolver != nil) {
    reject(@"E_AD_ALREADY_SHOWING", @"An ad is already being shown, await the first promise.", nil);
    return;
  }
  
  bool canPresent = [_interstitial canPresentFromRootViewController:self.utilities.currentViewController error:nil];
  
  if (!canPresent) {
    reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
    return;
  }
  
  _showAdResolver = resolve;
  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    [self->_interstitial presentFromRootViewController:self.utilities.currentViewController];
  });
}

EX_EXPORT_METHOD_AS(dismissAd,
                    dismissAd:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    UIViewController *presentedViewController = self.utilities.currentViewController;
    if (presentedViewController != nil && [NSStringFromClass([presentedViewController class]) hasPrefix:@"GAD"]) {
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
  if (!_interstitial) {
    resolve([NSNumber numberWithBool:false]);
  }
  
  bool canPresent = [_interstitial canPresentFromRootViewController:self.utilities.currentViewController error:nil];
  
  resolve([NSNumber numberWithBool:canPresent]);
}

- (void)interstitialWillPresentScreen:(GADInterstitialAd *)ad {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidOpen body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)interstitialDidDismissScreen:(GADInterstitialAd *)ad {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidClose body:nil];
}

- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

@end
