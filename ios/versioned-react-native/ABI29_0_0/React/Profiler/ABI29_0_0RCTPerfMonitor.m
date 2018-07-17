/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTDefines.h"

#if ABI29_0_0RCT_DEV

#import <dlfcn.h>

#import <mach/mach.h>

#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTDevSettings.h"
#import "ABI29_0_0RCTFPSGraph.h"
#import "ABI29_0_0RCTInvalidating.h"
#import "ABI29_0_0RCTJavaScriptExecutor.h"
#import "ABI29_0_0RCTPerformanceLogger.h"
#import "ABI29_0_0RCTRootView.h"
#import "ABI29_0_0RCTUIManager.h"
#import "ABI29_0_0RCTBridge+Private.h"
#import "ABI29_0_0RCTUtils.h"

#if __has_include("ABI29_0_0RCTDevMenu.h")
#import "ABI29_0_0RCTDevMenu.h"
#endif

static NSString *const ABI29_0_0RCTPerfMonitorCellIdentifier = @"ABI29_0_0RCTPerfMonitorCellIdentifier";

static CGFloat const ABI29_0_0RCTPerfMonitorBarHeight = 50;
static CGFloat const ABI29_0_0RCTPerfMonitorExpandHeight = 250;

typedef BOOL (*ABI29_0_0RCTJSCSetOptionType)(const char *);

static BOOL ABI29_0_0RCTJSCSetOption(const char *option)
{
  static ABI29_0_0RCTJSCSetOptionType setOption;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    /**
     * JSC private C++ static method to toggle options at runtime
     *
     * JSC::Options::setOptions - JavaScriptCore/runtime/Options.h
     */
    setOption = dlsym(RTLD_DEFAULT, "_ZN3JSC7Options9setOptionEPKc");

    if (ABI29_0_0RCT_DEBUG && setOption == NULL) {
      ABI29_0_0RCTLogWarn(@"The symbol used to enable JSC runtime options is not available in this iOS version");
    }
  });

  if (setOption) {
    return setOption(option);
  } else {
    return NO;
  }
}

static vm_size_t ABI29_0_0RCTGetResidentMemorySize(void)
{
  struct task_basic_info info;
  mach_msg_type_number_t size = sizeof(info);
  kern_return_t kerr = task_info(mach_task_self(),
                                 TASK_BASIC_INFO,
                                 (task_info_t)&info,
                                 &size);
  if (kerr != KERN_SUCCESS) {
    return 0;
  }

  return info.resident_size;
}

@interface ABI29_0_0RCTPerfMonitor : NSObject <ABI29_0_0RCTBridgeModule, ABI29_0_0RCTInvalidating, UITableViewDataSource, UITableViewDelegate>

#if __has_include("ABI29_0_0RCTDevMenu.h")
@property (nonatomic, strong, readonly) ABI29_0_0RCTDevMenuItem *devMenuItem;
#endif
@property (nonatomic, strong, readonly) UIPanGestureRecognizer *gestureRecognizer;
@property (nonatomic, strong, readonly) UIView *container;
@property (nonatomic, strong, readonly) UILabel *memory;
@property (nonatomic, strong, readonly) UILabel *heap;
@property (nonatomic, strong, readonly) UILabel *views;
@property (nonatomic, strong, readonly) UITableView *metrics;
@property (nonatomic, strong, readonly) ABI29_0_0RCTFPSGraph *jsGraph;
@property (nonatomic, strong, readonly) ABI29_0_0RCTFPSGraph *uiGraph;
@property (nonatomic, strong, readonly) UILabel *jsGraphLabel;
@property (nonatomic, strong, readonly) UILabel *uiGraphLabel;

@end

@implementation ABI29_0_0RCTPerfMonitor {
#if __has_include("ABI29_0_0RCTDevMenu.h")
  ABI29_0_0RCTDevMenuItem *_devMenuItem;
#endif
  UIPanGestureRecognizer *_gestureRecognizer;
  UIView *_container;
  UILabel *_memory;
  UILabel *_heap;
  UILabel *_views;
  UILabel *_uiGraphLabel;
  UILabel *_jsGraphLabel;
  UITableView *_metrics;

  ABI29_0_0RCTFPSGraph *_uiGraph;
  ABI29_0_0RCTFPSGraph *_jsGraph;

  CADisplayLink *_uiDisplayLink;
  CADisplayLink *_jsDisplayLink;

  NSUInteger _heapSize;

  dispatch_queue_t _queue;
  dispatch_io_t _io;
  int _stderr;
  int _pipe[2];
  NSString *_remaining;

  CGRect _storedMonitorFrame;

  NSArray *_perfLoggerMarks;
}

