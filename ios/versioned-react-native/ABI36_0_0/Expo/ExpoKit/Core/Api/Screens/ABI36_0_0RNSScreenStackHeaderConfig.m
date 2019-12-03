#import "ABI36_0_0RNSScreenStackHeaderConfig.h"
#import "ABI36_0_0RNSScreen.h"

#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManager.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManagerUtils.h>
#import <ABI36_0_0React/ABI36_0_0RCTShadowView.h>

@interface ABI36_0_0RNSScreenHeaderItemMeasurements : NSObject
@property (nonatomic, readonly) CGSize headerSize;
@property (nonatomic, readonly) CGFloat leftPadding;
@property (nonatomic, readonly) CGFloat rightPadding;

- (instancetype)initWithHeaderSize:(CGSize)headerSize leftPadding:(CGFloat)leftPadding rightPadding:(CGFloat)rightPadding;
@end

@implementation ABI36_0_0RNSScreenHeaderItemMeasurements

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

@interface ABI36_0_0RNSScreenStackHeaderSubview : UIView

@property (nonatomic, weak) UIView *ABI36_0_0ReactSuperview;
@property (nonatomic) ABI36_0_0RNSScreenStackHeaderSubviewType type;

@end

@implementation ABI36_0_0RNSScreenStackHeaderConfig {
  NSMutableArray<ABI36_0_0RNSScreenStackHeaderSubview *> *_ABI36_0_0ReactSubviews;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.hidden = YES;
    _translucent = YES;
    _ABI36_0_0ReactSubviews = [NSMutableArray new];
    _gestureEnabled = YES;
  }
  return self;
}

- (void)insertABI36_0_0ReactSubview:(ABI36_0_0RNSScreenStackHeaderSubview *)subview atIndex:(NSInteger)atIndex
{
  [_ABI36_0_0ReactSubviews insertObject:subview atIndex:atIndex];
  subview.ABI36_0_0ReactSuperview = self;
}

- (void)removeABI36_0_0ReactSubview:(ABI36_0_0RNSScreenStackHeaderSubview *)subview
{
  [_ABI36_0_0ReactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)ABI36_0_0ReactSubviews
{
  return _ABI36_0_0ReactSubviews;
}

- (UIView *)ABI36_0_0ReactSuperview
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
    [ABI36_0_0RNSScreenStackHeaderConfig updateViewController:self.screenView.controller withConfig:self];
  }
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self updateViewControllerIfNeeded];
}

- (void)didUpdateABI36_0_0ReactSubviews
{
  [super didUpdateABI36_0_0ReactSubviews];
  [self updateViewControllerIfNeeded];
}

+ (void)setAnimatedConfig:(UIViewController *)vc withConfig:(ABI36_0_0RNSScreenStackHeaderConfig *)config
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

+ (void)willShowViewController:(UIViewController *)vc withConfig:(ABI36_0_0RNSScreenStackHeaderConfig *)config
{
  [self updateViewController:vc withConfig:config];
}

