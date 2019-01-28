#import <FBAudienceNetwork/FBNativeAd.h>
#import <React/RCTView.h>
#import <React/RCTBridge.h>
#import <React/RCTComponent.h>

@interface EXNativeAdView : RCTView

// `onAdLoaded` event called when ad has been loaded
@property (nonatomic, copy) RCTBubblingEventBlock onAdLoaded;

// NativeAd this view has been loaded with
@property (nonatomic, strong) FBNativeAd *nativeAd;

- (instancetype)initWithBridge:(RCTBridge *)bridge;
- (void)registerViewsForInteraction:(FBMediaView *)mediaView adIcon:(FBAdIconView *)adIconView clickableViews:(NSArray<UIView *> *)clickable;

@end