@synthesize bridge = _bridge;

ABI29_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setBridge:(ABI29_0_0RCTBridge *)bridge
{
  _bridge = bridge;

#if __has_include("ABI29_0_0RCTDevMenu.h")
  [_bridge.devMenu addItem:self.devMenuItem];
#endif
}

- (void)invalidate
{
  [self hide];
}

#if __has_include("ABI29_0_0RCTDevMenu.h")
- (ABI29_0_0RCTDevMenuItem *)devMenuItem
{
  if (!_devMenuItem) {
    __weak __typeof__(self) weakSelf = self;
    __weak ABI29_0_0RCTDevSettings *devSettings = self.bridge.devSettings;
    _devMenuItem =
    [ABI29_0_0RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return (devSettings.isPerfMonitorShown) ?
        @"Hide Perf Monitor" :
        @"Show Perf Monitor";
    } handler:^{
      if (devSettings.isPerfMonitorShown) {
        [weakSelf hide];
        devSettings.isPerfMonitorShown = NO;
      } else {
        [weakSelf show];
        devSettings.isPerfMonitorShown = YES;
      }
    }];
  }

  return _devMenuItem;
}
#endif

- (UIPanGestureRecognizer *)gestureRecognizer
{
  if (!_gestureRecognizer) {
    _gestureRecognizer = [[UIPanGestureRecognizer alloc] initWithTarget:self
                                                                 action:@selector(gesture:)];
  }

  return _gestureRecognizer;
}

- (UIView *)container
{
  if (!_container) {
    _container = [[UIView alloc] initWithFrame:CGRectMake(10, 25, 180, ABI29_0_0RCTPerfMonitorBarHeight)];
    _container.backgroundColor = UIColor.whiteColor;
    _container.layer.borderWidth = 2;
    _container.layer.borderColor = [UIColor lightGrayColor].CGColor;
    [_container addGestureRecognizer:self.gestureRecognizer];
    [_container addGestureRecognizer:[[UITapGestureRecognizer alloc] initWithTarget:self
                                                                             action:@selector(tap)]];
  }

  return _container;
}

- (UILabel *)memory
{
  if (!_memory) {
    _memory = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, 44, ABI29_0_0RCTPerfMonitorBarHeight)];
    _memory.font = [UIFont systemFontOfSize:12];
    _memory.numberOfLines = 3;
    _memory.textAlignment = NSTextAlignmentCenter;
  }

  return _memory;
}

- (UILabel *)heap
{
  if (!_heap) {
    _heap = [[UILabel alloc] initWithFrame:CGRectMake(44, 0, 44, ABI29_0_0RCTPerfMonitorBarHeight)];
    _heap.font = [UIFont systemFontOfSize:12];
    _heap.numberOfLines = 3;
    _heap.textAlignment = NSTextAlignmentCenter;
  }

  return _heap;
}

- (UILabel *)views
{
  if (!_views) {
    _views = [[UILabel alloc] initWithFrame:CGRectMake(88, 0, 44, ABI29_0_0RCTPerfMonitorBarHeight)];
    _views.font = [UIFont systemFontOfSize:12];
    _views.numberOfLines = 3;
    _views.textAlignment = NSTextAlignmentCenter;
  }

  return _views;
}

- (ABI29_0_0RCTFPSGraph *)uiGraph
{
  if (!_uiGraph) {
    _uiGraph = [[ABI29_0_0RCTFPSGraph alloc] initWithFrame:CGRectMake(134, 14, 40, 30)
                                            color:[UIColor lightGrayColor]];
  }
  return _uiGraph;
}

- (ABI29_0_0RCTFPSGraph *)jsGraph
{
  if (!_jsGraph) {
    _jsGraph = [[ABI29_0_0RCTFPSGraph alloc] initWithFrame:CGRectMake(178, 14, 40, 30)
                                            color:[UIColor lightGrayColor]];
  }
  return _jsGraph;
}

- (UILabel *)uiGraphLabel
{
  if (!_uiGraphLabel) {
    _uiGraphLabel = [[UILabel alloc] initWithFrame:CGRectMake(134, 3, 40, 10)];
    _uiGraphLabel.font = [UIFont systemFontOfSize:11];
    _uiGraphLabel.textAlignment = NSTextAlignmentCenter;
    _uiGraphLabel.text = @"UI";
  }

  return _uiGraphLabel;
}

- (UILabel *)jsGraphLabel
{
  if (!_jsGraphLabel) {
    _jsGraphLabel = [[UILabel alloc] initWithFrame:CGRectMake(178, 3, 38, 10)];
    _jsGraphLabel.font = [UIFont systemFontOfSize:11];
    _jsGraphLabel.textAlignment = NSTextAlignmentCenter;
    _jsGraphLabel.text = @"JS";
  }

  return _jsGraphLabel;
}

