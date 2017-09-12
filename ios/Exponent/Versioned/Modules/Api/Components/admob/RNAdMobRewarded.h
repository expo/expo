#import <React/RCTEventDispatcher.h>
#import <React/RCTBridgeModule.h>

@import GoogleMobileAds;

@interface RNAdMobRewarded : NSObject <RCTBridgeModule, GADRewardBasedVideoAdDelegate>
@end
