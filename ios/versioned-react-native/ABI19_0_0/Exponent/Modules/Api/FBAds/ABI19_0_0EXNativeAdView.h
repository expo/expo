#import <FBAudienceNetwork/FBNativeAd.h>
#import <ReactABI19_0_0/ABI19_0_0RCTView.h>
#import <ReactABI19_0_0/ABI19_0_0RCTComponent.h>

@interface ABI19_0_0EXNativeAdView : ABI19_0_0RCTView

// `onAdLoaded` event called when ad has been loaded
@property (nonatomic, copy) ABI19_0_0RCTBubblingEventBlock onAdLoaded;

// NativeAd this view has been loaded with
@property (nonatomic, strong) FBNativeAd* nativeAd;

@end
