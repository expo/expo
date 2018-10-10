#import <EXCore/EXEventEmitterService.h>
#import <EXAdsAdMob/EXAdsDFPBannerView.h>

@implementation EXAdsDFPBannerView {
  DFPBannerView *_bannerView;
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
  if (_adUnitID && _bannerSize && _onSizeChange && _onDidFailToReceiveAdWithError) {
    GADAdSize size = [self getAdSizeFromString:_bannerSize];
    _bannerView = [[DFPBannerView alloc] initWithAdSize:size];
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
    if (_testDeviceID) {
      if ([_testDeviceID isEqualToString:@"EMULATOR"]) {
        request.testDevices = @[kGADSimulatorID];
      } else {
        request.testDevices = @[_testDeviceID];
      }
    }
    
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

- (void)adView:(DFPBannerView *)banner didReceiveAppEvent:(NSString *)name withInfo:(NSString *)info {
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
- (void)setTestDeviceID:(NSString *)testDeviceID {
  if (![testDeviceID isEqual:_testDeviceID]) {
    _testDeviceID = testDeviceID;
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

/// Tells the delegate an ad request loaded an ad.
- (void)adViewDidReceiveAd:(DFPBannerView *)adView {
  if (self.onAdViewDidReceiveAd) {
    self.onAdViewDidReceiveAd(@{});
  }
}

/// Tells the delegate an ad request failed.
- (void)adView:(DFPBannerView *)adView didFailToReceiveAdWithError:(GADRequestError *)error {
  if (self.onDidFailToReceiveAdWithError) {
    self.onDidFailToReceiveAdWithError(@{ @"error" : [error description] });
  }
}

/// Tells the delegate that a full screen view will be presented in response
/// to the user clicking on an ad.
- (void)adViewWillPresentScreen:(DFPBannerView *)adView {
  if (self.onAdViewWillPresentScreen) {
    self.onAdViewWillPresentScreen(@{});
  }
}

/// Tells the delegate that the full screen view will be dismissed.
- (void)adViewWillDismissScreen:(DFPBannerView *)adView {
  if (self.onAdViewWillDismissScreen) {
    self.onAdViewWillDismissScreen(@{});
  }
}

/// Tells the delegate that the full screen view has been dismissed.
- (void)adViewDidDismissScreen:(DFPBannerView *)adView {
  if (self.onAdViewDidDismissScreen) {
    self.onAdViewDidDismissScreen(@{});
  }
}

/// Tells the delegate that a user click will open another app (such as
/// the App Store), backgrounding the current app.
- (void)adViewWillLeaveApplication:(DFPBannerView *)adView {
  if (self.onAdViewWillLeaveApplication) {
    self.onAdViewWillLeaveApplication(@{});
  }
}

@end