+ (void)updateViewController:(UIViewController *)vc withConfig:(ABI36_0_0RNSScreenStackHeaderConfig *)config
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
  for (ABI36_0_0RNSScreenStackHeaderSubview *subview in config.ABI36_0_0ReactSubviews) {
    switch (subview.type) {
      case ABI36_0_0RNSScreenStackHeaderSubviewTypeLeft: {
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.leftBarButtonItem = buttonItem;
        break;
      }
      case ABI36_0_0RNSScreenStackHeaderSubviewTypeRight: {
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.rightBarButtonItem = buttonItem;
        break;
      }
      case ABI36_0_0RNSScreenStackHeaderSubviewTypeCenter:
      case ABI36_0_0RNSScreenStackHeaderSubviewTypeTitle: {
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
        ABI36_0_0RNSScreenStackHeaderConfig* config = nil;
        for (UIView *subview in fromVC.view.ABI36_0_0ReactSubviews) {
          if ([subview isKindOfClass:[ABI36_0_0RNSScreenStackHeaderConfig class]]) {
            config = (ABI36_0_0RNSScreenStackHeaderConfig*) subview;
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

@implementation ABI36_0_0RNSScreenStackHeaderConfigManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI36_0_0RNSScreenStackHeaderConfig new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontFamily, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontSize, NSNumber)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(backTitle, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(backTitleFontFamily, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(backTitleFontSize, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitle, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontFamily, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontSize, NSNumber)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(hideBackButton, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(hideShadow, BOOL)
// `hidden` is an UIView property, we need to use different name internally
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(hidden, hide, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)

@end

@implementation ABI36_0_0RCTConvert (ABI36_0_0RNSScreenStackHeader)

ABI36_0_0RCT_ENUM_CONVERTER(ABI36_0_0RNSScreenStackHeaderSubviewType, (@{
   @"left": @(ABI36_0_0RNSScreenStackHeaderSubviewTypeLeft),
   @"right": @(ABI36_0_0RNSScreenStackHeaderSubviewTypeRight),
   @"title": @(ABI36_0_0RNSScreenStackHeaderSubviewTypeTitle),
   @"center": @(ABI36_0_0RNSScreenStackHeaderSubviewTypeCenter),
   }), ABI36_0_0RNSScreenStackHeaderSubviewTypeTitle, integerValue)

@end

@implementation ABI36_0_0RNSScreenStackHeaderSubview {
  __weak ABI36_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI36_0_0RCTBridge *)bridge
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
     setLocalData:[[ABI36_0_0RNSScreenHeaderItemMeasurements alloc]
                   initWithHeaderSize:size
                   leftPadding:left rightPadding:right]
     forView:self];
  }
}

- (void)ABI36_0_0ReactSetFrame:(CGRect)frame
{
  if (self.translatesAutoresizingMaskIntoConstraints) {
    [super ABI36_0_0ReactSetFrame:frame];
  }
}

- (CGSize)intrinsicContentSize
{
  return UILayoutFittingExpandedSize;
}

@end

@interface ABI36_0_0RNSScreenStackHeaderSubviewShadow : ABI36_0_0RCTShadowView
@end

@implementation ABI36_0_0RNSScreenStackHeaderSubviewShadow

- (void)setLocalData:(ABI36_0_0RNSScreenHeaderItemMeasurements *)data
{
  self.width = (ABI36_0_0YGValue){data.headerSize.width - data.leftPadding - data.rightPadding, ABI36_0_0YGUnitPoint};
  self.height = (ABI36_0_0YGValue){data.headerSize.height, ABI36_0_0YGUnitPoint};

  if (data.leftPadding > data.rightPadding) {
    self.paddingLeft = (ABI36_0_0YGValue){0, ABI36_0_0YGUnitPoint};
    self.paddingRight = (ABI36_0_0YGValue){data.leftPadding - data.rightPadding, ABI36_0_0YGUnitPoint};
  } else {
    self.paddingLeft = (ABI36_0_0YGValue){data.rightPadding - data.leftPadding, ABI36_0_0YGUnitPoint};
    self.paddingRight = (ABI36_0_0YGValue){0, ABI36_0_0YGUnitPoint};
  }
  [self didSetProps:@[@"width", @"height", @"paddingLeft", @"paddingRight"]];
}

@end

@implementation ABI36_0_0RNSScreenStackHeaderSubviewManager

ABI36_0_0RCT_EXPORT_MODULE()

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(type, ABI36_0_0RNSScreenStackHeaderSubviewType)

- (UIView *)view
{
  return [[ABI36_0_0RNSScreenStackHeaderSubview alloc] initWithBridge:self.bridge];
}

- (ABI36_0_0RCTShadowView *)shadowView
{
  return [ABI36_0_0RNSScreenStackHeaderSubviewShadow new];
}

@end
