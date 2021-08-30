#import <ABI41_0_0UMCore/ABI41_0_0UMUIManager.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitterService.h>
#import <ABI41_0_0EXAdsAdMob/ABI41_0_0EXAdsAdMobRewarded.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilitiesInterface.h>

static NSString *const ABI41_0_0EXAdsAdMobRewardedUserDidEarnReward = @"rewardedVideoUserDidEarnReward";
static NSString *const ABI41_0_0EXAdsAdMobRewardedDidLoad = @"rewardedVideoDidLoad";
static NSString *const ABI41_0_0EXAdsAdMobRewardedDidFailToLoad = @"rewardedVideoDidFailToLoad";
static NSString *const ABI41_0_0EXAdsAdMobRewardedDidPresent = @"rewardedVideoDidPresent";
static NSString *const ABI41_0_0EXAdsAdMobRewardedDidFailToPresent = @"rewardedVideoDidFailToPresent";
static NSString *const ABI41_0_0EXAdsAdMobRewardedDidDismiss = @"rewardedVideoDidDismiss";

@interface ABI41_0_0EXAdsAdMobRewarded ()

@property (nonatomic, weak) id<ABI41_0_0UMEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI41_0_0UMUtilitiesInterface> utilities;
@property (nonatomic, strong) GADRewardedAd *rewardedAd;

@end

@implementation ABI41_0_0EXAdsAdMobRewarded {
  NSString *_adUnitID;
  BOOL _hasListeners;
  ABI41_0_0UMPromiseResolveBlock _requestAdResolver;
  ABI41_0_0UMPromiseRejectBlock _requestAdRejecter;
  ABI41_0_0UMPromiseResolveBlock _showAdResolver;
}

ABI41_0_0UM_EXPORT_MODULE(ExpoAdsAdMobRewardedVideoAdManager);

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMUtilitiesInterface)];
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    ABI41_0_0EXAdsAdMobRewardedUserDidEarnReward,
    ABI41_0_0EXAdsAdMobRewardedDidLoad,
    ABI41_0_0EXAdsAdMobRewardedDidFailToLoad,
    ABI41_0_0EXAdsAdMobRewardedDidPresent,
    ABI41_0_0EXAdsAdMobRewardedDidFailToPresent,
    ABI41_0_0EXAdsAdMobRewardedDidDismiss,
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

ABI41_0_0UM_EXPORT_METHOD_AS(setAdUnitID,
                    setAdUnitID:(NSString *)adUnitID
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  _adUnitID = adUnitID;
  resolve(nil);
}

ABI41_0_0UM_EXPORT_METHOD_AS(requestAd,
                    requestAdWithAdditionalRequestParams:(NSDictionary *)additionalRequestParams
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  if (_requestAdRejecter == nil) {
    _requestAdResolver = resolve;
    _requestAdRejecter = reject;
    
    self.rewardedAd = [[GADRewardedAd alloc] initWithAdUnitID:_adUnitID];
    GADRequest *request = [GADRequest request];
    if (additionalRequestParams) {
      GADExtras *extras = [[GADExtras alloc] init];
      extras.additionalParameters = additionalRequestParams;
      [request registerAdNetworkExtras:extras];
    }
    ABI41_0_0UM_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI41_0_0UM_ENSURE_STRONGIFY(self);
      [self.rewardedAd loadRequest:request
                 completionHandler:^(GADRequestError * _Nullable error) {
        ABI41_0_0UM_ENSURE_STRONGIFY(self);
        if (error) {
          [self _maybeSendEventWithName:ABI41_0_0EXAdsAdMobRewardedDidFailToLoad
                                   body:@{ @"name": [error description] }];
          self->_requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
          [self _cleanupRequestAdPromise];
        } else {
          [self _maybeSendEventWithName:ABI41_0_0EXAdsAdMobRewardedDidLoad body:nil];
          self->_requestAdResolver(nil);
          [self _cleanupRequestAdPromise];
        }
      }];
    });
  } else {
    reject(@"E_AD_REQUESTING", @"An ad is already being requested, await the previous promise.", nil);
  }
}

ABI41_0_0UM_EXPORT_METHOD_AS(showAd,
                    showAd:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  if (_showAdResolver == nil && self.rewardedAd.isReady) {
    _showAdResolver = resolve;
    ABI41_0_0UM_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI41_0_0UM_ENSURE_STRONGIFY(self);
      [self.rewardedAd presentFromRootViewController:self.utilities.currentViewController delegate:self];
    });
  } else if (self.rewardedAd.isReady) {
    reject(@"E_AD_BEING_SHOWN", @"Ad is already being shown, await the previous promise.", nil);
  } else {
    reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
  }
}

ABI41_0_0UM_EXPORT_METHOD_AS(dismissAd,
                    dismissAd:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  ABI41_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
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

ABI41_0_0UM_EXPORT_METHOD_AS(getIsReady,
                    getIsReady:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  resolve([NSNumber numberWithBool:self.rewardedAd.isReady]);
}


- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

- (void)rewardedAd:(GADRewardedAd *)rewardedAd userDidEarnReward:(GADAdReward *)reward {
  [self _maybeSendEventWithName:ABI41_0_0EXAdsAdMobRewardedUserDidEarnReward
                           body:@{ @"type": reward.type, @"amount": reward.amount }];
}

- (void)rewardedAdDidPresent:(GADRewardedAd *)rewardedAd {
  [self _maybeSendEventWithName:ABI41_0_0EXAdsAdMobRewardedDidPresent body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)rewardedAd:(GADRewardedAd *)rewardedAd didFailToPresentWithError:(NSError *)error
{
  [self _maybeSendEventWithName:ABI41_0_0EXAdsAdMobRewardedDidFailToPresent
                           body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self _cleanupRequestAdPromise];
}

- (void)rewardedAdDidDismiss:(GADRewardedAd *)rewardedAd {
  [self _maybeSendEventWithName:ABI41_0_0EXAdsAdMobRewardedDidDismiss body:nil];
}

@end

