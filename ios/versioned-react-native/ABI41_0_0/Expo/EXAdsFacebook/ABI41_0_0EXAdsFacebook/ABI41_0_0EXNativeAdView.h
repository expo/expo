#import <FBAudienceNetwork/FBNativeAd.h>
#import <UIKit/UIKit.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMDefines.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>

@interface ABI41_0_0EXNativeAdView : UIView

// `onAdLoaded` event called when ad has been loaded
@property (nonatomic, copy) ABI41_0_0UMDirectEventBlock onAdLoaded;

// NativeAd this view has been loaded with
@property (nonatomic, strong) FBNativeAd *nativeAd;

- (instancetype)initWithModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry;
- (void)registerViewsForInteraction:(FBMediaView *)mediaView adIcon:(FBAdIconView *)adIconView clickableViews:(NSArray<UIView *> *)clickable;

@end
