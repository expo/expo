#import <React/RCTImageSource.h>
#import <React/RCTImageView.h>
#import <React/RCTBridge+Private.h>
#import <ExpoModulesCore/EXDefines.h>

#import "EXKernel.h"
#import "EXManagedAppSplashScreenConfiguration.h"
#import "EXManagedAppSplashScreenConfigurationBuilder.h"
#import "EXManagedAppSplashScreenViewProvider.h"
#import "EXReactAppManager.h"

@interface EXManagedAppSplashScreenViewProvider ()

@property (nonatomic, weak) UIView *splashScreenView;
@property (nonatomic, strong) EXManagedAppSplashScreenConfiguration *configuration;
@property (nonatomic, strong, nullable) RCTImageView *splashImageView;

@end

@implementation EXManagedAppSplashScreenViewProvider

- (instancetype)initWithManifest:(EXManifestsManifest *)manifest
{
  if (self = [super init]) {
    _configuration = [EXManagedAppSplashScreenConfigurationBuilder parseManifest:manifest];
  }
  return self;
}

- (void)updateSplashScreenViewWithManifest:(EXManifestsManifest *)manifest
{
  EXManagedAppSplashScreenConfiguration *previousConfiguration = _configuration;
  _configuration = [EXManagedAppSplashScreenConfigurationBuilder parseManifest:manifest];
  if (_splashScreenView) {
    [self configureSplashScreenView:_splashScreenView previousConfiguration:previousConfiguration];
  }
}

- (UIView *)createSplashScreenView
{
  UIView *splashScreenView = [UIView new];
  [self configureSplashScreenView:splashScreenView previousConfiguration:nil];
  _splashScreenView = splashScreenView;
  return splashScreenView;
}

- (void)configureSplashScreenView:(UIView *)splashScreenView previousConfiguration:(EXManagedAppSplashScreenConfiguration *)previousConfiguration
{
  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    splashScreenView.backgroundColor = self.configuration.backgroundColor;

    if (self.configuration.imageUrl) {
      EXKernelAppRecord *homeAppRecord = [EXKernel sharedInstance].appRegistry.homeAppRecord;

      if (homeAppRecord.appManager.reactHost) {
        // Only re-create the splashImageView when the imageUrl or imageResizeMode changes
        if (![previousConfiguration.imageUrl isEqualToString:self.configuration.imageUrl] ||
            previousConfiguration.imageResizeMode != self.configuration.imageResizeMode) {
          if (self.splashImageView) {
            [self.splashImageView removeFromSuperview];
          }
          RCTImageSource *imageSource = [RCTConvert RCTImageSource:@{ @"uri": self.configuration.imageUrl }];

          // splash image loading is taking some time that, what can result in no image visually presented during loading phase
          // despite the fact the RCTImageView is mounted in the view hierarchy
          RCTBridge *bridge = [RCTBridge currentBridge];
          self.splashImageView = [[RCTImageView alloc] initWithBridge:bridge];
          self.splashImageView.frame = splashScreenView.bounds;
          self.splashImageView.imageSources = @[imageSource];
          self.splashImageView.resizeMode = self.configuration.imageResizeMode == EXSplashScreenImageResizeModeCover ? RCTResizeModeCover : RCTResizeModeContain;
          [splashScreenView addSubview:self.splashImageView];
        }
      }
    }
  });
}

@end

