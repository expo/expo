//
//  EXSplashScreenHUDButton.m
//  EXSplashScreen
//

#import "EXSplashScreenHUDButton.h"

@implementation EXSplashScreenHUDButton

-(void)layoutSubviews
{
  if (@available(iOS 13.0, *)) {
    UIImageView *infoIcon = [UIImageView new];
    UIImageSymbolConfiguration *symbolConfig = [UIImageSymbolConfiguration configurationWithFont:[UIFont boldSystemFontOfSize:24.f]];
    UIImage *infoImage = [UIImage systemImageNamed: @"info.circle" withConfiguration:symbolConfig];
    [infoIcon setImage:infoImage];
    infoIcon.frame = CGRectMake(24.f, 0, 24.f, 24.f);
    [self addSubview:infoIcon];
  }
  
  NSString *title = @"Stuck on splash screen?";
  [self setTitle: title forState:UIControlStateNormal];
  self.titleLabel.font = [UIFont boldSystemFontOfSize:16.0f];
  self.titleEdgeInsets = UIEdgeInsetsMake(0, 24.0f, 0, 0);
  
  [super layoutSubviews];
}

-(CGSize)intrinsicContentSize {
  return CGSizeMake(300, 24.f);
}

@end
