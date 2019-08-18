#import "EXButtonView.h"
#import "EXKernel.h"

@interface EXButtonView ()

@property (nonatomic, strong) UIButton *button;

@end

@implementation EXButtonView

- (instancetype)init
{
  if (self = [super init]) {
    [self _setUpViews];
  }
  return self;
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
  _button.frame = CGRectMake(0, 0, self.frame.size.width, self.frame.size.height);
  _button.layer.cornerRadius = MIN(self.frame.size.width, self.frame.size.height) * 0.5f;
}

- (void)_setUpViews
{
  _button = [UIButton buttonWithType:UIButtonTypeRoundedRect];
  [_button setImage:[UIImage imageNamed:@"MenuButton"] forState:UIControlStateNormal];
  [_button setTintColor:[UIColor darkGrayColor]];
  [_button addTarget:self action:@selector(_onTouchBegin) forControlEvents:UIControlEventTouchDown];
  [_button addTarget:self action:@selector(_onTouchEnd)
    forControlEvents:UIControlEventTouchUpInside | UIControlEventTouchUpOutside | UIControlEventTouchCancel];
  [_button addTarget:self action:@selector(_onPress) forControlEvents:UIControlEventTouchUpInside];
  _button.layer.borderColor = [UIColor lightGrayColor].CGColor;
  _button.layer.borderWidth = 1.0f;
  _button.backgroundColor = [UIColor whiteColor];
  [self addSubview:_button];
  [self setNeedsLayout];
}

- (void)_onTouchBegin
{
  [UIView animateWithDuration:0.08f delay:0.0f options:UIViewAnimationOptionBeginFromCurrentState animations:^{
    self->_button.transform = CGAffineTransformMakeScale(0.95f, 0.95f);
  } completion:nil];
}

- (void)_onTouchEnd
{
  [UIView animateWithDuration:0.08f delay:0.0f options:UIViewAnimationOptionBeginFromCurrentState animations:^{
    self->_button.transform = CGAffineTransformIdentity;
  } completion:nil];
}

- (void)_onPress
{
  [[EXKernel sharedInstance] switchTasks];
}

@end
