#import <ABI31_0_0EXCore/ABI31_0_0EXDefines.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXEventEmitter.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI31_0_0EXAdsAdMobInterstitial : ABI31_0_0EXExportedModule <ABI31_0_0EXEventEmitter, ABI31_0_0EXModuleRegistryConsumer, GADInterstitialDelegate>
@end
