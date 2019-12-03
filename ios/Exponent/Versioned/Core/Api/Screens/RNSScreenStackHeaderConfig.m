#import "RNSScreenStackHeaderConfig.h"
#import "RNSScreen.h"

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTShadowView.h>

@interface RNSScreenHeaderItemMeasurements : NSObject
@property (nonatomic, readonly) CGSize headerSize;
@property (nonatomic, readonly) CGFloat leftPadding;
@property (nonatomic, readonly) CGFloat rightPadding;

- (instancetype)initWithHeaderSize:(CGSize)headerSize leftPadding:(CGFloat)leftPadding rightPadding:(CGFloat)rightPadding;
@end

@implementation RNSScreenHeaderItemMeasurements

- (instancetype)initWithHeaderSize:(CGSize)headerSize leftPadding:(CGFloat)leftPadding rightPadding:(CGFloat)rightPadding
{
  if (self = [super init]) {
    _headerSize = headerSize;
    _leftPadding = leftPadding;
    _rightPadding = rightPadding;
  }
  return self;
}

@end

@interface RNSScreenStackHeaderSubview : UIView

@property (nonatomic, weak) UIView *reactSuperview;
@property (nonatomic) RNSScreenStackHeaderSubviewType type;

@end

@implementation RNSScreenStackHeaderConfig {
  NSMutableArray<RNSScreenStackHeaderSubview *> *_reactSubviews;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.hidden = YES;
    _translucent = YES;
    _reactSubviews = [NSMutableArray new];
    _gestureEnabled = YES;
  }
  return self;
}

- (void)insertReactSubview:(RNSScreenStackHeaderSubview *)subview atIndex:(NSInteger)atIndex
{
  [_reactSubviews insertObject:subview atIndex:atIndex];
  subview.reactSuperview = self;
}

- (void)removeReactSubview:(RNSScreenStackHeaderSubview *)subview
{
  [_reactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)reactSubviews
{
  return _reactSubviews;
}

- (UIView *)reactSuperview
{
  return _screenView;
}

- (void)removeFromSuperview
{
  [super removeFromSuperview];
  _screenView = nil;
}

- (void)updateViewControllerIfNeeded
{
  UIViewController *vc = _screenView.controller;
  UINavigationController *nav = (UINavigationController*) vc.parentViewController;
  if (vc != nil && nav.visibleViewController == vc) {
    [RNSScreenStackHeaderConfig updateViewController:self.screenView.controller withConfig:self];
  }
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self updateViewControllerIfNeeded];
}

- (void)didUpdateReactSubviews
{
  [super didUpdateReactSubviews];
  [self updateViewControllerIfNeeded];
}

+ (void)setAnimatedConfig:(UIViewController *)vc withConfig:(RNSScreenStackHeaderConfig *)config
{
  UINavigationBar *navbar = ((UINavigationController *)vc.parentViewController).navigationBar;
  [navbar setTintColor:config.color];

  if (@available(iOS 13.0, *)) {
    // font customized on the navigation item level, so nothing to do here
  } else {
    BOOL hideShadow = config.hideShadow;

    if (config.backgroundColor && CGColorGetAlpha(config.backgroundColor.CGColor) == 0.) {
      [navbar setBackgroundImage:[UIImage new] forBarMetrics:UIBarMetricsDefault];
      [navbar setBarTintColor:[UIColor clearColor]];
      hideShadow = YES;
    } else {
      [navbar setBackgroundImage:nil forBarMetrics:UIBarMetricsDefault];
      [navbar setBarTintColor:config.backgroundColor];
    }
    [navbar setTranslucent:config.translucent];
    [navbar setValue:@(hideShadow ? YES : NO) forKey:@"hidesShadow"];

    if (config.titleFontFamily || config.titleFontSize || config.titleColor) {
      NSMutableDictionary *attrs = [NSMutableDictionary new];

      if (config.titleColor) {
        attrs[NSForegroundColorAttributeName] = config.titleColor;
      }

      CGFloat size = config.titleFontSize ? [config.titleFontSize floatValue] : 17;
      if (config.titleFontFamily) {
        attrs[NSFontAttributeName] = [UIFont fontWithName:config.titleFontFamily size:size];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:size];
      }
      [navbar setTitleTextAttributes:attrs];
    }

    if (@available(iOS 11.0, *)) {
      if (config.largeTitle && (config.largeTitleFontFamily || config.largeTitleFontSize || config.titleColor)) {
        NSMutableDictionary *largeAttrs = [NSMutableDictionary new];
        if (config.titleColor) {
          largeAttrs[NSForegroundColorAttributeName] = config.titleColor;
        }
        CGFloat largeSize = config.largeTitleFontSize ? [config.largeTitleFontSize floatValue] : 34;
        if (config.largeTitleFontFamily) {
          largeAttrs[NSFontAttributeName] = [UIFont fontWithName:config.largeTitleFontFamily size:largeSize];
        } else {
          largeAttrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:largeSize];
        }
        [navbar setLargeTitleTextAttributes:largeAttrs];
      }
    }
  }
}

