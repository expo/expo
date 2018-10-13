#import <EXCore/EXDefines.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EXAdsAdMobRewarded : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer, GADRewardBasedVideoAdDelegate>
@end
