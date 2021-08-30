#import <ABI41_0_0EXAdsFacebook/ABI41_0_0EXInterstitialAdManager.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>

@interface ABI41_0_0EXInterstitialAdManager () <FBInterstitialAdDelegate>

@property (nonatomic, strong) ABI41_0_0UMPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI41_0_0UMPromiseRejectBlock reject;
@property (nonatomic, strong) FBInterstitialAd *interstitialAd;
@property (nonatomic, strong) UIViewController *adViewController;
@property (nonatomic) bool didClick;
@property (nonatomic) bool isBackground;
@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI41_0_0EXInterstitialAdManager

ABI41_0_0UM_EXPORT_MODULE(CTKInterstitialAdManager)

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI41_0_0UM_EXPORT_METHOD_AS(showAd,
                    showAd:(NSString *)placementId
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
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
  [ABI41_0_0UMUtilities performSynchronouslyOnMainThread:^{
    [self->_interstitialAd loadAd];
  }];
}

#pragma mark - FBInterstitialAdDelegate

- (void)interstitialAdDidLoad:(__unused FBInterstitialAd *)interstitialAd
{
  [_interstitialAd showAdFromRootViewController:[[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMUtilitiesInterface)] currentViewController]];
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
    [[[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMUtilitiesInterface)] currentViewController] presentViewController:_adViewController animated:NO completion:nil];
    _adViewController = nil;
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  _isBackground = true;
  
  if (_interstitialAd) {
    _adViewController = [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMUtilitiesInterface)] currentViewController];
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
