#import "RNSScreenContainer.h"
#import "RNSScreen.h"

#ifdef RN_FABRIC_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/Props.h>
#endif

@implementation RNScreensViewController

#if !TARGET_OS_TV
- (UIViewController *)childViewControllerForStatusBarStyle
{
  return [self findActiveChildVC];
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
  return [self findActiveChildVC].preferredStatusBarUpdateAnimation;
}

- (UIViewController *)childViewControllerForStatusBarHidden
{
  return [self findActiveChildVC];
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  return [self findActiveChildVC].supportedInterfaceOrientations;
}

- (UIViewController *)childViewControllerForHomeIndicatorAutoHidden
{
  return [self findActiveChildVC];
}
#endif

- (UIViewController *)findActiveChildVC
{
  for (UIViewController *childVC in self.childViewControllers) {
    if ([childVC isKindOfClass:[RNSScreen class]] &&
        ((RNSScreen *)childVC).screenView.activityState == RNSActivityStateOnTop) {
      return childVC;
    }
  }
  return [[self childViewControllers] lastObject];
}

@end

@implementation RNSScreenContainerView {
  BOOL _invalidated;
  NSMutableSet *_activeScreens;
}

- (instancetype)init
{
  if (self = [super init]) {
#ifdef RN_FABRIC_ENABLED
    static const auto defaultProps = std::make_shared<const facebook::react::RNSScreenContainerProps>();
    _props = defaultProps;
#endif
    _activeScreens = [NSMutableSet new];
    _reactSubviews = [NSMutableArray new];
    [self setupController];
    _invalidated = NO;
  }
  return self;
}

- (void)setupController
{
  _controller = [[RNScreensViewController alloc] init];
  [self addSubview:_controller.view];
}

- (void)markChildUpdated
{
  // We want the attaching/detaching of children to be always made on main queue, which
  // is currently true for `react-navigation` since this method is triggered
  // by the changes of `Animated` value in stack's transition or adding/removing screens
  // in all navigators
  RCTAssertMainQueue();
  [self updateContainer];
}

- (void)insertReactSubview:(RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  subview.reactSuperview = self;
  [_reactSubviews insertObject:subview atIndex:atIndex];
  [subview reactSetFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];
}

