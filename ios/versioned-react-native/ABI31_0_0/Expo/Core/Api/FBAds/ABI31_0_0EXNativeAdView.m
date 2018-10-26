#import "ABI31_0_0EXNativeAdView.h"
#import "ABI31_0_0EXUtil.h"
#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUtils.h>

@interface ABI31_0_0EXNativeAdView ()

@property (nonatomic, strong) ABI31_0_0RCTBridge *bridge;

@end

@implementation ABI31_0_0EXNativeAdView

- (instancetype)initWithBridge:(ABI31_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)setOnAdLoaded:(ABI31_0_0RCTBubblingEventBlock)onAdLoaded
{
  _onAdLoaded = onAdLoaded;
  
  if (_nativeAd != nil) {
    [self callOnAdLoadedWithAd:_nativeAd];
  }
}

- (void)setNativeAd:(FBNativeAd *)nativeAd
{
  _nativeAd = nativeAd;
  [self callOnAdLoadedWithAd:_nativeAd];
}

- (void)callOnAdLoadedWithAd:(FBNativeAd *)nativeAd
{
  if (_onAdLoaded != nil) {
    _onAdLoaded(@{
                  @"headline": nativeAd.headline,
                  @"linkDescription": nativeAd.linkDescription,
                  @"advertiserName": nativeAd.advertiserName,
                  @"socialContext": nativeAd.socialContext,
                  @"callToActionText": nativeAd.callToAction,
                  @"bodyText": nativeAd.bodyText,
                  // TODO: Remove this deprecated field (in lieu of adTranslation) in SDK 32+
                  @"translation": nativeAd.adTranslation,
                  @"adTranslation": nativeAd.adTranslation,
                  @"promotedTranslation": nativeAd.promotedTranslation,
                  @"sponsoredTranslation": nativeAd.sponsoredTranslation,
                  });
  }
}

- (void)registerViewsForInteraction:(FBMediaView *)mediaView adIcon:(FBAdIconView *)adIconView clickableViews:(NSArray<UIView *> *)clickable
{
  [_nativeAd registerViewForInteraction:self
                                  mediaView:mediaView
                                   iconView:adIconView
                             viewController:_bridge.scopedModules.util.currentViewController
                             clickableViews:clickable];
}

@end
