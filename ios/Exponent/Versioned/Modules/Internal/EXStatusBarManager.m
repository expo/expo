
#import "EXStatusBarManager.h"
#import "EXUnversioned.h"

#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUtils.h"

#if !TARGET_OS_TV
@implementation RCTConvert (EXStatusBar)

RCT_ENUM_CONVERTER(UIStatusBarStyle, (@{
  @"default": @(UIStatusBarStyleDefault),
  @"light-content": @(UIStatusBarStyleLightContent),
  @"dark-content": @(UIStatusBarStyleDefault),
}), UIStatusBarStyleDefault, integerValue);

RCT_ENUM_CONVERTER(UIStatusBarAnimation, (@{
  @"none": @(UIStatusBarAnimationNone),
  @"fade": @(UIStatusBarAnimationFade),
  @"slide": @(UIStatusBarAnimationSlide),
}), UIStatusBarAnimationNone, integerValue);

@end
#endif

@interface EXStatusBarManager ()

@property (nonatomic, assign) BOOL networkActivityIndicatorVisible;
@property (nonatomic, assign) BOOL hidden;
@property (nonatomic, assign) UIStatusBarStyle style;

@end

@implementation EXStatusBarManager

+ (NSString *)moduleName { return @"RCTStatusBarManager"; }

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"statusBarFrameDidChange",
           @"statusBarFrameWillChange"];
}

#if !TARGET_OS_TV

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  [self _captureCurrentStatusBarProperties];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
}

- (void)dealloc
{
  [self stopObserving];
}

- (void)startObserving
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self selector:@selector(applicationDidChangeStatusBarFrame:) name:UIApplicationDidChangeStatusBarFrameNotification object:nil];
  [nc addObserver:self selector:@selector(applicationWillChangeStatusBarFrame:) name:UIApplicationWillChangeStatusBarFrameNotification object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)emitEvent:(NSString *)eventName forNotification:(NSNotification *)notification
{
  CGRect frame = [notification.userInfo[UIApplicationStatusBarFrameUserInfoKey] CGRectValue];
  NSDictionary *event = @{
    @"frame": @{
      @"x": @(frame.origin.x),
      @"y": @(frame.origin.y),
      @"width": @(frame.size.width),
      @"height": @(frame.size.height),
    },
  };
  [self sendEventWithName:eventName body:event];
}

- (void)applicationDidChangeStatusBarFrame:(NSNotification *)notification
{
  [self emitEvent:@"statusBarFrameDidChange" forNotification:notification];
}

- (void)applicationWillChangeStatusBarFrame:(NSNotification *)notification
{
  [self emitEvent:@"statusBarFrameWillChange" forNotification:notification];
}

RCT_EXPORT_METHOD(getHeight:(RCTResponseSenderBlock)callback)
{
  callback(@[@{
    @"height": @([UIApplication sharedApplication].statusBarFrame.size.height),
  }]);
}

RCT_EXPORT_METHOD(setStyle:(UIStatusBarStyle)statusBarStyle
                  animated:(BOOL)animated)
{
  if ([[self class] _viewControllerBasedStatusBarAppearance]) {
    RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [RCTSharedApplication() setStatusBarStyle:statusBarStyle
                                     animated:animated];
#pragma clang diagnostic pop
  }
}

RCT_EXPORT_METHOD(setHidden:(BOOL)hidden
                  withAnimation:(UIStatusBarAnimation)animation)
{
  if ([[self class] _viewControllerBasedStatusBarAppearance]) {
    RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [RCTSharedApplication() setStatusBarHidden:hidden
                                 withAnimation:animation];
#pragma clang diagnostic pop
  }
}

RCT_EXPORT_METHOD(setNetworkActivityIndicatorVisible:(BOOL)visible)
{
  RCTSharedApplication().networkActivityIndicatorVisible = visible;
}

#pragma mark - internal

+ (BOOL)_viewControllerBasedStatusBarAppearance
{
  static BOOL value;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    value = [[[NSBundle mainBundle] objectForInfoDictionaryKey:
              @"UIViewControllerBasedStatusBarAppearance"] ?: @YES boolValue];
  });
  
  return value;
}

- (void)_captureCurrentStatusBarProperties
{
  UIApplication *currentApplication = RCTSharedApplication();
  _style = currentApplication.statusBarStyle;
  _networkActivityIndicatorVisible = currentApplication.isNetworkActivityIndicatorVisible;
  _hidden = currentApplication.isStatusBarHidden;
}

- (void)_applyCapturedStatusBarProperties
{
  UIApplication *currentApplication = RCTSharedApplication();
  if (![[self class] _viewControllerBasedStatusBarAppearance]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [currentApplication setStatusBarStyle:_style animated:NO];
    [currentApplication setStatusBarHidden:_style animated:NO];
#pragma clang diagnostic pop
  }
  currentApplication.networkActivityIndicatorVisible = _networkActivityIndicatorVisible;
}

- (void)_bridgeDidForeground:(__unused NSNotification *)notif
{
  [self _applyCapturedStatusBarProperties];
}

- (void)_bridgeDidBackground:(__unused NSNotification *)notif
{
  [self _captureCurrentStatusBarProperties];
}

#endif //TARGET_OS_TV

@end
