#import "ABI28_0_0RNAdMobRewarded.h"

static NSString *const ABI28_0_0EXAdMobRewardedDidRewardUser = @"rewardedVideoDidRewardUser";
static NSString *const ABI28_0_0EXAdMobRewardedDidLoad = @"rewardedVideoDidLoad";
static NSString *const ABI28_0_0EXAdMobRewardedDidFailToLoad = @"rewardedVideoDidFailToLoad";
static NSString *const ABI28_0_0EXAdMobRewardedDidOpen = @"rewardedVideoDidOpen";
static NSString *const ABI28_0_0EXAdMobRewardedDidStart = @"rewardedVideoDidStart";
static NSString *const ABI28_0_0EXAdMobRewardedDidClose = @"rewardedVideoDidClose";
static NSString *const ABI28_0_0EXAdMobRewardedWillLeaveApplication = @"rewardedVideoWillLeaveApplication";

@implementation ABI28_0_0RNAdMobRewarded {
  NSString *_adUnitID;
  NSString *_testDeviceID;
  BOOL _hasListeners;
  ABI28_0_0RCTPromiseResolveBlock _requestAdResolver;
  ABI28_0_0RCTPromiseRejectBlock _requestAdRejecter;
  ABI28_0_0RCTPromiseResolveBlock _showAdResolver;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI28_0_0RCT_EXPORT_MODULE();

# pragma mark - ABI28_0_0RCTEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           ABI28_0_0EXAdMobRewardedDidRewardUser,
           ABI28_0_0EXAdMobRewardedDidLoad,
           ABI28_0_0EXAdMobRewardedDidFailToLoad,
           ABI28_0_0EXAdMobRewardedDidOpen,
           ABI28_0_0EXAdMobRewardedDidStart,
           ABI28_0_0EXAdMobRewardedDidClose,
           ABI28_0_0EXAdMobRewardedWillLeaveApplication,
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

# pragma mark - Exported methods, ReactABI28_0_0 API

ABI28_0_0RCT_EXPORT_METHOD(setAdUnitID:(NSString *)adUnitID)
{
  _adUnitID = adUnitID;
}

ABI28_0_0RCT_EXPORT_METHOD(setTestDeviceID:(NSString *)testDeviceID)
{
  _testDeviceID = testDeviceID;
}

ABI28_0_0RCT_EXPORT_METHOD(requestAd:(ABI28_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
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
    [[GADRewardBasedVideoAd sharedInstance] loadRequest:request
                                           withAdUnitID:_adUnitID];
  } else {
    reject(@"E_AD_REQUESTING", @"An ad is already being requested, await the previous promise.", nil);
  }
}

ABI28_0_0RCT_EXPORT_METHOD(showAd:(ABI28_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  if (_showAdResolver == nil && [[GADRewardBasedVideoAd sharedInstance] isReady]) {
    _showAdResolver = resolve;
    [[GADRewardBasedVideoAd sharedInstance] presentFromRootViewController:[UIApplication sharedApplication].delegate.window.rootViewController];
  } else if ([[GADRewardBasedVideoAd sharedInstance] isReady]) {
    reject(@"E_AD_BEING_SHOWN", @"Ad is already being shown, await the previous promise.", nil);
  } else {
    reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
  }
}

ABI28_0_0RCT_EXPORT_METHOD(dismissAd:(ABI28_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  UIViewController *presentedViewController = [UIApplication sharedApplication].delegate.window.rootViewController.presentedViewController;
  if (presentedViewController != nil && [NSStringFromClass([presentedViewController class]) isEqualToString:@"GADInterstitialViewController"]) {
    [[UIApplication sharedApplication].delegate.window.rootViewController dismissViewControllerAnimated:true completion:^{
      resolve(nil);
    }];
  } else {
    reject(@"E_AD_NOT_SHOWN", @"Ad is not being shown.", nil);
  }
}

ABI28_0_0RCT_EXPORT_METHOD(getIsReady:(ABI28_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  resolve([NSNumber numberWithBool:[[GADRewardBasedVideoAd sharedInstance] isReady]]);
}


# pragma mark - GADInterstitialDelegate

- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd didRewardUserWithReward:(GADAdReward *)reward {
  [self _maybeSendEventWithName:ABI28_0_0EXAdMobRewardedDidRewardUser body:@{ @"type": reward.type, @"amount": reward.amount }];
}

- (void)rewardBasedVideoAdDidReceiveAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI28_0_0EXAdMobRewardedDidLoad body:nil];
  _requestAdResolver(nil);
  [self _cleanupRequestAdPromise];
}

- (void)rewardBasedVideoAdDidOpen:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI28_0_0EXAdMobRewardedDidOpen body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)rewardBasedVideoAdDidStartPlaying:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI28_0_0EXAdMobRewardedDidStart body:nil];
}

- (void)rewardBasedVideoAdDidClose:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI28_0_0EXAdMobRewardedDidClose body:nil];
}

- (void)rewardBasedVideoAdWillLeaveApplication:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:ABI28_0_0EXAdMobRewardedWillLeaveApplication body:nil];
}

- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd didFailToLoadWithError:(NSError *)error {
  [self _maybeSendEventWithName:ABI28_0_0EXAdMobRewardedDidFailToLoad body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self _cleanupRequestAdPromise];
}

- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

@end