+ (void)setTitleAttibutes:(NSDictionary *)attrs forButton:(UIBarButtonItem *)button
{
  [button setTitleTextAttributes:attrs forState:UIControlStateNormal];
  [button setTitleTextAttributes:attrs forState:UIControlStateHighlighted];
  [button setTitleTextAttributes:attrs forState:UIControlStateDisabled];
  [button setTitleTextAttributes:attrs forState:UIControlStateSelected];
  if (@available(iOS 9.0, *)) {
    [button setTitleTextAttributes:attrs forState:UIControlStateFocused];
  }
}

+ (void)willShowViewController:(UIViewController *)vc withConfig:(RNSScreenStackHeaderConfig *)config
{
  [self updateViewController:vc withConfig:config];
}

+ (void)updateViewController:(UIViewController *)vc withConfig:(RNSScreenStackHeaderConfig *)config
{
  UINavigationItem *navitem = vc.navigationItem;
  UINavigationController *navctr = (UINavigationController *)vc.parentViewController;

  NSUInteger currentIndex = [navctr.viewControllers indexOfObject:vc];
  UINavigationItem *prevItem = currentIndex > 0 ? [navctr.viewControllers objectAtIndex:currentIndex - 1].navigationItem : nil;

  BOOL wasHidden = navctr.navigationBarHidden;
  BOOL shouldHide = config == nil || config.hide;

  if (!shouldHide && !config.translucent) {
    // when nav bar is not translucent we chage edgesForExtendedLayout to avoid system laying out
    // the screen underneath navigation controllers
    vc.edgesForExtendedLayout = UIRectEdgeNone;
  } else {
    // system default is UIRectEdgeAll
    vc.edgesForExtendedLayout = UIRectEdgeAll;
  }

  [navctr setNavigationBarHidden:shouldHide animated:YES];
  navctr.interactivePopGestureRecognizer.enabled = config.gestureEnabled;
#ifdef __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    vc.modalInPresentation = !config.gestureEnabled;
  }
#endif
  if (shouldHide) {
    return;
  }

  navitem.title = config.title;
  navitem.hidesBackButton = config.hideBackButton;
  if (config.backTitle != nil) {
    prevItem.backBarButtonItem = [[UIBarButtonItem alloc]
                                  initWithTitle:config.backTitle
                                  style:UIBarButtonItemStylePlain
                                  target:nil
                                  action:nil];
    if (config.backTitleFontFamily || config.backTitleFontSize) {
      NSMutableDictionary *attrs = [NSMutableDictionary new];
      CGFloat size = config.backTitleFontSize ? [config.backTitleFontSize floatValue] : 17;
      if (config.backTitleFontFamily) {
        attrs[NSFontAttributeName] = [UIFont fontWithName:config.backTitleFontFamily size:size];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:size];
      }
      [self setTitleAttibutes:attrs forButton:prevItem.backBarButtonItem];
    }
  } else {
    prevItem.backBarButtonItem = nil;
  }

  if (@available(iOS 11.0, *)) {
    if (config.largeTitle) {
      navctr.navigationBar.prefersLargeTitles = YES;
    }
    navitem.largeTitleDisplayMode = config.largeTitle ? UINavigationItemLargeTitleDisplayModeAlways : UINavigationItemLargeTitleDisplayModeNever;
  }
