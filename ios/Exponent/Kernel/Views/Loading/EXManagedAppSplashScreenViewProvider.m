#import <EXSplashScreen/EXSplashScreenConfiguration.h>
#import <React/RCTImageSource.h>
#import <React/RCTImageView.h>
#import <UMCore/UMDefines.h>

#import "EXManagedAppSplashScreenViewProvider.h"
#import "EXManagedAppSplashScreenConfigurationBuilder.h"
#import "EXKernel.h"
#import "EXReactAppManager.h"

@interface RCTImageView (EXAppLoadingView)

@property (nonatomic, copy) RCTDirectEventBlock onLoadEnd;

@end

@interface EXManagedAppSplashScreenViewProvider ()

@property (nonatomic, weak) UIView *splashScreenView;
@property (nonatomic, strong) EXSplashScreenConfiguration *configuration;
@property (nonatomic, strong, nullable) RCTImageView *splashImageView;

@end

@implementation EXManagedAppSplashScreenViewProvider

- (instancetype)initWithManifest:(NSDictionary *)manifest
{
  if (self = [super init]) {
    _configuration = [EXManagedAppSplashScreenConfigurationBuilder parseManifest:manifest];
  }
  return self;
}

- (void)updateSplashScreenViewWithManifest:(NSDictionary *)manifest
{
  _configuration = [EXManagedAppSplashScreenConfigurationBuilder parseManifest:manifest];
  if (_splashScreenView) {
    [self configureSplashScreenView:_splashScreenView];
  }
}

- (UIView *)createSplashScreenView
{
  UIView *splashScreenView = [UIView new];
  [self configureSplashScreenView:splashScreenView];
  _splashScreenView = splashScreenView;
  return splashScreenView;
}

- (void)configureSplashScreenView:(UIView *)splashScreenView
{
  UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    UM_ENSURE_STRONGIFY(self);
    splashScreenView.backgroundColor = self.configuration.backgroundColor;
    
    if (self.configuration.imageUrl) {
      EXKernelAppRecord *homeAppRecord = [EXKernel sharedInstance].appRegistry.homeAppRecord;
      
      if (homeAppRecord.appManager.reactBridge) {
        // remove old splashImageView
        if (self.splashImageView) {
          [self.splashImageView removeFromSuperview];
        }

        RCTImageSource *imageSource = [RCTConvert RCTImageSource:@{ @"uri": self.configuration.imageUrl }];
        
        self.splashImageView = [[RCTImageView alloc] initWithBridge:homeAppRecord.appManager.reactBridge];
        self.splashImageView.frame = splashScreenView.bounds;
        self.splashImageView.imageSources = @[imageSource];
        self.splashImageView.resizeMode = self.configuration.imageResizeMode == EXSplashScreenImageResizeModeCover ? RCTResizeModeCover : RCTResizeModeContain;;
        UM_WEAKIFY(self);
        [self.splashImageView setOnLoadEnd:^(NSDictionary *dict) {
          UM_ENSURE_STRONGIFY(self);
        }];
        [splashScreenView addSubview:self.splashImageView];
      }
    }
  });
}

@end

