#import <ABI32_0_0EXCore/ABI32_0_0EXDefines.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXEventEmitter.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI32_0_0EXAdsAdMobInterstitial : ABI32_0_0EXExportedModule <ABI32_0_0EXEventEmitter, ABI32_0_0EXModuleRegistryConsumer, GADInterstitialDelegate>
@end
