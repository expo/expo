#import <ABI42_0_0UMCore/ABI42_0_0UMDefines.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitter.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI42_0_0EXAdsAdMobInterstitial : ABI42_0_0UMExportedModule <ABI42_0_0UMEventEmitter, ABI42_0_0UMModuleRegistryConsumer, GADInterstitialDelegate>
@end
