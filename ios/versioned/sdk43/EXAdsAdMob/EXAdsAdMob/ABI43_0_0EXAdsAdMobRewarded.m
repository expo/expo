#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUIManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitterService.h>
#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsAdMobRewarded.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilitiesInterface.h>

static NSString *const ABI43_0_0EXAdsAdMobRewardedUserDidEarnReward = @"rewardedVideoUserDidEarnReward";
static NSString *const ABI43_0_0EXAdsAdMobRewardedDidLoad = @"rewardedVideoDidLoad";
static NSString *const ABI43_0_0EXAdsAdMobRewardedDidFailToLoad = @"rewardedVideoDidFailToLoad";
static NSString *const ABI43_0_0EXAdsAdMobRewardedDidPresent = @"rewardedVideoDidPresent";
static NSString *const ABI43_0_0EXAdsAdMobRewardedDidFailToPresent = @"rewardedVideoDidFailToPresent";
static NSString *const ABI43_0_0EXAdsAdMobRewardedDidDismiss = @"rewardedVideoDidDismiss";

@interface ABI43_0_0EXAdsAdMobRewarded ()

@property (nonatomic, weak) id<ABI43_0_0EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI43_0_0EXUtilitiesInterface> utilities;
@property (nonatomic, strong) GADRewardedAd *ad;

@end

@implementation ABI43_0_0EXAdsAdMobRewarded {
  NSString *_adUnitID;
  BOOL _hasListeners;
  ABI43_0_0EXPromiseResolveBlock _requestAdResolver;
  ABI43_0_0EXPromiseRejectBlock _requestAdRejecter;
  ABI43_0_0EXPromiseResolveBlock _showAdResolver;
  ABI43_0_0EXPromiseRejectBlock _showAdRejecter;
}

ABI43_0_0EX_EXPORT_MODULE(ExpoAdsAdMobRewardedVideoAdManager);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUtilitiesInterface)];
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    ABI43_0_0EXAdsAdMobRewardedUserDidEarnReward,
    ABI43_0_0EXAdsAdMobRewardedDidLoad,
    ABI43_0_0EXAdsAdMobRewardedDidFailToLoad,
    ABI43_0_0EXAdsAdMobRewardedDidPresent,
    ABI43_0_0EXAdsAdMobRewardedDidFailToPresent,
    ABI43_0_0EXAdsAdMobRewardedDidDismiss,
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
  if (_requestAdRejecter == nil) {
    _requestAdResolver = resolve;
    _requestAdRejecter = reject;

    GADRequest *request = [GADRequest request];
    if (additionalRequestParams) {
      GADExtras *extras = [[GADExtras alloc] init];
      extras.additionalParameters = additionalRequestParams;
      [request registerAdNetworkExtras:extras];
    }

    ABI43_0_0EX_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI43_0_0EX_ENSURE_STRONGIFY(self);
      [GADRewardedAd loadWithAdUnitID:self->_adUnitID
                              request:request
                    completionHandler:^(GADRewardedAd *ad, NSError *error) {
        ABI43_0_0EX_ENSURE_STRONGIFY(self);
        if (error) {
          [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobRewardedDidFailToLoad
                                   body:@{ @"name": [error description] }];
          self->_requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
          [self cleanupRequestAdPromise];
          return;
        }
        self.ad = ad;
        self.ad.fullScreenContentDelegate = self;

        [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobRewardedDidLoad body:nil];
        self->_requestAdResolver(nil);
        [self cleanupRequestAdPromise];
      }];
    });
  } else {
    reject(@"E_AD_REQUESTING", @"An ad is already being requested, await the previous promise.", nil);
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(showAd,
                    showAd:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if (_showAdResolver == nil && self.ad) {
    _showAdResolver = resolve;
    ABI43_0_0EX_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI43_0_0EX_ENSURE_STRONGIFY(self);
      [self.ad presentFromRootViewController:self.utilities.currentViewController
                    userDidEarnRewardHandler:^{
        ABI43_0_0EX_ENSURE_STRONGIFY(self);
        GADAdReward *reward = self.ad.adReward;
        [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobRewardedUserDidEarnReward
                                 body:@{ @"type": reward.type, @"amount": reward.amount }];
      }];
    });
  } else if (self.ad) {
    reject(@"E_AD_BEING_SHOWN", @"Ad is already being shown, await the previous promise.", nil);
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
    if (presentedViewController != nil && [NSStringFromClass([presentedViewController class]) isEqualToString:@"GADInterstitialViewController"]) {
      [presentedViewController dismissViewControllerAnimated:true completion:^{
        resolve(nil);
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
  resolve([NSNumber numberWithBool:self.ad != nil]);
}


- (void)cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

#pragma mark - GADFullscreenContentDelegate

- (void)adDidPresentFullScreenContent:(id)ad
{
  [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobRewardedDidPresent body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)ad:(id)ad
    didFailToPresentFullScreenContentWithError:(NSError *)error
{
  [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobRewardedDidFailToPresent
                           body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self cleanupRequestAdPromise];
}

- (void)adDidDismissFullScreenContent:(id)ad
{
  [self _maybeSendEventWithName:ABI43_0_0EXAdsAdMobRewardedDidDismiss body:nil];
}

@end
