#import "EXAppLoadingWindowController.h"
#import "EXUtil.h"
#import <UMCore/UMDefines.h>

@interface EXAppLoadingWindowController ()

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) UILabel *textLabel;
@property (nonatomic, strong) CALayer *topBorderLayer;

@end

@implementation EXAppLoadingWindowController

- (void)show
{
  UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    UM_ENSURE_STRONGIFY(self);
    if (!self.window) {
      CGSize screenSize = [UIScreen mainScreen].bounds.size;
      self.window = [[UIWindow alloc] initWithFrame:CGRectMake(0, screenSize.height - 36, screenSize.width, 36)];
      self.window.windowLevel = UIWindowLevelStatusBar + 1;
      // set a root VC so rotation is supported
      self.window.rootViewController = [UIViewController new];
      self.window.backgroundColor = [EXUtil colorWithRGB:0xfafafa];
      
      self.topBorderLayer.frame = CGRectMake(0, 0, screenSize.width, 1.0f);
      self.topBorderLayer = [CALayer layer];
      self.topBorderLayer.backgroundColor = [EXUtil colorWithRGB:0xff0303].CGColor;
      [self.window.layer addSublayer:self.topBorderLayer];

      self.textLabel = [UILabel new];
      self.textLabel.frame = CGRectMake(10.0f, 0.0f, screenSize.width - 20.0f, 36.0f);
      self.textLabel.font = [UIFont systemFontOfSize:12.0f];
      self.textLabel.textAlignment = NSTextAlignmentLeft;
      self.textLabel.textColor = [EXUtil colorWithRGB:0xa7a7a7];
      [self.window addSubview:self.textLabel];
    }
    self.textLabel.text =  @"Waiting for messages ...";
    self.window.hidden = NO;
  });
}

- (void)hide
{
  self.window.hidden = YES;
}

- (void)updateStatusWithProgress:(EXLoadingProgress *)progress
{
  UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    UM_ENSURE_STRONGIFY(self);
    float progressPercent = ([progress.done floatValue] / [progress.total floatValue]);
    self.textLabel.text = [NSString stringWithFormat:@"%@ %.2f%%", progress.status, progressPercent * 100.0f];
    [self.textLabel setNeedsDisplay];
  });
}

@end
