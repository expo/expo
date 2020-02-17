// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXManifestBasedSplashScreenViewProvider.h"

#import <React/RCTImageSource.h>
#import <React/RCTImageView.h>

@interface RCTImageView (EXAppLoadingView)

@property (nonatomic, copy) RCTDirectEventBlock onLoadEnd;

@end

@interface EXManifestBaseedSplashScreenViewProvider ()

@property (nonatomic, strong) EXSplashScreenConfig *config;
@property (nonatomic, strong) RCTImageView *imageView;

@end

@implementation EXManifestBasedSplashScreenViewProvider

- (instancetype)initWithConfig:(EXSplashScreenConfig *)config
{
  if (self = [super init]) {
    _config = config;
  }
  return self;
}

- (UIView *)createSplashScreenView:(EXSplashScreenImageResizeMode)resizeMode {
  RCTResizeMode imageResizeMode = _config.resizeMode ? RCTResizeModeCover : RCTResizeModeContain;
  RCTImageSource *imageSource;
  if (_config.imageUrl) {
    imageSource = [RCTConvert RCTImageSource:@{ @"uri":imageUrl }];
  }
  
  // Use React Bridge from homeApp to load image
  // It's better than pulling in SDWebImage library to load images from URL into UIImageView
  EXKernelAppRecord *homeAppRecord = [EXKernel sharedInstance].appRegistry.homeAppRecord;
  if (imageSource && homeAppRecord.appManager.reactBridge) {
    self.imageView = [[RCTImageView alloc] initWithBridge:homeAppRecord.appManager.reactBridge];
    self.imageView.frame = self.bounds;
    self.imageView.imageSources = @[ imageSource ];
    self.imageView.resizeMode = imageResizeMode;
    UM_WEAKIFY(self);
    [_vBackgroundImage setOnLoadEnd:^(NSDictionary *dict) {
      UM_ENSURE_STRONGIFY(self);
      [self _hidePlaceholder];
    }];
    
    return self.imageView;
  } else {
    [self _hidePlaceholder];
  }
}

@end
