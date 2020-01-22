#import <ABI36_0_0UMCore/ABI36_0_0UMDefines.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMEventEmitter.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI36_0_0EXAdsAdMobInterstitial : ABI36_0_0UMExportedModule <ABI36_0_0UMEventEmitter, ABI36_0_0UMModuleRegistryConsumer, GADInterstitialDelegate>
@end
