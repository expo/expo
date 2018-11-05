#import "ABI29_0_0EXNativeAdView.h"
#import "ABI29_0_0EXUtil.h"
#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUtils.h>

@interface ABI29_0_0EXNativeAdView ()

@property (nonatomic, strong) ABI29_0_0RCTBridge *bridge;

@end

@implementation ABI29_0_0EXNativeAdView

- (instancetype)initWithBridge:(ABI29_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)setOnAdLoaded:(ABI29_0_0RCTBubblingEventBlock)onAdLoaded
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
                  @"advertiserName": nativeAd.advertiserName,
                  @"sponsoredTranslation": nativeAd.sponsoredTranslation,
                  @"bodyText": nativeAd.bodyText,
                  @"socialContext": nativeAd.socialContext,
                  @"callToActionText": nativeAd.callToAction,
                  @"translation": nativeAd.adTranslation,
                  @"linkDescription": nativeAd.linkDescription,
                  @"promotedTranslation": nativeAd.promotedTranslation,
                  @"headline": nativeAd.headline,
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
