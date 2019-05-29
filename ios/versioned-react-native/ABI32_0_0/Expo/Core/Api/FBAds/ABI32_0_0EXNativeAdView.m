#import "ABI32_0_0EXNativeAdView.h"
#import "ABI32_0_0EXUtil.h"
#import <ReactABI32_0_0/ABI32_0_0RCTUtils.h>

@import FBAudienceNetwork;

@interface ABI32_0_0EXNativeAdView ()

@property (nonatomic, strong) ABI32_0_0RCTBridge *bridge;

@end

@implementation ABI32_0_0EXNativeAdView

- (instancetype)initWithBridge:(ABI32_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)setOnAdLoaded:(ABI32_0_0RCTBubblingEventBlock)onAdLoaded
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
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.nativeAd registerViewForInteraction:strongSelf
                                            mediaView:mediaView
                                             iconView:adIconView
                                       viewController:strongSelf.bridge.scopedModules.util.currentViewController
                                       clickableViews:clickable];
    }
  });
}

@end
