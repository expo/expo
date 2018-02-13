#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface RNAdMobRewarded : RCTEventEmitter <RCTBridgeModule, GADRewardBasedVideoAdDelegate>
@end