#ifdef __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    UINavigationBarAppearance *appearance = [UINavigationBarAppearance new];

    if (config.backgroundColor && CGColorGetAlpha(config.backgroundColor.CGColor) == 0.) {
      // transparent background color
      [appearance configureWithTransparentBackground];
    } else {
      // non-transparent background or default background
      if (config.translucent) {
        [appearance configureWithDefaultBackground];
      } else {
        [appearance configureWithOpaqueBackground];
      }

      // set background color if specified
      if (config.backgroundColor) {
        appearance.backgroundColor = config.backgroundColor;
      }
    }

    if (config.backgroundColor && CGColorGetAlpha(config.backgroundColor.CGColor) == 0.) {
      appearance.backgroundColor = config.backgroundColor;
    }

    if (config.hideShadow) {
      appearance.shadowColor = nil;
    }

    if (config.titleFontFamily || config.titleFontSize || config.titleColor) {
      NSMutableDictionary *attrs = [NSMutableDictionary new];

      if (config.titleColor) {
        attrs[NSForegroundColorAttributeName] = config.titleColor;
      }

      CGFloat size = config.titleFontSize ? [config.titleFontSize floatValue] : 17;
      if (config.titleFontFamily) {
        attrs[NSFontAttributeName] = [UIFont fontWithName:config.titleFontFamily size:size];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:size];
      }
      appearance.titleTextAttributes = attrs;
    }

    if (config.largeTitleFontFamily || config.largeTitleFontSize || config.titleColor) {
      NSMutableDictionary *largeAttrs = [NSMutableDictionary new];

      if (config.titleColor) {
        largeAttrs[NSForegroundColorAttributeName] = config.titleColor;
      }

      CGFloat largeSize = config.largeTitleFontSize ? [config.largeTitleFontSize floatValue] : 34;
      if (config.largeTitleFontFamily) {
        largeAttrs[NSFontAttributeName] = [UIFont fontWithName:config.largeTitleFontFamily size:largeSize];
      } else {
        largeAttrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:largeSize];
      }

      appearance.largeTitleTextAttributes = largeAttrs;
    }

    navitem.standardAppearance = appearance;
    navitem.compactAppearance = appearance;
    navitem.scrollEdgeAppearance = appearance;
  }
#endif
  for (RNSScreenStackHeaderSubview *subview in config.reactSubviews) {
    switch (subview.type) {
      case RNSScreenStackHeaderSubviewTypeLeft: {
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.leftBarButtonItem = buttonItem;
        break;
      }
      case RNSScreenStackHeaderSubviewTypeRight: {
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.rightBarButtonItem = buttonItem;
        break;
      }
      case RNSScreenStackHeaderSubviewTypeCenter:
      case RNSScreenStackHeaderSubviewTypeTitle: {
        subview.translatesAutoresizingMaskIntoConstraints = NO;
        navitem.titleView = subview;
        break;
      }
    }
  }

  if (vc.transitionCoordinator != nil && !wasHidden) {
    [vc.transitionCoordinator animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {

    } completion:nil];
    [vc.transitionCoordinator animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext>  _Nonnull context) {
      [self setAnimatedConfig:vc withConfig:config];
    } completion:^(id<UIViewControllerTransitionCoordinatorContext>  _Nonnull context) {
      if ([context isCancelled]) {
        UIViewController* fromVC = [context  viewControllerForKey:UITransitionContextFromViewControllerKey];
        RNSScreenStackHeaderConfig* config = nil;
        for (UIView *subview in fromVC.view.reactSubviews) {
          if ([subview isKindOfClass:[RNSScreenStackHeaderConfig class]]) {
            config = (RNSScreenStackHeaderConfig*) subview;
            break;
          }
        }
        [self setAnimatedConfig:fromVC withConfig:config];
      }
    }];
  } else {
    [self setAnimatedConfig:vc withConfig:config];
  }
}

