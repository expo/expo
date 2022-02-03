#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDefines.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI43_0_0EXAdsAdMobInterstitial : ABI43_0_0EXExportedModule <ABI43_0_0EXEventEmitter, ABI43_0_0EXModuleRegistryConsumer, GADInterstitialDelegate>
@end
