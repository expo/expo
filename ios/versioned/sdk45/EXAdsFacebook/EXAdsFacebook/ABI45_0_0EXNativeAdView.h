#import <FBAudienceNetwork/FBNativeAd.h>
#import <UIKit/UIKit.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXDefines.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistry.h>

@interface ABI45_0_0EXNativeAdView : UIView

// `onAdLoaded` event called when ad has been loaded
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onAdLoaded;

// NativeAd this view has been loaded with
@property (nonatomic, strong) FBNativeAd *nativeAd;

- (instancetype)initWithModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry;
- (void)registerViewsForInteraction:(FBMediaView *)mediaView adIcon:(FBAdIconView *)adIconView clickableViews:(NSArray<UIView *> *)clickable;

@end
