#import <EXAdsFacebook/EXNativeAdView.h>
#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <UMCore/UMUtilitiesInterface.h>

@interface EXNativeAdView ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXNativeAdView

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

- (void)setOnAdLoaded:(UMDirectEventBlock)onAdLoaded
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
                                       viewController:[[strongSelf.moduleRegistry getModuleImplementingProtocol:@protocol(UMUtilitiesInterface)] currentViewController]
                                       clickableViews:clickable];
    }
  });
}

@end
