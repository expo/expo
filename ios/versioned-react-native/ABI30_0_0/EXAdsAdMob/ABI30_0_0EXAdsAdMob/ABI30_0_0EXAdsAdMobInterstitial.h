#import <ABI30_0_0EXCore/ABI30_0_0EXDefines.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitter.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI30_0_0EXAdsAdMobInterstitial : ABI30_0_0EXExportedModule <ABI30_0_0EXEventEmitter, ABI30_0_0EXModuleRegistryConsumer, GADInterstitialDelegate>
@end