- (void)removeReactSubview:(RNSScreenView *)subview
{
  subview.reactSuperview = nil;
  [_reactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)reactSubviews
{
  return _reactSubviews;
}

- (UIViewController *)reactViewController
{
  return _controller;
}

- (UIViewController *)findChildControllerForScreen:(RNSScreenView *)screen
{
  for (UIViewController *vc in _controller.childViewControllers) {
    if (vc.view == screen) {
      return vc;
    }
  }
  return nil;
}

- (void)prepareDetach:(RNSScreenView *)screen
{
  [[self findChildControllerForScreen:screen] willMoveToParentViewController:nil];
}

- (void)detachScreen:(RNSScreenView *)screen
{
  // We use findChildControllerForScreen method instead of directly accesing
  // screen.controller because screen.controller may be reset to nil when the
  // original screen view gets detached from the view hierarchy (we reset controller
  // reference to avoid reference loops)
  UIViewController *detachController = [self findChildControllerForScreen:screen];
  [detachController willMoveToParentViewController:nil];
  [screen removeFromSuperview];
  [detachController removeFromParentViewController];
  [_activeScreens removeObject:screen];
}

- (void)attachScreen:(RNSScreenView *)screen atIndex:(NSInteger)index
{
  [_controller addChildViewController:screen.controller];
  // the frame is already set at this moment because we adjust it in insertReactSubview. We don't
  // want to update it here as react-driven animations may already run and hence changing the frame
  // would result in visual glitches
  [_controller.view insertSubview:screen.controller.view atIndex:index];
  [screen.controller didMoveToParentViewController:_controller];
  [_activeScreens addObject:screen];
}

- (void)updateContainer
{
  BOOL screenRemoved = NO;
  // remove screens that are no longer active
  NSMutableSet *orphaned = [NSMutableSet setWithSet:_activeScreens];
  for (RNSScreenView *screen in _reactSubviews) {
    if (screen.activityState == RNSActivityStateInactive && [_activeScreens containsObject:screen]) {
      screenRemoved = YES;
      [self detachScreen:screen];
    }
    [orphaned removeObject:screen];
  }
  for (RNSScreenView *screen in orphaned) {
    screenRemoved = YES;
    [self detachScreen:screen];
  }

  // detect if new screen is going to be activated
  BOOL screenAdded = NO;
  for (RNSScreenView *screen in _reactSubviews) {
    if (screen.activityState != RNSActivityStateInactive && ![_activeScreens containsObject:screen]) {
      screenAdded = YES;
    }
  }

  if (screenAdded) {
    // add new screens in order they are placed in subviews array
    NSInteger index = 0;
    for (RNSScreenView *screen in _reactSubviews) {
      if (screen.activityState != RNSActivityStateInactive) {
        if ([_activeScreens containsObject:screen] && screen.activityState == RNSActivityStateTransitioningOrBelowTop) {
          // for screens that were already active we want to mimick the effect UINavigationController
          // has when willMoveToWindow:nil is triggered before the animation starts
          [self prepareDetach:screen];
        } else if (![_activeScreens containsObject:screen]) {
          [self attachScreen:screen atIndex:index];
        }
        index += 1;
      }
    }
  }

  for (RNSScreenView *screen in _reactSubviews) {
    if (screen.activityState == RNSActivityStateOnTop) {
      [screen notifyFinishTransitioning];
    }
  }

  if (screenRemoved || screenAdded) {
    [self maybeDismissVC];
  }
}

- (void)maybeDismissVC
{
  if (_controller.presentedViewController == nil && _controller.presentingViewController == nil) {
    // if user has reachability enabled (one hand use) and the window is slided down the below
    // method will force it to slide back up as it is expected to happen with UINavController when
    // we push or pop views.
    // We only do that if `presentedViewController` is nil, as otherwise it'd mean that modal has
    // been presented on top of recently changed controller in which case the below method would
    // dismiss such a modal (e.g., permission modal or alert)
    [_controller dismissViewControllerAnimated:NO completion:nil];
  }
}

- (void)didUpdateReactSubviews
{
  [self markChildUpdated];
}

- (void)didMoveToWindow
{
  if (self.window && !_invalidated) {
    // We check whether the view has been invalidated before running side-effects in didMoveToWindow
    // This is needed because when LayoutAnimations are used it is possible for view to be re-attached
    // to a window despite the fact it has been removed from the React Native view hierarchy.
    [self reactAddControllerToClosestParent:_controller];
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _controller.view.frame = self.bounds;
  for (RNSScreenView *subview in _reactSubviews) {
#ifdef RN_FABRIC_ENABLED
    facebook::react::LayoutMetrics screenLayoutMetrics = subview.newLayoutMetrics;
    screenLayoutMetrics.frame = RCTRectFromCGRect(CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height));
    [subview updateLayoutMetrics:screenLayoutMetrics oldLayoutMetrics:subview.oldLayoutMetrics];
#else
    [subview reactSetFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];
#endif
    [subview setNeedsLayout];
  }
}

#pragma mark-- Fabric specific
#ifdef RN_FABRIC_ENABLED

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (![childComponentView isKindOfClass:[RNSScreenView class]]) {
    RCTLogError(@"ScreenContainer only accepts children of type Screen");
    return;
  }

  RNSScreenView *screenView = (RNSScreenView *)childComponentView;

  RCTAssert(
      childComponentView.reactSuperview == nil,
      @"Attempt to mount already mounted component view. (parent: %@, child: %@, index: %@, existing parent: %@)",
      self,
      childComponentView,
      @(index),
      @([childComponentView.superview tag]));

  [_reactSubviews insertObject:screenView atIndex:index];
  screenView.reactSuperview = self;
  facebook::react::LayoutMetrics screenLayoutMetrics = screenView.newLayoutMetrics;
  screenLayoutMetrics.frame = RCTRectFromCGRect(CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height));
  [screenView updateLayoutMetrics:screenLayoutMetrics oldLayoutMetrics:screenView.oldLayoutMetrics];
  [self markChildUpdated];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  RCTAssert(
      childComponentView.reactSuperview == self,
      @"Attempt to unmount a view which is mounted inside different view. (parent: %@, child: %@, index: %@)",
      self,
      childComponentView,
      @(index));
  RCTAssert(
      (_reactSubviews.count > index) && [_reactSubviews objectAtIndex:index] == childComponentView,
      @"Attempt to unmount a view which has a different index. (parent: %@, child: %@, index: %@, actual index: %@, tag at index: %@)",
      self,
      childComponentView,
      @(index),
      @([_reactSubviews indexOfObject:childComponentView]),
      @([[_reactSubviews objectAtIndex:index] tag]));
  ((RNSScreenView *)childComponentView).reactSuperview = nil;
  [_reactSubviews removeObject:childComponentView];
  [childComponentView removeFromSuperview];
  [self markChildUpdated];
}

+ (facebook::react::ComponentDescriptorProvider)componentDescriptorProvider
{
  return facebook::react::concreteComponentDescriptorProvider<facebook::react::RNSScreenContainerComponentDescriptor>();
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [_controller willMoveToParentViewController:nil];
  [_controller removeFromParentViewController];
}

#pragma mark-- Paper specific
#else

- (void)invalidate
{
  _invalidated = YES;
  [_controller willMoveToParentViewController:nil];
  [_controller removeFromParentViewController];
}

#endif

@end

#ifdef RN_FABRIC_ENABLED
Class<RCTComponentViewProtocol> RNSScreenContainerCls(void)
{
  return RNSScreenContainerView.class;
}
#endif

@implementation RNSScreenContainerManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RNSScreenContainerView alloc] init];
}

@end
