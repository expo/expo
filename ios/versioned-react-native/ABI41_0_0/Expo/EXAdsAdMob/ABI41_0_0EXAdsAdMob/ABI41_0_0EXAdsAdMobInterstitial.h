#import <ABI41_0_0UMCore/ABI41_0_0UMDefines.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI41_0_0EXAdsAdMobInterstitial : ABI41_0_0UMExportedModule <ABI41_0_0UMEventEmitter, ABI41_0_0UMModuleRegistryConsumer, GADInterstitialDelegate>
@end
