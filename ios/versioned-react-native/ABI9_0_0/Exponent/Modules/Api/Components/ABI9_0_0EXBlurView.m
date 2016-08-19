// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI9_0_0EXBlurView.h"

@implementation ABI9_0_0EXBlurView

- (void)setTintEffect:(NSString *)tintEffect
{
  _tintEffect = tintEffect;
  
  if (_visualEffectView) {
    [_visualEffectView removeFromSuperview];
  }
  
  UIBlurEffect *blurEffect;
  
  if ([tintEffect isEqual: @"light"]) {
    blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleExtraLight];
  } else if ([tintEffect isEqual: @"default"]) {
    blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleLight];
  } else if ([tintEffect isEqual: @"dark"]) {
    blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleDark];
  }
  
  _visualEffectView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
}

-(void)layoutSubviews
{
  [super layoutSubviews];
  
  _visualEffectView.frame = self.bounds;
  [self insertSubview:_visualEffectView atIndex:0];
}

@end
