#import <ABI43_0_0EXAdsFacebook/ABI43_0_0EXInterstitialAdManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>

@interface ABI43_0_0EXInterstitialAdManager () <FBInterstitialAdDelegate>

@property (nonatomic, strong) ABI43_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI43_0_0EXPromiseRejectBlock reject;
@property (nonatomic, strong) FBInterstitialAd *interstitialAd;
@property (nonatomic, strong) UIViewController *adViewController;
@property (nonatomic) bool didClick;
@property (nonatomic) bool isBackground;
@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI43_0_0EXInterstitialAdManager

ABI43_0_0EX_EXPORT_MODULE(CTKInterstitialAdManager)

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI43_0_0EX_EXPORT_METHOD_AS(showAd,
                    showAd:(NSString *)placementId
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if (_resolve != nil || _reject != nil) {
    reject(@"E_NO_CONCURRENT", @"Only one `showAd` can be called at once", nil);
    return;
  }
  if (_isBackground) {
    reject(@"E_BACKGROUNDED", @"`showAd` can be called only when experience is running in foreground", nil);
    return;
  }
  
  _resolve = resolve;
  _reject = reject;
  
  _interstitialAd = [[FBInterstitialAd alloc] initWithPlacementID:placementId];
  _interstitialAd.delegate = self;
  [ABI43_0_0EXUtilities performSynchronouslyOnMainThread:^{
    [self->_interstitialAd loadAd];
  }];
}

#pragma mark - FBInterstitialAdDelegate

- (void)interstitialAdDidLoad:(__unused FBInterstitialAd *)interstitialAd
{
  [_interstitialAd showAdFromRootViewController:[[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUtilitiesInterface)] currentViewController]];
}

- (void)interstitialAd:(FBInterstitialAd *)interstitialAd didFailWithError:(NSError *)error
{
  _reject(@"E_FAILED_TO_LOAD", [error localizedDescription], error);
  
  [self cleanUpAd];
}

- (void)interstitialAdDidClick:(FBInterstitialAd *)interstitialAd
{
  _didClick = true;
}

- (void)interstitialAdDidClose:(FBInterstitialAd *)interstitialAd
{
  _resolve(@(_didClick));
  
  [self cleanUpAd];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  _isBackground = false;
  
  if (_adViewController) {
    [[[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUtilitiesInterface)] currentViewController] presentViewController:_adViewController animated:NO completion:nil];
    _adViewController = nil;
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  _isBackground = true;
  
  if (_interstitialAd) {
    _adViewController = [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUtilitiesInterface)] currentViewController];
    [_adViewController dismissViewControllerAnimated:NO completion:nil];
  }
}

- (void)cleanUpAd
{
  _reject = nil;
  _resolve = nil;
  _interstitialAd = nil;
  _adViewController = nil;
  _didClick = false;
}

@end