- (UITableView *)metrics
{
  if (!_metrics) {
    _metrics = [[UITableView alloc] initWithFrame:CGRectMake(
      0,
      ABI29_0_0RCTPerfMonitorBarHeight,
      self.container.frame.size.width,
      self.container.frame.size.height - ABI29_0_0RCTPerfMonitorBarHeight
    )];
    _metrics.dataSource = self;
    _metrics.delegate = self;
    _metrics.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    [_metrics registerClass:[UITableViewCell class] forCellReuseIdentifier:ABI29_0_0RCTPerfMonitorCellIdentifier];
  }

  return _metrics;
}

- (void)show
{
  if (_container) {
    return;
  }

  [self.container addSubview:self.memory];
  [self.container addSubview:self.heap];
  [self.container addSubview:self.views];
  [self.container addSubview:self.uiGraph];
  [self.container addSubview:self.uiGraphLabel];

  [self redirectLogs];

  ABI29_0_0RCTJSCSetOption("logGC=1");

  [self updateStats];

  UIWindow *window = ABI29_0_0RCTSharedApplication().delegate.window;
  [window addSubview:self.container];


  _uiDisplayLink = [CADisplayLink displayLinkWithTarget:self
                                               selector:@selector(threadUpdate:)];
  [_uiDisplayLink addToRunLoop:[NSRunLoop mainRunLoop]
                       forMode:NSRunLoopCommonModes];

  self.container.frame = (CGRect) {
    self.container.frame.origin, {
      self.container.frame.size.width + 44,
      self.container.frame.size.height
    }
  };
  [self.container addSubview:self.jsGraph];
  [self.container addSubview:self.jsGraphLabel];

  [_bridge dispatchBlock:^{
    self->_jsDisplayLink = [CADisplayLink displayLinkWithTarget:self
                                                       selector:@selector(threadUpdate:)];
    [self->_jsDisplayLink addToRunLoop:[NSRunLoop currentRunLoop]
                               forMode:NSRunLoopCommonModes];
  } queue:ABI29_0_0RCTJSThread];
}

- (void)hide
{
  if (!_container) {
    return;
  }

  [self.container removeFromSuperview];
  _container = nil;
  _jsGraph = nil;
  _uiGraph = nil;

  ABI29_0_0RCTJSCSetOption("logGC=0");

  [self stopLogs];

  [_uiDisplayLink invalidate];
  [_jsDisplayLink invalidate];

  _uiDisplayLink = nil;
  _jsDisplayLink = nil;
}

- (void)redirectLogs
{
  _stderr = dup(STDERR_FILENO);

  if (pipe(_pipe) != 0) {
    return;
  }

  dup2(_pipe[1], STDERR_FILENO);
  close(_pipe[1]);

  __weak __typeof__(self) weakSelf = self;
  _queue = dispatch_queue_create("com.facebook.ReactABI29_0_0.ABI29_0_0RCTPerfMonitor", DISPATCH_QUEUE_SERIAL);
  _io = dispatch_io_create(
    DISPATCH_IO_STREAM,
    _pipe[0],
    _queue,
    ^(__unused int error) {});

  dispatch_io_set_low_water(_io, 20);

  dispatch_io_read(
    _io,
    0,
    SIZE_MAX,
    _queue,
    ^(__unused bool done, dispatch_data_t data, __unused int error) {
      if (!data) {
        return;
    }

      dispatch_data_apply(
        data,
        ^bool(
          __unused dispatch_data_t region,
          __unused size_t offset,
          const void *buffer,
          size_t size
        ) {
          write(self->_stderr, buffer, size);

          NSString *log = [[NSString alloc] initWithBytes:buffer
                                                   length:size
                                                 encoding:NSUTF8StringEncoding];
          [weakSelf parse:log];
          return true;
        });
    });
}

- (void)stopLogs
{
  dup2(_stderr, STDERR_FILENO);
  dispatch_io_close(_io, 0);
}

- (void)parse:(NSString *)log
{
  static NSRegularExpression *GCRegex;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *pattern = @"\\[GC: [\\d\\.]+ \\wb => (Eden|Full)Collection, (?:Skipped copying|Did copy), ([\\d\\.]+) \\wb, [\\d.]+ \\ws\\]";
    GCRegex = [NSRegularExpression regularExpressionWithPattern:pattern
                                                        options:0
                                                          error:nil];
  });

  if (_remaining) {
    log = [_remaining stringByAppendingString:log];
    _remaining = nil;
  }

  NSArray<NSString *> *lines = [log componentsSeparatedByString:@"\n"];
  if (lines.count == 1) { // no newlines
    _remaining = log;
    return;
  }

  for (NSString *line in lines) {
    NSTextCheckingResult *match = [GCRegex firstMatchInString:line options:0 range:NSMakeRange(0, line.length)];
    if (match) {
      NSString *heapSizeStr = [line substringWithRange:[match rangeAtIndex:2]];
      _heapSize = [heapSizeStr integerValue];
    }
  }
}

