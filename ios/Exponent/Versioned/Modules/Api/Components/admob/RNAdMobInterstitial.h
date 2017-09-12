#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcher.h>

@import GoogleMobileAds;

@interface RNAdMobInterstitial : NSObject <RCTBridgeModule, GADInterstitialDelegate>
@end
