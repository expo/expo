#import <EXCore/EXDefines.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EXAdsAdMobInterstitial : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer, GADInterstitialDelegate>
@end
