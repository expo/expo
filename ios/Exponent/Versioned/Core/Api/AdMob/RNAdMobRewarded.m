#import "RNAdMobRewarded.h"

static NSString *const EXAdMobRewardedDidRewardUser = @"rewardedVideoDidRewardUser";
static NSString *const EXAdMobRewardedDidLoad = @"rewardedVideoDidLoad";
static NSString *const EXAdMobRewardedDidFailToLoad = @"rewardedVideoDidFailToLoad";
static NSString *const EXAdMobRewardedDidOpen = @"rewardedVideoDidOpen";
static NSString *const EXAdMobRewardedDidStart = @"rewardedVideoDidStart";
static NSString *const EXAdMobRewardedDidClose = @"rewardedVideoDidClose";
static NSString *const EXAdMobRewardedWillLeaveApplication = @"rewardedVideoWillLeaveApplication";

@implementation RNAdMobRewarded {
  NSString *_adUnitID;
  NSString *_testDeviceID;
  BOOL _hasListeners;
  RCTPromiseResolveBlock _requestAdResolver;
  RCTPromiseRejectBlock _requestAdRejecter;
  RCTPromiseResolveBlock _showAdResolver;
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
           EXAdMobRewardedDidRewardUser,
           EXAdMobRewardedDidLoad,
           EXAdMobRewardedDidFailToLoad,
           EXAdMobRewardedDidOpen,
           EXAdMobRewardedDidStart,
           EXAdMobRewardedDidClose,
           EXAdMobRewardedWillLeaveApplication,
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

RCT_EXPORT_METHOD(showAd:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
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

RCT_EXPORT_METHOD(dismissAd:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
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

RCT_EXPORT_METHOD(getIsReady:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([NSNumber numberWithBool:[[GADRewardBasedVideoAd sharedInstance] isReady]]);
}


# pragma mark - GADInterstitialDelegate

- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd didRewardUserWithReward:(GADAdReward *)reward {
  [self _maybeSendEventWithName:EXAdMobRewardedDidRewardUser body:@{ @"type": reward.type, @"amount": reward.amount }];
}

- (void)rewardBasedVideoAdDidReceiveAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:EXAdMobRewardedDidLoad body:nil];
  _requestAdResolver(nil);
  [self _cleanupRequestAdPromise];
}

- (void)rewardBasedVideoAdDidOpen:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:EXAdMobRewardedDidOpen body:nil];
  _showAdResolver(nil);
  _showAdResolver = nil;
}

- (void)rewardBasedVideoAdDidStartPlaying:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:EXAdMobRewardedDidStart body:nil];
}

- (void)rewardBasedVideoAdDidClose:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:EXAdMobRewardedDidClose body:nil];
}

- (void)rewardBasedVideoAdWillLeaveApplication:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
  [self _maybeSendEventWithName:EXAdMobRewardedWillLeaveApplication body:nil];
}

- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd didFailToLoadWithError:(NSError *)error {
  [self _maybeSendEventWithName:EXAdMobRewardedDidFailToLoad body:@{ @"name": [error description] }];
  _requestAdRejecter(@"E_AD_REQUEST_FAILED", [error description], error);
  [self _cleanupRequestAdPromise];
}

- (void)_cleanupRequestAdPromise
{
  _requestAdResolver = nil;
  _requestAdRejecter = nil;
}

@end
