#import "ABI30_0_0EXNativeAdView.h"
#import "ABI30_0_0EXUtil.h"
#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUtils.h>

@interface ABI30_0_0EXNativeAdView ()

@property (nonatomic, strong) ABI30_0_0RCTBridge *bridge;

@end

@implementation ABI30_0_0EXNativeAdView

- (instancetype)initWithBridge:(ABI30_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)setOnAdLoaded:(ABI30_0_0RCTBubblingEventBlock)onAdLoaded
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
