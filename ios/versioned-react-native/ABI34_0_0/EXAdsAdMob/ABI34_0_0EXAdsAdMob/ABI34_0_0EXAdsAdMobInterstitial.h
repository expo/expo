#import <ABI34_0_0UMCore/ABI34_0_0UMDefines.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMEventEmitter.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI34_0_0EXAdsAdMobInterstitial : ABI34_0_0UMExportedModule <ABI34_0_0UMEventEmitter, ABI34_0_0UMModuleRegistryConsumer, GADInterstitialDelegate>
@end
