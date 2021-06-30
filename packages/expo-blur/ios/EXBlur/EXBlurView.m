// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXBlur/EXBlurView.h>
#import <UMCore/UMDefines.h>

@interface EXBlurView ()

@property (nonatomic, strong, nullable) UIVisualEffectView *blurEffectView;

@end

@implementation EXBlurView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.intensity = @100;
    self.tint = @"light";
    self.clipsToBounds = YES;
    
    self.blurEffectView = [[UIVisualEffectView alloc] initWithEffect:[UIBlurEffect effectWithStyle:[self blurEffectStyleFromTint:_tint]]];
    self.blurEffectView.autoresizingMask =  UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    
    [self addSubview:self.blurEffectView];
  }
  
  return self;
}

- (void)setTint:(NSString *)tint
{
  _tint = tint;
  _blurEffectView.effect = [UIBlurEffect effectWithStyle:[self blurEffectStyleFromTint:_tint]];
}

- (void)setIntensity:(NSNumber *)intensity
{
  _intensity = intensity;
  _blurEffectView.alpha = [_intensity floatValue] / 100.0;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.blurEffectView.frame = self.bounds;
}

- (UIBlurEffectStyle)blurEffectStyleFromTint:(NSString *)tint
{
  if ([tint isEqual: @"light"]) return UIBlurEffectStyleExtraLight;
  if ([tint isEqual: @"default"]) return UIBlurEffectStyleLight;
  if ([tint isEqual: @"dark"]) return UIBlurEffectStyleDark;
  
  return UIBlurEffectStyleDark;
}

@end
