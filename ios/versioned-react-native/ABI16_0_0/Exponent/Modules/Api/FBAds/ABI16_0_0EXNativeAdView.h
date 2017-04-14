#import <FBAudienceNetwork/FBNativeAd.h>
#import <ReactABI16_0_0/ABI16_0_0RCTView.h>
#import <ReactABI16_0_0/ABI16_0_0RCTComponent.h>

@interface ABI16_0_0EXNativeAdView : ABI16_0_0RCTView

// `onAdLoaded` event called when ad has been loaded
@property (nonatomic, copy) ABI16_0_0RCTBubblingEventBlock onAdLoaded;

// NativeAd this view has been loaded with
@property (nonatomic, strong) FBNativeAd* nativeAd;

@end
