#import <UMCore/UMDefines.h>
#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EXAdsAdMobRewarded : UMExportedModule <UMEventEmitter, UMModuleRegistryConsumer, GADRewardedAdDelegate>
@end
