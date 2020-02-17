
#import "EXAppLoadingProgress.h"
#import "EXResourceLoader.h"
#import "EXUtil.h"

@interface EXAppLoadingProgress ()

@property (nonatomic, strong) UILabel *lblStatus;
@property (nonatomic, strong) CALayer *topBorder;

@end

@implementation EXAppLoadingProgress

- (instancetype)init
{
  if (self = [super init]) {
    _hidden = YES;
  }
  return self;
}

- (void)setHidden:(BOOL)hidden
{
  if (_hidden == hidden) {
    return;
  }
  _hidden = hidden;
  if (_hidden) {
    [self show];
  } else {
    [self hide];
  }
}

- (void)updateStatusWithProgress:(EXLoadingProgress *)progress
{
  float progressPercent = ([progress.done floatValue] / [progress.total floatValue]);
  _lblStatus.text = [NSString stringWithFormat:@"%@ %.2f%%", progress.status, progressPercent * 100.0f];
  [self setNeedsDisplay];
}

# pragma mark - Showing & hiding

- (void)show
{
  dispatch_async(dispatch_get_main_queue(), ^{
    
  });
}

- (void)hide
{
  UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    UM_ENSURE_STRONGIFY(self);
  });
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
  _topBorder.frame = CGRectMake(0.0f, 0.0f, frame.size.width, 1.0f);
  _lblStatus.frame = CGRectMake(10.0f, 0.0f, frame.size.width - 20.0f, 36.0f);
}

- (void)_setUpViews
{
  self.backgroundColor = [EXUtil colorWithRGB:0xfafafa];
  
  self.topBorder = [CALayer layer];
  _topBorder.backgroundColor = [EXUtil colorWithRGB:0xf3f3f3].CGColor;
  [self.layer addSublayer:_topBorder];
  
  _lblStatus = [[UILabel alloc] init];
  _lblStatus.font = [UIFont systemFontOfSize:12.0f];
  _lblStatus.textColor = [EXUtil colorWithRGB:0xa7a7a7];
  _lblStatus.textAlignment = NSTextAlignmentLeft;
  [self addSubview:_lblStatus];
}

@end
