#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcher.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface RNAdMobInterstitial : NSObject <RCTBridgeModule, GADInterstitialDelegate>
@end