- (void)updateStats
{
  NSDictionary<NSNumber *, UIView *> *views = [_bridge.uiManager valueForKey:@"viewRegistry"];
  NSUInteger viewCount = views.count;
  NSUInteger visibleViewCount = 0;
  for (UIView *view in views.allValues) {
    if (view.window || view.superview.window) {
      visibleViewCount++;
    }
  }

  double mem = (double)ABI29_0_0RCTGetResidentMemorySize() / 1024 / 1024;
  self.memory.text  =[NSString stringWithFormat:@"RAM\n%.2lf\nMB", mem];
  self.heap.text = [NSString stringWithFormat:@"JSC\n%.2lf\nMB", (double)_heapSize / 1024];
  self.views.text = [NSString stringWithFormat:@"Views\n%lu\n%lu", (unsigned long)visibleViewCount, (unsigned long)viewCount];

  __weak __typeof__(self) weakSelf = self;
  dispatch_after(
    dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)),
    dispatch_get_main_queue(),
    ^{
      __strong __typeof__(weakSelf) strongSelf = weakSelf;
      if (strongSelf && strongSelf->_container.superview) {
        [strongSelf updateStats];
      }
    });
}

- (void)gesture:(UIPanGestureRecognizer *)gestureRecognizer
{
  CGPoint translation = [gestureRecognizer translationInView:self.container.superview];
  self.container.center = CGPointMake(
    self.container.center.x + translation.x,
    self.container.center.y + translation.y
  );
  [gestureRecognizer setTranslation:CGPointMake(0, 0)
                             inView:self.container.superview];
}

- (void)tap
{
  [self loadPerformanceLoggerData];
  if (CGRectIsEmpty(_storedMonitorFrame)) {
    _storedMonitorFrame = CGRectMake(0, 20, self.container.window.frame.size.width, ABI29_0_0RCTPerfMonitorExpandHeight);
    [self.container addSubview:self.metrics];
  } else {
    [_metrics reloadData];
  }

  [UIView animateWithDuration:.25 animations:^{
    CGRect tmp = self.container.frame;
    self.container.frame = self->_storedMonitorFrame;
    self->_storedMonitorFrame = tmp;
  }];
}

- (void)threadUpdate:(CADisplayLink *)displayLink
{
  ABI29_0_0RCTFPSGraph *graph = displayLink == _jsDisplayLink ? _jsGraph : _uiGraph;
  [graph onTick:displayLink.timestamp];
}

- (void)loadPerformanceLoggerData
{
  NSUInteger i = 0;
  NSMutableArray<NSString *> *data = [NSMutableArray new];
  ABI29_0_0RCTPerformanceLogger *performanceLogger = [_bridge performanceLogger];
  NSArray<NSNumber *> *values = [performanceLogger valuesForTags];
  for (NSString *label in [performanceLogger labelsForTags]) {
    long long value = values[i+1].longLongValue - values[i].longLongValue;
    NSString *unit = @"ms";
    if ([label hasSuffix:@"Size"]) {
      unit = @"b";
    } else if ([label hasSuffix:@"Count"]) {
      unit = @"";
    }
    [data addObject:[NSString stringWithFormat:@"%@: %lld%@", label, value, unit]];
    i += 2;
  }
  _perfLoggerMarks = [data copy];
}

#pragma mark - UITableViewDataSource

- (NSInteger)numberOfSectionsInTableView:(__unused UITableView *)tableView
{
  return 1;
}

- (NSInteger)tableView:(__unused UITableView *)tableView
 numberOfRowsInSection:(__unused NSInteger)section
{
  return _perfLoggerMarks.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView
         cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:ABI29_0_0RCTPerfMonitorCellIdentifier
                                                          forIndexPath:indexPath];

  if (!cell) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault
                                  reuseIdentifier:ABI29_0_0RCTPerfMonitorCellIdentifier];
  }

  cell.textLabel.text = _perfLoggerMarks[indexPath.row];
  cell.textLabel.font = [UIFont systemFontOfSize:12];

  return cell;
}

#pragma mark - UITableViewDelegate

- (CGFloat)tableView:(__unused UITableView *)tableView
heightForRowAtIndexPath:(__unused NSIndexPath *)indexPath
{
  return 20;
}

@end

#endif
