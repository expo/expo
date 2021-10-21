#import <EXBlur/EXUIVisualEffectView.h>
#import <EXBlur/EXUIBlurEffect.h>

@interface UIBlurEffect (Protected)

@property (nonatomic, readonly) id effectSettings;

@end

@interface EXUIVisualEffectView ()

@property (strong, nonatomic) UIBlurEffect *blurEffect;

@end

@implementation EXUIVisualEffectView

- (instancetype)initWithBlurEffectStyle:(UIBlurEffectStyle)blurEffectStyle
                          andBlurRadius:(NSNumber *)blurRadius
{
  if (self = [super init]) {
    _blurEffectStyle = blurEffectStyle;
    _blurRadius = blurRadius;
    [self updateBlurEffect];
  }
  return self;
}

- (void)setBlurRadius:(NSNumber *)blurRadius
{
  _blurRadius = blurRadius;
  [self updateBlurEffect];
}

- (void)setBlurEffectStyle:(UIBlurEffectStyle)blurEffectStyle
{
  _blurEffectStyle = blurEffectStyle;
  [self updateBlurEffect];
}

- (void)updateBlurEffect
{
  UIBlurEffect *blurEffect = [EXUIBlurEffect effectWithStyle:_blurEffectStyle
                                               andBlurRadius:_blurRadius];
//  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:_blurEffectStyle];
//  [blurEffect.effectSettings setValue:_blurRadius forKey:@"blurRadius"];
  self.blurEffect = blurEffect;
  self.effect = self.blurEffect;
}

@end
