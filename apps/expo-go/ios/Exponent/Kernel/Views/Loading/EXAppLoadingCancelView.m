#import "EXAppLoadingCancelView.h"

const NSTimeInterval kEXTimeUntilCancelAppears = 5.0f;

@interface EXAppLoadingCancelView ()

@property (nonatomic, assign) id<EXAppLoadingCancelViewDelegate> delegate;

@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicator;
@property (nonatomic, strong) UIImageView *iconImageView;
@property (nonatomic, strong) UILabel *lblStatus;
@property (nonatomic, strong) UILabel *lblAdvice;
@property (nonatomic, strong) UIButton *btnCancel;
@property (nonatomic, strong) NSTimer *tmrShowCancel;

@end

@implementation EXAppLoadingCancelView

- (instancetype)init
{
  if (self = [super init]) {
    [self _setUpViews];
  }
  return self;
}

- (void)dealloc
{
  [self _invalidateTimer];
}

- (void)setDelegate:(id<EXAppLoadingCancelViewDelegate>)delegate
{
  _delegate = delegate;
  // Only show cancel button in default mode (not when icon is shown for local loads)
  if (_delegate && !_iconImage) {
    _btnCancel.hidden = NO;
  }
}

- (void)setStatusText:(NSString *)statusText
{
  _statusText = [statusText copy];
  _lblStatus.text = statusText;
  [self setNeedsLayout];
}

- (void)setIconImage:(UIImage *)iconImage
{
  _iconImage = iconImage;
  if (iconImage) {
    // Show icon, hide spinner
    if (!_iconImageView) {
      _iconImageView = [[UIImageView alloc] init];
      _iconImageView.contentMode = UIViewContentModeScaleAspectFit;
      [self addSubview:_iconImageView];
    }
    _iconImageView.image = iconImage;
    _iconImageView.hidden = NO;
    _loadingIndicator.hidden = YES;
    [_loadingIndicator stopAnimating];

    // Suppress cancel button and internet advice for local loads
    [self _invalidateTimer];
    _btnCancel.hidden = YES;
    _lblAdvice.hidden = YES;

    // Add gentle pulse animation
    [self _addPulseAnimation];
  } else {
    [_iconImageView.layer removeAnimationForKey:@"pulse"];
    _iconImageView.hidden = YES;
    _loadingIndicator.hidden = NO;
    [_loadingIndicator startAnimating];
  }
  [self setNeedsLayout];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  CGFloat centerX = CGRectGetMidX(self.bounds);

  if (_iconImage && _iconImageView) {
    // Icon mode: icon centered with status text below
    CGFloat iconSize = 80.0f;
    _iconImageView.frame = CGRectMake(0, 0, iconSize, iconSize);

    // Status label sizing
    CGFloat maxLabelWidth = self.bounds.size.width - 32.0f;
    _lblStatus.frame = CGRectMake(0, 0, maxLabelWidth, CGFLOAT_MAX);
    [_lblStatus sizeToFit];

    // Total height of icon + gap + label
    CGFloat gap = 20.0f;
    CGFloat totalHeight = iconSize + gap + _lblStatus.frame.size.height;
    CGFloat startY = CGRectGetMidY(self.bounds) - totalHeight / 2.0f;

    _iconImageView.center = CGPointMake(centerX, startY + iconSize / 2.0f);
    _lblStatus.center = CGPointMake(centerX, startY + iconSize + gap + _lblStatus.frame.size.height / 2.0f);
  } else {
    // Default mode: spinner with status text below
    CGFloat startingY = CGRectGetMidY(self.bounds) - 54.0f;
    _loadingIndicator.center = CGPointMake(centerX, startingY);

    CGFloat maxLabelWidth = self.bounds.size.width - 32.0f;
    _lblStatus.frame = CGRectMake(0, 0, maxLabelWidth, CGFLOAT_MAX);
    [_lblStatus sizeToFit];
    _lblStatus.center = CGPointMake(centerX, CGRectGetMaxY(_loadingIndicator.frame) + 16.0f + CGRectGetMidY(_lblStatus.frame));

    _btnCancel.frame = CGRectMake(0, 0, 84.0f, 36.0f);
    _btnCancel.center = CGPointMake(centerX, CGRectGetMaxY(_lblStatus.frame) + 48.0f);

    _lblAdvice.frame = CGRectMake(0, 0, MIN(self.bounds.size.width - 32.0f, 300.0f), CGFLOAT_MAX);
    [_lblAdvice sizeToFit];
    _lblAdvice.center = CGPointMake(centerX, CGRectGetMaxY(_btnCancel.frame) + CGRectGetMidY(_lblAdvice.frame) + 24.0f);
  }
}

