#import "EXNativeAdView.h"
#import "EXUtil.h"
#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <React/RCTUtils.h>

@interface EXNativeAdView ()

@property (nonatomic, strong) RCTBridge *bridge;

@end

@implementation EXNativeAdView

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)setOnAdLoaded:(RCTBubblingEventBlock)onAdLoaded
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
