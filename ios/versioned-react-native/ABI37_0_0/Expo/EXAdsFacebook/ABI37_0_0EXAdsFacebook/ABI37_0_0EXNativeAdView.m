#import <ABI37_0_0EXAdsFacebook/ABI37_0_0EXNativeAdView.h>
#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUtilitiesInterface.h>

@interface ABI37_0_0EXNativeAdView ()

@property (nonatomic, weak) ABI37_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI37_0_0EXNativeAdView

- (instancetype)initWithModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (void)setOnAdLoaded:(ABI37_0_0UMDirectEventBlock)onAdLoaded
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
                                       viewController:[[strongSelf.moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMUtilitiesInterface)] currentViewController]
                                       clickableViews:clickable];
    }
  });
}

@end
