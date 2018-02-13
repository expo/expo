#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface RNAdMobInterstitial : RCTEventEmitter <RCTBridgeModule, GADInterstitialDelegate>
@end
