#import <ABI33_0_0UMCore/ABI33_0_0UMDefines.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMEventEmitter.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI33_0_0EXAdsAdMobInterstitial : ABI33_0_0UMExportedModule <ABI33_0_0UMEventEmitter, ABI33_0_0UMModuleRegistryConsumer, GADInterstitialDelegate>
@end
