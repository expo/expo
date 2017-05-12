#import <FBAudienceNetwork/FBNativeAd.h>
#import <ReactABI17_0_0/ABI17_0_0RCTView.h>
#import <ReactABI17_0_0/ABI17_0_0RCTComponent.h>

@interface ABI17_0_0EXNativeAdView : ABI17_0_0RCTView

// `onAdLoaded` event called when ad has been loaded
@property (nonatomic, copy) ABI17_0_0RCTBubblingEventBlock onAdLoaded;

// NativeAd this view has been loaded with
@property (nonatomic, strong) FBNativeAd* nativeAd;

@end
