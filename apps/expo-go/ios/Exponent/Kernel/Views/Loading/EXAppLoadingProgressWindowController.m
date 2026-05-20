#import "EXAppLoadingProgressWindowController.h"

#import <ExpoModulesCore/EXDefines.h>

#import "Expo_Go-Swift.h"

#import "EXUtil.h"

@interface EXAppLoadingProgressWindowController ()

@property (nonatomic, assign) BOOL enabled;
@property (nonatomic, assign) BOOL remainsHidden;
@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) UILabel *textLabel;

@end

@implementation EXAppLoadingProgressWindowController

- (instancetype)initWithEnabled:(BOOL)enabled
{
  if (self = [super init]) {
    _enabled = enabled;
    _remainsHidden = NO;
  }
  return self;
}

- (void)show
{
  if (!_enabled || _remainsHidden) {
    return;
  }

  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    if (!self.window) {
      CGSize screenSize = [UIScreen mainScreen].bounds.size;

      int bottomInsets = RCTSharedApplication().keyWindow.safeAreaInsets.bottom;
      self.window = [[UIWindow alloc] initWithFrame:CGRectMake(0,
                                                               screenSize.height - 36 - bottomInsets,
                                                               screenSize.width,
                                                               36 + bottomInsets)];
      self.window.windowLevel = UIWindowLevelStatusBar + 1;
      self.window.rootViewController = [EXAppLoadingProgressWindowViewController new];
      self.window.backgroundColor = [EXUtil colorWithRGB:0xfafafa];

      UIView *containerView = [UIView new];
      [self.window addSubview:containerView];

      CALayer *topBorderLayer = [CALayer layer];
      topBorderLayer.frame = CGRectMake(0, 0, screenSize.width, 1);
      topBorderLayer.backgroundColor = [EXUtil colorWithRGB:0xe3e3e3].CGColor;
      [containerView.layer addSublayer:topBorderLayer];

      self.textLabel = [UILabel new];
      self.textLabel.frame = CGRectMake(10, 0, screenSize.width - 20, 36);
      self.textLabel.font = [UIFont monospacedDigitSystemFontOfSize:12 weight:(UIFontWeightRegular)];
      self.textLabel.textAlignment = NSTextAlignmentLeft;
      self.textLabel.textColor = [EXUtil colorWithRGB:0xa7a7a7];
      [containerView addSubview:self.textLabel];
    }
    self.textLabel.text =  @"Waiting for server ...";
    self.window.hidden = NO;
  });
}

- (void)hide
{
  if (!_enabled) {
    return;
  }

  _remainsHidden = YES;

  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    if (self.window) {
      self.window.hidden = YES;
      // remove this window altogther to hand over the command over StatusBar rotation
      self.window = nil;
    }
  });
}

- (void)updateStatusWithProgress:(EXLoadingProgress *)progress
{
  if (!_enabled) {
    return;
  }

  [self show];

  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    float progressPercent = ([progress.done floatValue] / [progress.total floatValue]);
    NSString *status = progress.status;
    if ([status caseInsensitiveCompare:@"Downloading"] == NSOrderedSame) {
      status = @"Loading";
    }
    self.textLabel.text = [NSString stringWithFormat:@"%@ %.2f%%", status, progressPercent * 100];
    [self.textLabel setNeedsDisplay];

    // TODO: (@bbarthec) maybe it's better to show/hide this based on other thing than progress status reported by the fetcher?
    self.window.hidden = !(progress.total.floatValue > 0);
  });
}

- (void)updateStatus:(EXAppLoaderRemoteUpdateStatus)status
{
  if (!_enabled) {
    return;
  }

  NSString *statusText = [[self class] _loadingViewTextForStatus:status];
  if (!statusText) {
    return;
  }

  [self show];

  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    self.textLabel.text = statusText;
    [self.textLabel setNeedsDisplay];
  });
}

+ (nullable NSString *)_loadingViewTextForStatus:(EXAppLoaderRemoteUpdateStatus)status
{
  if (status == kEXAppLoaderRemoteUpdateStatusChecking) {
    return @"Checking for latest version...";
  } else if (status == kEXAppLoaderRemoteUpdateStatusDownloading) {
    return @"Loading project...";
  } else {
    return nil;
  }
}

@end
