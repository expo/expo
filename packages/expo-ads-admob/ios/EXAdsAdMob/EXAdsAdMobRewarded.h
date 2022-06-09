#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EXAdsAdMobRewarded : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer, GADFullScreenContentDelegate>
@end
