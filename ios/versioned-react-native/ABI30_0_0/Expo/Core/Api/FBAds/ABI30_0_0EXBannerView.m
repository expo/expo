#import "ABI30_0_0EXBannerView.h"

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUtils.h>

@interface ABI30_0_0EXBannerView () <FBAdViewDelegate>

@property (nonatomic, strong) FBAdView *adView;

@end

@implementation ABI30_0_0EXBannerView

- (void)setSize:(NSNumber *)size
{
  _size = size;
  [self createViewIfCan];
}

- (void)setPlacementId:(NSString *)placementId
{
  _placementId = placementId;
  [self createViewIfCan];
}

// Initialise BannerAdView as soon as all the props are set
- (void)createViewIfCan
{
  if (!_placementId || !_size) {
    return;
  }
  
  if (_adView) {
    [_adView removeFromSuperview];
  }
  
  FBAdSize fbAdSize = [self fbAdSizeForHeight:_size];
  
  FBAdView *adView = [[FBAdView alloc] initWithPlacementID:_placementId
                                                    adSize:fbAdSize
                                        rootViewController:ABI30_0_0RCTPresentedViewController()];
  
  adView.frame = CGRectMake(0, 20, adView.bounds.size.width, adView.bounds.size.height);
  adView.delegate = self;
  
  [adView loadAd];
  
  [self addSubview:adView];
  
  _adView = adView;
}

- (FBAdSize)fbAdSizeForHeight:(NSNumber *)height
{
  switch ([height intValue]) {
    case 90:
      return kFBAdSizeHeight90Banner;
    case 250:
      return kFBAdSizeHeight250Rectangle;
    case 50:
    default:
      return kFBAdSizeHeight50Banner;
  }
}

# pragma mark - FBAdViewDelegate

- (void)adViewDidClick:(FBAdView *)adView
{
  if (_onAdPress) {
    _onAdPress(nil);
  }
}

- (void)adView:(FBAdView *)adView didFailWithError:(NSError *)error
{
  if (_onAdError) {
    _onAdError(ABI30_0_0RCTJSErrorFromNSError(error));
  } else {
    ABI30_0_0RCTMakeAndLogError(error.localizedDescription, nil, error.userInfo);
  }
}

- (void)adViewDidFinishHandlingClick:(FBAdView *)adView {}
- (void)adViewWillLogImpression:(FBAdView *)adView {}

@end
