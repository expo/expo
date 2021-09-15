#import <EXAdsFacebook/EXInterstitialAdManager.h>
#import <ExpoModulesCore/EXUtilities.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>

@interface EXInterstitialAdManager () <FBInterstitialAdDelegate>

@property (nonatomic, strong) EXPromiseResolveBlock resolve;
@property (nonatomic, strong) EXPromiseRejectBlock reject;
@property (nonatomic, strong) FBInterstitialAd *interstitialAd;
@property (nonatomic, strong) UIViewController *adViewController;
@property (nonatomic) bool didClick;
@property (nonatomic) bool isBackground;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXInterstitialAdManager

EX_EXPORT_MODULE(CTKInterstitialAdManager)

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

EX_EXPORT_METHOD_AS(showAd,
                    showAd:(NSString *)placementId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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
  [EXUtilities performSynchronouslyOnMainThread:^{
    [self->_interstitialAd loadAd];
  }];
}

#pragma mark - FBInterstitialAdDelegate

- (void)interstitialAdDidLoad:(__unused FBInterstitialAd *)interstitialAd
{
  [_interstitialAd showAdFromRootViewController:[[_moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)] currentViewController]];
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
    [[[_moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)] currentViewController] presentViewController:_adViewController animated:NO completion:nil];
    _adViewController = nil;
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  _isBackground = true;
  
  if (_interstitialAd) {
    _adViewController = [[_moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)] currentViewController];
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
