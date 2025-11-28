#import "EXExpoPerfMonitor.h"

#import <React/RCTBridge.h>
#import <React/RCTDevSettings.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModule.h>
#import "Expo_Go-Swift.h"

static const CGFloat EXPerfMonitorDefaultWidth = 260;
static const CGFloat EXPerfMonitorMinimumHeight = 176;
static const CGFloat EXPerfMonitorMaxWidth = 360.0;
static const CGFloat EXPerfMonitorScreenWidthRatio = 0.95;
static const CGFloat EXPerfMonitorTopMargin = 12.0;

static CGFloat EXPerfMonitorTargetWidthForWindow(UIWindow *window)
{
  if (!window) {
    return EXPerfMonitorDefaultWidth;
  }
  CGFloat desiredWidth = window.bounds.size.width * EXPerfMonitorScreenWidthRatio;
  CGFloat clampedWidth = MIN(desiredWidth, EXPerfMonitorMaxWidth);
  return MAX(EXPerfMonitorDefaultWidth, clampedWidth);
}

@interface EXExpoPerfMonitor ()

@property (nonatomic, strong) EXPerfMonitorDataSource *dataSource;
@property (nonatomic, strong) EXPerfMonitorPresenter *presenter;
@property (nonatomic, strong) UIView *container;
@property (nonatomic, weak) RCTHost *currentHost;

@end

@implementation EXExpoPerfMonitor {
  __weak RCTBridge *_bridge;
  __weak RCTModuleRegistry *_moduleRegistry;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  [self hide];
}

- (void)updateHost:(RCTHost *)host
{
  self.currentHost = host;
  if (self.dataSource) {
    self.dataSource.host = host;
  }
}

- (void)handlePan:(UIPanGestureRecognizer *)gesture
{
  UIView *superview = self.container.superview;
  if (!superview) {
    return;
  }

  CGPoint translation = [gesture translationInView:superview];
  self.container.center = CGPointMake(self.container.center.x + translation.x,
                                       self.container.center.y + translation.y);
  [gesture setTranslation:CGPointZero inView:superview];
}

- (void)show
{
  if (!_bridge) {
    return;
  }

  if (!self.presenter) {
    self.presenter = [[EXPerfMonitorPresenter alloc] init];

    __weak __typeof(self) weakSelf = self;
    [self.presenter setContentSizeHandler:^(NSValue *value) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf updateContainerForContentSize:value.CGSizeValue];
      });
    }];

    [self.presenter setCloseHandler:^{
      [weakSelf hide];
    }];
  }

  if (!self.container) {
    self.container = [[UIView alloc] initWithFrame:CGRectZero];
    self.container.backgroundColor = UIColor.clearColor;
    self.container.layer.masksToBounds = NO;

    UIView *hostView = self.presenter.view;
    hostView.frame = self.container.bounds;
    hostView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    [self.container addSubview:hostView];

    UIPanGestureRecognizer *panGesture = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handlePan:)];
    [self.container addGestureRecognizer:panGesture];
  }

  if (!self.dataSource) {
    self.dataSource = [[EXPerfMonitorDataSource alloc] initWithBridge:_bridge host:self.currentHost];
    self.dataSource.delegate = self;
  } else {
    self.dataSource.host = self.currentHost;
  }

  [self attachContainerIfNeeded];
  [self.dataSource startMonitoring];

  RCTDevSettings *settings = (RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"];
  if (settings && !settings.isPerfMonitorShown) {
    settings.isPerfMonitorShown = YES;
  }
}

- (void)hide
{
  RCTDevSettings *settings = (RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"];
  if (settings && settings.isPerfMonitorShown) {
    settings.isPerfMonitorShown = NO;
  }

  [self.container removeFromSuperview];

  [self.dataSource stopMonitoring];
  self.dataSource.host = nil;
  self.dataSource.delegate = nil;
  self.dataSource = nil;

  [self.presenter clearContentSizeHandler];
  self.presenter = nil;
  self.container = nil;
  self.currentHost = nil;
}

- (void)attachContainerIfNeeded
{
  UIWindow *window = RCTSharedApplication().delegate.window ?: RCTKeyWindow();
  if (!window) {
    return;
  }

  if (!self.container.superview) {
    CGSize initialSize = [self.presenter currentContentSizeValue].CGSizeValue;
    if (CGSizeEqualToSize(initialSize, CGSizeZero)) {
      initialSize = CGSizeMake(EXPerfMonitorDefaultWidth, EXPerfMonitorMinimumHeight);
    }
    self.container.frame = [self initialFrameForWindow:window targetSize:initialSize];
    self.presenter.view.frame = self.container.bounds;
    [window addSubview:self.container];
  }

  [self bringContainerToFront];
}

- (CGRect)initialFrameForWindow:(UIWindow *)window targetSize:(CGSize)size
{
  CGFloat targetWidth = EXPerfMonitorTargetWidthForWindow(window);
  CGFloat width = MAX(MIN(size.width, targetWidth), EXPerfMonitorDefaultWidth);
  CGFloat height = MAX(size.height, EXPerfMonitorMinimumHeight);
  CGFloat originX = (window.bounds.size.width - width) / 2.0;
  CGFloat originY = window.safeAreaInsets.top + EXPerfMonitorTopMargin;

  return CGRectMake(originX, originY, width, height);
}

- (void)updateContainerForContentSize:(CGSize)contentSize
{
  if (!self.container || !self.presenter) {
    return;
  }

  CGRect frame = self.container.frame;
  if (CGRectEqualToRect(frame, CGRectZero)) {
    return;
  }

  UIWindow *window = self.container.window ?: RCTSharedApplication().delegate.window ?: RCTKeyWindow();
  CGFloat targetWidth = EXPerfMonitorTargetWidthForWindow(window);

  CGSize adjustedSize;
  if (CGSizeEqualToSize(contentSize, CGSizeZero)) {
    adjustedSize = CGSizeMake(targetWidth, EXPerfMonitorMinimumHeight);
  } else {
    adjustedSize.width = MAX(MIN(contentSize.width, targetWidth), EXPerfMonitorDefaultWidth);
    adjustedSize.height = MAX(contentSize.height, EXPerfMonitorMinimumHeight);
  }

  frame.size = adjustedSize;
  self.container.frame = frame;
  self.presenter.view.frame = self.container.bounds;
  [self bringContainerToFront];
}

- (void)bringContainerToFront
{
  UIView *superview = self.container.superview;
  if (superview && superview.subviews.lastObject != self.container) {
    [superview bringSubviewToFront:self.container];
  }
}

- (void)perfMonitorDidUpdateStats:(EXPerfMonitorStatsSnapshot *)stats
{
  if (!self.presenter) {
    return;
  }
  [self.presenter updateStatsWithMemoryMB:@(stats.memoryMB)
                                   heapMB:@(stats.heapMB)
                         layoutDurationMS:@(stats.layoutDurationMS)];
}

- (void)perfMonitorDidUpdateFPS:(EXPerfMonitorFPSState *)fpsState track:(EXPerfMonitorTrack)track
{
  if (!self.presenter) {
    return;
  }
  NSArray<NSNumber *> *history = fpsState.history ?: @[];
  PerfMonitorTrack bridgeTrack = (track == EXPerfMonitorTrackUI) ? PerfMonitorTrackUi : PerfMonitorTrackJs;
  [self.presenter updateTrack:bridgeTrack currentFPS:@(fpsState.currentFPS) history:history];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end
