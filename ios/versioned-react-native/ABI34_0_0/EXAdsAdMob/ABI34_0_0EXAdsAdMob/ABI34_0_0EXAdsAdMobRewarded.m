#import <ABI34_0_0UMCore/ABI34_0_0UMUIManager.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMEventEmitterService.h>
#import <ABI34_0_0EXAdsAdMob/ABI34_0_0EXAdsAdMobRewarded.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMUtilitiesInterface.h>

static NSString *const ABI34_0_0EXAdsAdMobRewardedDidRewardUser = @"rewardedVideoDidRewardUser";
static NSString *const ABI34_0_0EXAdsAdMobRewardedDidLoad = @"rewardedVideoDidLoad";
static NSString *const ABI34_0_0EXAdsAdMobRewardedDidFailToLoad = @"rewardedVideoDidFailToLoad";
static NSString *const ABI34_0_0EXAdsAdMobRewardedDidOpen = @"rewardedVideoDidOpen";
static NSString *const ABI34_0_0EXAdsAdMobRewardedDidStart = @"rewardedVideoDidStart";
static NSString *const ABI34_0_0EXAdsAdMobRewardedDidClose = @"rewardedVideoDidClose";
static NSString *const ABI34_0_0EXAdsAdMobRewardedWillLeaveApplication = @"rewardedVideoWillLeaveApplication";

@interface ABI34_0_0EXAdsAdMobRewarded ()

@property (nonatomic, weak) id<ABI34_0_0UMEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI34_0_0UMUtilitiesInterface> utilities;

@end

@implementation ABI34_0_0EXAdsAdMobRewarded {
  NSString *_adUnitID;
  NSString *_testDeviceID;
  BOOL _hasListeners;
  ABI34_0_0UMPromiseResolveBlock _requestAdResolver;
  ABI34_0_0UMPromiseRejectBlock _requestAdRejecter;
  ABI34_0_0UMPromiseResolveBlock _showAdResolver;
}

ABI34_0_0UM_EXPORT_MODULE(ExpoAdsAdMobRewardedVideoAdManager);

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMUtilitiesInterface)];
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           ABI34_0_0EXAdsAdMobRewardedDidRewardUser,
           ABI34_0_0EXAdsAdMobRewardedDidLoad,
           ABI34_0_0EXAdsAdMobRewardedDidFailToLoad,
           ABI34_0_0EXAdsAdMobRewardedDidOpen,
           ABI34_0_0EXAdsAdMobRewardedDidStart,
           ABI34_0_0EXAdsAdMobRewardedDidClose,
           ABI34_0_0EXAdsAdMobRewardedWillLeaveApplication,
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

ABI34_0_0UM_EXPORT_METHOD_AS(setAdUnitID,
                    setAdUnitID:(NSString *)adUnitID
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  _adUnitID = adUnitID;
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(setTestDeviceID,
                    setTestDeviceID:(NSString *)testDeviceID
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  _testDeviceID = testDeviceID;
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(requestAd,
                    requestAd:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_requestAdRejecter == nil) {
    _requestAdResolver = resolve;
    _requestAdRejecter = reject;
    [GADRewardBasedVideoAd sharedInstance].delegate = self;
    GADRequest *request = [GADRequest request];
    if (_testDeviceID) {
      if ([_testDeviceID isEqualToString:@"EMULATOR"]) {
        request.testDevices = @[kGADSimulatorID];
      } else {
        request.testDevices = @[_testDeviceID];
      }
    }
    ABI34_0_0UM_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI34_0_0UM_ENSURE_STRONGIFY(self);
      [[GADRewardBasedVideoAd sharedInstance] loadRequest:request
                                             withAdUnitID:self->_adUnitID];
    });
  } else {
    reject(@"E_AD_REQUESTING", @"An ad is already being requested, await the previous promise.", nil);
  }
}

ABI34_0_0UM_EXPORT_METHOD_AS(showAd,
                    showAd:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_showAdResolver == nil && [[GADRewardBasedVideoAd sharedInstance] isReady]) {
    _showAdResolver = resolve;
    ABI34_0_0UM_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI34_0_0UM_ENSURE_STRONGIFY(self);
      [[GADRewardBasedVideoAd sharedInstance] presentFromRootViewController:self.utilities.currentViewController];
    });
  } else if ([[GADRewardBasedVideoAd sharedInstance] isReady]) {
    reject(@"E_AD_BEING_SHOWN", @"Ad is already being shown, await the previous promise.", nil);
  } else {
    reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
  }
}

ABI34_0_0UM_EXPORT_METHOD_AS(dismissAd,
                    dismissAd:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  ABI34_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI34_0_0UM_ENSURE_STRONGIFY(self);
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

ABI34_0_0UM_EXPORT_METHOD_AS(getIsReady,
                    getIsReady:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  resolve([NSNumber numberWithBool:[[GADRewardBasedVideoAd sharedInstance] isReady]]);
}


- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd didRewardUserWithReward:(GADAdReward *)reward {
  [self _maybeSendEventWithName:ABI34_0_0EXAdsAdMobRewardedDidRewardUser body:@{ @"type": reward.type, @"amount": reward.amount }];
}

- (void)rewardBasedVideoAdDidReceiveAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI34_0_0EXAdsAdMobRewardedDidLoad body:nil];
  _requestAdResolver(nil);
  [self _cleanupRequestAdPromise];
}

- (void)rewardBasedVideoAdDidOpen:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI34_0_0EXAdsAdMobRewardedDidOpen body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)rewardBasedVideoAdDidStartPlaying:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI34_0_0EXAdsAdMobRewardedDidStart body:nil];
}

- (void)rewardBasedVideoAdDidClose:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI34_0_0EXAdsAdMobRewardedDidClose body:nil];
}

- (void)rewardBasedVideoAdWillLeaveApplication:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI34_0_0EXAdsAdMobRewardedWillLeaveApplication body:nil];
}

- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd didFailToLoadWithError:(NSError *)error {
  [self _maybeSendEventWithName:ABI34_0_0EXAdsAdMobRewardedDidFailToLoad body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self _cleanupRequestAdPromise];
}

- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

@end
