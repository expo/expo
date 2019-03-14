#import <EXAdsFacebook/EXBannerView.h>
#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <UMCore/UMUtilitiesInterface.h>

@interface EXBannerView () <FBAdViewDelegate>

@property (nonatomic, strong) FBAdView *adView;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXBannerView

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

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
  UIViewController *rootViewController = [[_moduleRegistry getModuleImplementingProtocol:@protocol(UMUtilitiesInterface)] currentViewController];
  FBAdView *adView = [[FBAdView alloc] initWithPlacementID:_placementId
                                                    adSize:fbAdSize
                                        rootViewController:rootViewController];
  
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
    _onAdError(@{ @"message": error.description, @"userInfo": error.userInfo });
  } else {
    UMLogError(@"%@: %@", error.localizedDescription, error.userInfo);
  }
}

- (void)adViewDidFinishHandlingClick:(FBAdView *)adView {}
- (void)adViewWillLogImpression:(FBAdView *)adView {}

@end
