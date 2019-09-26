#import <UMCore/UMDefines.h>
#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EXAdsAdMobInterstitial : UMExportedModule <UMEventEmitter, UMModuleRegistryConsumer, GADInterstitialDelegate>
@end