@end

@implementation RNSScreenStackHeaderConfigManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RNSScreenStackHeaderConfig new];
}

RCT_EXPORT_VIEW_PROPERTY(title, NSString)
RCT_EXPORT_VIEW_PROPERTY(titleFontFamily, NSString)
RCT_EXPORT_VIEW_PROPERTY(titleFontSize, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(backTitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(backTitleFontFamily, NSString)
RCT_EXPORT_VIEW_PROPERTY(backTitleFontSize, NSString)
RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
RCT_EXPORT_VIEW_PROPERTY(largeTitle, BOOL)
RCT_EXPORT_VIEW_PROPERTY(largeTitleFontFamily, NSString)
RCT_EXPORT_VIEW_PROPERTY(largeTitleFontSize, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(hideBackButton, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hideShadow, BOOL)
// `hidden` is an UIView property, we need to use different name internally
RCT_REMAP_VIEW_PROPERTY(hidden, hide, BOOL)
RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)
RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)

@end

@implementation RCTConvert (RNSScreenStackHeader)

RCT_ENUM_CONVERTER(RNSScreenStackHeaderSubviewType, (@{
   @"left": @(RNSScreenStackHeaderSubviewTypeLeft),
   @"right": @(RNSScreenStackHeaderSubviewTypeRight),
   @"title": @(RNSScreenStackHeaderSubviewTypeTitle),
   @"center": @(RNSScreenStackHeaderSubviewTypeCenter),
   }), RNSScreenStackHeaderSubviewTypeTitle, integerValue)

@end

@implementation RNSScreenStackHeaderSubview {
  __weak RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (!self.translatesAutoresizingMaskIntoConstraints) {
    CGSize size = self.superview.frame.size;
    CGFloat right = size.width - self.frame.size.width - self.frame.origin.x;
    CGFloat left = self.frame.origin.x;
    [_bridge.uiManager
     setLocalData:[[RNSScreenHeaderItemMeasurements alloc]
                   initWithHeaderSize:size
                   leftPadding:left rightPadding:right]
     forView:self];
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  if (self.translatesAutoresizingMaskIntoConstraints) {
    [super reactSetFrame:frame];
  }
}

- (CGSize)intrinsicContentSize
{
  return UILayoutFittingExpandedSize;
}

@end

@interface RNSScreenStackHeaderSubviewShadow : RCTShadowView
@end

@implementation RNSScreenStackHeaderSubviewShadow

- (void)setLocalData:(RNSScreenHeaderItemMeasurements *)data
{
  self.width = (YGValue){data.headerSize.width - data.leftPadding - data.rightPadding, YGUnitPoint};
  self.height = (YGValue){data.headerSize.height, YGUnitPoint};

  if (data.leftPadding > data.rightPadding) {
    self.paddingLeft = (YGValue){0, YGUnitPoint};
    self.paddingRight = (YGValue){data.leftPadding - data.rightPadding, YGUnitPoint};
  } else {
    self.paddingLeft = (YGValue){data.rightPadding - data.leftPadding, YGUnitPoint};
    self.paddingRight = (YGValue){0, YGUnitPoint};
  }
  [self didSetProps:@[@"width", @"height", @"paddingLeft", @"paddingRight"]];
}

@end

@implementation RNSScreenStackHeaderSubviewManager

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(type, RNSScreenStackHeaderSubviewType)

- (UIView *)view
{
  return [[RNSScreenStackHeaderSubview alloc] initWithBridge:self.bridge];
}

- (RCTShadowView *)shadowView
{
  return [RNSScreenStackHeaderSubviewShadow new];
}

@end