- (void)_setUpViews
{
  self.backgroundColor = [UIColor clearColor];
  self.alpha = 0.0;

  _loadingIndicator = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
  [_loadingIndicator setColor:[UIColor blackColor]];
  [self addSubview:_loadingIndicator];
  [_loadingIndicator startAnimating];

  _lblStatus = [[UILabel alloc] init];
  _lblStatus.text = @"Opening project...";
  _lblStatus.font = [UIFont fontWithName:@"HelveticaNeue-Medium" size:14.0f];
  _lblStatus.textColor = [UIColor blackColor];
  _lblStatus.textAlignment = NSTextAlignmentCenter;
  _lblStatus.numberOfLines = 0;
  [self addSubview:_lblStatus];

  // Fade in animation
  [UIView animateWithDuration:0.2 animations:^{
    self.alpha = 1.0;
  }];
  
  _lblAdvice = [[UILabel alloc] init];
  _lblAdvice.text = @"This is taking much longer than it should. You might want to check your internet connectivity.";
  _lblAdvice.numberOfLines = 0;
  _lblAdvice.font = [UIFont systemFontOfSize:14.0f];
  _lblAdvice.textColor = [UIColor darkGrayColor];
  _lblAdvice.textAlignment = NSTextAlignmentCenter;
  [self addSubview:_lblAdvice];
  
  _btnCancel = [UIButton buttonWithType:UIButtonTypeRoundedRect];
  [_btnCancel setTitle:@"Go back" forState:UIControlStateNormal];
  _btnCancel.titleLabel.font = [UIFont boldSystemFontOfSize:14.0f];
  [_btnCancel setTitleColor:[UIColor darkGrayColor] forState:UIControlStateNormal];
  _btnCancel.layer.borderWidth = 1.0f;
  _btnCancel.layer.borderColor = [UIColor darkGrayColor].CGColor;
  _btnCancel.layer.cornerRadius = 3.0f;
  [_btnCancel addTarget:self action:@selector(_onTapCancel) forControlEvents:UIControlEventTouchUpInside];
  [self addSubview:_btnCancel];
  
  _btnCancel.hidden = YES;
  _lblAdvice.hidden = YES;
  _tmrShowCancel = [NSTimer scheduledTimerWithTimeInterval:kEXTimeUntilCancelAppears
                                                    target:self
                                                  selector:@selector(_onCancelTimerFinished)
                                                  userInfo:nil repeats:NO];
  
  [self setNeedsLayout];
}

- (void)_onTapCancel
{
  if (_delegate) {
    [_delegate appLoadingCancelViewDidCancel:self];
  }
}

#pragma mark - pulse animation

- (void)_addPulseAnimation
{
  [_iconImageView.layer removeAnimationForKey:@"pulse"];

  CABasicAnimation *scaleAnimation = [CABasicAnimation animationWithKeyPath:@"transform.scale"];
  scaleAnimation.fromValue = @(1.0);
  scaleAnimation.toValue = @(1.06);
  scaleAnimation.duration = 0.9;
  scaleAnimation.autoreverses = YES;
  scaleAnimation.repeatCount = HUGE_VALF;
  scaleAnimation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];

  [_iconImageView.layer addAnimation:scaleAnimation forKey:@"pulse"];
}

#pragma mark - cancel timer

- (void)_invalidateTimer
{
  if (_tmrShowCancel) {
    [_tmrShowCancel invalidate];
    _tmrShowCancel = nil;
  }
}

- (void)_onCancelTimerFinished
{
  [self _invalidateTimer];
  _lblAdvice.hidden = NO;
}

@end
