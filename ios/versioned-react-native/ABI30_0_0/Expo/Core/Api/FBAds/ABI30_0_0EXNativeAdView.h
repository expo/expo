#import <FBAudienceNetwork/FBNativeAd.h>
#import <ReactABI30_0_0/ABI30_0_0RCTView.h>
#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTComponent.h>

@interface ABI30_0_0EXNativeAdView : ABI30_0_0RCTView

// `onAdLoaded` event called when ad has been loaded
@property (nonatomic, copy) ABI30_0_0RCTBubblingEventBlock onAdLoaded;

// NativeAd this view has been loaded with
@property (nonatomic, strong) FBNativeAd *nativeAd;

- (instancetype)initWithBridge:(ABI30_0_0RCTBridge *)bridge;
- (void)registerViewsForInteraction:(FBMediaView *)mediaView adIcon:(FBAdIconView *)adIconView clickableViews:(NSArray<UIView *> *)clickable;

@end
