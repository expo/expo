#import <ExpoModulesCore/EXUIManager.h>
#import <ExpoModulesCore/EXEventEmitterService.h>
#import <ExpoModulesCore/EXUtilitiesInterface.h>
#import <EXAdsAdMob/EXAdsAdMobInterstitial.h>

static NSString *const EXAdsAdMobInterstitialDidLoad = @"interstitialDidLoad";
static NSString *const EXAdsAdMobInterstitialDidFailToLoad = @"interstitialDidFailToLoad";
static NSString *const EXAdsAdMobInterstitialDidOpen = @"interstitialDidOpen";
static NSString *const EXAdsAdMobInterstitialDidClose = @"interstitialDidClose";
static NSString *const EXAdsAdMobInterstitialDidFailToOpen = @"interstitialDidFailToOpen";

@interface EXAdsAdMobInterstitial ()

@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<EXUtilitiesInterface> utilities;
@property (nonatomic, strong) GADInterstitialAd *ad;

@end

@implementation EXAdsAdMobInterstitial {
  NSString *_adUnitID;
  bool _hasListeners;
  EXPromiseResolveBlock _showAdResolver;
  EXPromiseRejectBlock _showAdRejecter;
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
    EXAdsAdMobInterstitialDidFailToOpen,
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
  EX_WEAKIFY(self)
  if (_ad) {
    dispatch_async(dispatch_get_main_queue(), ^{
      EX_ENSURE_STRONGIFY(self);

      NSError *error;
      if ([self.ad canPresentFromRootViewController:self.utilities.currentViewController error:&error]) {
        [self requestAdWithParams:additionalRequestParams
                         resolver:resolve
                         rejecter:reject];
      } else {
        reject(@"E_AD_CANNOT_PRESENT", @"Add cannot be presented", error);
      }
    });
  } else {
    [self requestAdWithParams:additionalRequestParams
                     resolver:resolve
                     rejecter:reject];
  }
}

- (void)requestAdWithParams:(NSDictionary *)additionalRequestParams
                   resolver:(EXPromiseResolveBlock)resolve
                   rejecter:(EXPromiseRejectBlock)reject
{
  _requestAdResolver = resolve;
  _requestAdRejecter = reject;
  
  
  GADRequest *request = [GADRequest request];
  if (additionalRequestParams) {
    GADExtras *extras = [[GADExtras alloc] init];
    extras.additionalParameters = additionalRequestParams;
    [request registerAdNetworkExtras:extras];
  }
  
  EX_WEAKIFY(self);
  [GADInterstitialAd loadWithAdUnitID:_adUnitID
                              request:request
                    completionHandler:^(GADInterstitialAd * _Nullable interstitialAd,
                                        NSError * _Nullable error) {
    EX_ENSURE_STRONGIFY(self);
  
    if (error) {
      [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidFailToLoad body:@{ @"name": [error description] }];
      self->_requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
      [self cleanupRequestAdPromise];
      return;
    }
    
    self.ad = interstitialAd;
    self.ad.fullScreenContentDelegate = self;
    
    [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidLoad body:nil];
    self->_requestAdResolver(nil);
    [self cleanupRequestAdPromise];
  }];
  
}

EX_EXPORT_METHOD_AS(showAd,
                    showAd:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_ad && _showAdResolver == nil) {
    _showAdResolver = resolve;
    _showAdRejecter = reject;
    EX_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      EX_ENSURE_STRONGIFY(self);
      [self.ad presentFromRootViewController:self.utilities.currentViewController];
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
    if (presentedViewController != nil && [NSStringFromClass([presentedViewController class]) hasPrefix:@"GAD"]) {
      [presentedViewController dismissViewControllerAnimated:true completion:^{
        EX_ENSURE_STRONGIFY(self);
        self.ad = nil;
        resolve(nil);
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
  resolve([NSNumber numberWithBool:_ad != nil]);
}

- (void)cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

- (void)cleanupShowAdPromise
{
  _showAdResolver = nil;
  _showAdRejecter = nil;
}

#pragma mark - GADFullScreenContentDelegate

- (void)adDidPresentFullScreenContent:(id)ad {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidOpen body:nil];
  _showAdResolver(nil);
  [self cleanupShowAdPromise];
  
}

- (void)ad:(id)ad didFailToPresentFullScreenContentWithError:(NSError *)error {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidFailToOpen body:nil];
  _showAdRejecter(@"E_AD_SHOW_FAILED", @"Ad failed to present full screen content", error);
  [self cleanupShowAdPromise];
}

- (void)adDidDismissFullScreenContent:(id)ad {
  [self _maybeSendEventWithName:EXAdsAdMobInterstitialDidClose body:nil];
}

@end
