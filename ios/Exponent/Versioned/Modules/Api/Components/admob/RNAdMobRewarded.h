#import <React/RCTEventDispatcher.h>
#import <React/RCTBridgeModule.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface RNAdMobRewarded : NSObject <RCTBridgeModule, GADRewardBasedVideoAdDelegate>
@end
