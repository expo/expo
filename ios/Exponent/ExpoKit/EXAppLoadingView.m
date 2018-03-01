#import "EXAppLoadingView.h"
#import "EXKernelUtil.h"

@interface EXAppLoadingView ()

@property (nonatomic, strong) UIActivityIndicatorView *loadingIndicator;
@property (nonatomic, strong) UIView *loadingView;
@property (nonatomic, assign) BOOL usesSplash;
@property (nonatomic, strong) UILabel *lblShittyProgress;

@end

@implementation EXAppLoadingView

- (instancetype)initUsingSplash:(BOOL)usesSplash
{
  if (self = [super init]) {
    _usesSplash = usesSplash;
    self.backgroundColor = [UIColor whiteColor];
    [self _setUpViews];
  }
  return self;
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
  if (_usesSplash) {
    _loadingView.frame = self.bounds;
  } else {
    // TODO: lay out not-splash
    _loadingIndicator.center = CGPointMake(CGRectGetMidX(self.bounds), CGRectGetMidY(self.bounds));
    _lblShittyProgress.frame = CGRectMake(0, 0, self.bounds.size.width, 32.0f);
    _lblShittyProgress.center = CGPointMake(_loadingIndicator.center.x, _loadingIndicator.center.y + 36.0f);
  }
}

- (void)setProgress:(CGFloat)progress
{
  _progress = progress;
  _lblShittyProgress.text = [NSString stringWithFormat:@"%.2f%%", progress * 100.0f];
  _lblShittyProgress.hidden = !(progress > 0.0f);
  [self setNeedsDisplay];
}

#pragma mark - internal

- (void)_setUpViews
{
  BOOL hasSplashScreen = NO;
  if (_usesSplash) {
    // Display the launch screen behind the React view so that the React view appears to seamlessly load
    NSArray *views;
    @try {
      views = [[NSBundle mainBundle] loadNibNamed:@"LaunchScreen" owner:self options:nil];
    } @catch (NSException *_) {
      DDLogWarn(@"Expo LaunchScreen.xib is missing. Unexpected loading behavior may occur.");
    }
    if (views) {
      self.loadingView = views.firstObject;
      self.loadingView.layer.zPosition = 1000;
      self.loadingView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
      [self addSubview:self.loadingView];
      
      // The launch screen contains a loading indicator
      // use this instead of the superclass loading indicator
      _loadingIndicator = (UIActivityIndicatorView *)[self.loadingView viewWithTag:1];
      hasSplashScreen = YES;
    }
  }
  if (!hasSplashScreen) {
    _loadingIndicator = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
    [self addSubview:_loadingIndicator];
    _lblShittyProgress = [[UILabel alloc] init];
    _lblShittyProgress.font = [UIFont boldSystemFontOfSize:14.0f];
    _lblShittyProgress.textColor = [UIColor whiteColor];
    _lblShittyProgress.textAlignment = NSTextAlignmentCenter;
    _lblShittyProgress.hidden = YES;
    self.progress = 0;
    [self addSubview:_lblShittyProgress];
  }
  _loadingIndicator.hidesWhenStopped = YES;
  [_loadingIndicator startAnimating];
  [self setNeedsLayout];
  [self setNeedsDisplay];
}

@end
