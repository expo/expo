#import <ExpoModulesCore/EXEventEmitterService.h>
#import <EXAdsAdMob/EXAdsGAMBannerView.h>

@implementation EXAdsGAMBannerView {
  GAMBannerView *_bannerView;
  id<EXEventEmitterService> _eventEmitter;
}

- (GADAdSize)getAdSizeFromString:(NSString *)bannerSize {
  if ([bannerSize isEqualToString:@"banner"]) {
    return kGADAdSizeBanner;
  } else if ([bannerSize isEqualToString:@"largeBanner"]) {
    return kGADAdSizeLargeBanner;
  } else if ([bannerSize isEqualToString:@"mediumRectangle"]) {
    return kGADAdSizeMediumRectangle;
  } else if ([bannerSize isEqualToString:@"fullBanner"]) {
    return kGADAdSizeFullBanner;
  } else if ([bannerSize isEqualToString:@"leaderboard"]) {
    return kGADAdSizeLeaderboard;
  } else if ([bannerSize isEqualToString:@"smartBannerPortrait"]) {
    return kGADAdSizeSmartBannerPortrait;
  } else if ([bannerSize isEqualToString:@"smartBannerLandscape"]) {
    return kGADAdSizeSmartBannerLandscape;
  } else {
    return kGADAdSizeBanner;
  }
}

- (void)loadBanner {
  if (_adUnitID && _bannerSize && _onSizeChange && _onDidFailToReceiveAdWithError && _additionalRequestParams) {
    GADAdSize size = [self getAdSizeFromString:_bannerSize];
    _bannerView = [[GAMBannerView alloc] initWithAdSize:size];
    [_bannerView setAppEventDelegate:self];
    if (!CGRectEqualToRect(self.bounds, _bannerView.bounds)) {
      if (self.onSizeChange) {
        self.onSizeChange(@{
                            @"width" : [NSNumber numberWithFloat:_bannerView.bounds.size.width],
                            @"height" : [NSNumber numberWithFloat:_bannerView.bounds.size.height]
                            });
      }
    }
    _bannerView.delegate = self;
    _bannerView.adUnitID = _adUnitID;
    _bannerView.rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
    GADRequest *request = [GADRequest request];
    GADExtras *extras = [[GADExtras alloc] init];
    extras.additionalParameters = _additionalRequestParams;
    [request registerAdNetworkExtras:extras];
    [_bannerView loadRequest:request];
  }
}

- (void)setOnSizeChange:(EXDirectEventBlock)block
{
  _onSizeChange = block;
  [self loadBanner];
}

- (void)setOnDidFailToReceiveAdWithError:(EXDirectEventBlock)block
{
  _onDidFailToReceiveAdWithError = block;
  [self loadBanner];
}

- (void)adView:(GAMBannerView *)banner didReceiveAppEvent:(NSString *)name withInfo:(NSString *)info {
  if (self.onAdmobDispatchAppEvent) {
    self.onAdmobDispatchAppEvent(@{name : info});
  }
}

- (void)setBannerSize:(NSString *)bannerSize {
  if (![bannerSize isEqual:_bannerSize]) {
    _bannerSize = bannerSize;
    if (_bannerView) {
      [_bannerView removeFromSuperview];
    }
    [self loadBanner];
  }
}

- (void)setAdUnitID:(NSString *)adUnitID {
  if (![adUnitID isEqual:_adUnitID]) {
    _adUnitID = adUnitID;
    if (_bannerView) {
      [_bannerView removeFromSuperview];
    }

    [self loadBanner];
  }
}

- (void)setAdditionalRequestParams:(NSDictionary *)additionalRequestParams
{
  if (![additionalRequestParams isEqual:_additionalRequestParams]) {
    _additionalRequestParams = additionalRequestParams;
    if (_bannerView) {
      [_bannerView removeFromSuperview];
    }
    [self loadBanner];
  }
}

- (void)layoutSubviews {
  [super layoutSubviews];
  _bannerView.frame = CGRectMake(
                                 self.bounds.origin.x,
                                 self.bounds.origin.y,
                                 _bannerView.frame.size.width,
                                 _bannerView.frame.size.height
                                 );
  [self addSubview:_bannerView];
}

- (void)removeFromSuperview {
  [super removeFromSuperview];
}

#pragma mark - GADBannerViewDelegate: Ad Request Lifecycle Notifications

/// Tells the delegate that an ad request successfully received an ad. The delegate may want to add
/// the banner view to the view hierarchy if it hasn't been added yet.
- (void)bannerViewDidReceiveAd:(nonnull GADBannerView *)bannerView
{
  if (self.onAdViewDidReceiveAd) {
    self.onAdViewDidReceiveAd(@{});
  }
}

/// Tells the delegate that an ad request failed. The failure is normally due to network
/// connectivity or ad availablility (i.e., no fill).
- (void)bannerView:(nonnull GADBannerView *)bannerView
    didFailToReceiveAdWithError:(nonnull NSError *)error
{
  if (self.onDidFailToReceiveAdWithError) {
    self.onDidFailToReceiveAdWithError(@{ @"error" : [error description] });
  }
}

///// Tells the delegate that an impression has been recorded for an ad.
//- (void)bannerViewDidRecordImpression:(nonnull GADBannerView *)bannerView;
//
///// Tells the delegate that a click has been recorded for the ad.
//- (void)bannerViewDidRecordClick:(nonnull GADBannerView *)bannerView;

#pragma mark GADBannerViewDelegate: Click-Time Lifecycle Notifications

/// Tells the delegate that a full screen view will be presented in response to the user clicking on
/// an ad. The delegate may want to pause animations and time sensitive interactions.
- (void)bannerViewWillPresentScreen:(nonnull GADBannerView *)bannerView
{
  if (self.onAdViewWillPresentScreen) {
    self.onAdViewWillPresentScreen(@{});
  }
}

/// Tells the delegate that the full screen view will be dismissed.
- (void)bannerViewWillDismissScreen:(nonnull GADBannerView *)bannerView
{
  if (self.onAdViewWillDismissScreen) {
    self.onAdViewWillDismissScreen(@{});
  }
}

/// Tells the delegate that the full screen view has been dismissed. The delegate should restart
/// anything paused while handling bannerViewWillPresentScreen:.
- (void)bannerViewDidDismissScreen:(nonnull GADBannerView *)bannerView
{
  if (self.onAdViewDidDismissScreen) {
    self.onAdViewDidDismissScreen(@{});
  }
}

@end
