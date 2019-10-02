// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXBlur/EXBlurView.h>

@implementation EXBlurView

- (void)applyStyle
{
  self.clipsToBounds = true;
  if ([_tint isEqual: @"light"]) {
    _blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleExtraLight];
  } else if ([_tint isEqual: @"default"]) {
    _blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleLight];
  } else if ([_tint isEqual: @"dark"]) {
    _blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleDark];
  }
  
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __typeof(self) strongSelf = weakSelf;

    if (strongSelf) {
      UIVisualEffectView *blockVisualEffectView = strongSelf.visualEffectView;

      if (blockVisualEffectView) {
        [blockVisualEffectView removeFromSuperview];
        [blockVisualEffectView setEffect:strongSelf.blurEffect];
      } else {
        [strongSelf setVisualEffectView:[[UIVisualEffectView alloc] initWithEffect:strongSelf.blurEffect]];
        blockVisualEffectView = strongSelf.visualEffectView;
        [[strongSelf visualEffectView] setAutoresizingMask: UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
      }

      blockVisualEffectView.alpha = [strongSelf.intensity floatValue] / 100.0;
      blockVisualEffectView.frame = strongSelf.bounds;
      [strongSelf insertSubview:strongSelf.visualEffectView atIndex:0];
    }
  });
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps {
  if ([changedProps containsObject:@"tint"] || [changedProps containsObject:@"intensity"]) {
    [self applyStyle];
  }
}

- (void)setTint:(NSString *)tint
{
  _tint = tint;
}

- (void)setIntensity:(NSNumber *)intensity
{
  _intensity = intensity;
}

@end
