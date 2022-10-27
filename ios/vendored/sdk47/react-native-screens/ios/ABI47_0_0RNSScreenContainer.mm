#import "ABI47_0_0RNSScreenContainer.h"
#import "ABI47_0_0RNSScreen.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTConversions.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/Props.h>
#endif

@implementation ABI47_0_0RNScreensViewController

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
    if ([childVC isKindOfClass:[ABI47_0_0RNSScreen class]] &&
        ((ABI47_0_0RNSScreen *)childVC).screenView.activityState == ABI47_0_0RNSActivityStateOnTop) {
      return childVC;
    }
  }
  return [[self childViewControllers] lastObject];
}

@end

@implementation ABI47_0_0RNSScreenContainerView {
  BOOL _invalidated;
  NSMutableSet *_activeScreens;
}

- (instancetype)init
{
  if (self = [super init]) {
#ifdef RN_FABRIC_ENABLED
    static const auto defaultProps = std::make_shared<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenContainerProps>();
    _props = defaultProps;
#endif
    _activeScreens = [NSMutableSet new];
    _ABI47_0_0ReactSubviews = [NSMutableArray new];
    [self setupController];
    _invalidated = NO;
  }
  return self;
}

- (void)setupController
{
  _controller = [[ABI47_0_0RNScreensViewController alloc] init];
  [self addSubview:_controller.view];
}

- (void)markChildUpdated
{
  // We want the attaching/detaching of children to be always made on main queue, which
  // is currently true for `react-navigation` since this method is triggered
  // by the changes of `Animated` value in stack's transition or adding/removing screens
  // in all navigators
  ABI47_0_0RCTAssertMainQueue();
  [self updateContainer];
}

- (void)insertABI47_0_0ReactSubview:(ABI47_0_0RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  subview.ABI47_0_0ReactSuperview = self;
  [_ABI47_0_0ReactSubviews insertObject:subview atIndex:atIndex];
  [subview ABI47_0_0ReactSetFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];
}

- (void)removeABI47_0_0ReactSubview:(ABI47_0_0RNSScreenView *)subview
{
  subview.ABI47_0_0ReactSuperview = nil;
  [_ABI47_0_0ReactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)ABI47_0_0ReactSubviews
{
  return _ABI47_0_0ReactSubviews;
}

- (UIViewController *)ABI47_0_0ReactViewController
{
  return _controller;
}

- (UIViewController *)findChildControllerForScreen:(ABI47_0_0RNSScreenView *)screen
{
  for (UIViewController *vc in _controller.childViewControllers) {
    if (vc.view == screen) {
      return vc;
    }
  }
  return nil;
}

- (void)prepareDetach:(ABI47_0_0RNSScreenView *)screen
{
  [[self findChildControllerForScreen:screen] willMoveToParentViewController:nil];
}

- (void)detachScreen:(ABI47_0_0RNSScreenView *)screen
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

- (void)attachScreen:(ABI47_0_0RNSScreenView *)screen atIndex:(NSInteger)index
{
  [_controller addChildViewController:screen.controller];
  // the frame is already set at this moment because we adjust it in insertABI47_0_0ReactSubview. We don't
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
  for (ABI47_0_0RNSScreenView *screen in _ABI47_0_0ReactSubviews) {
    if (screen.activityState == ABI47_0_0RNSActivityStateInactive && [_activeScreens containsObject:screen]) {
      screenRemoved = YES;
      [self detachScreen:screen];
    }
    [orphaned removeObject:screen];
  }
  for (ABI47_0_0RNSScreenView *screen in orphaned) {
    screenRemoved = YES;
    [self detachScreen:screen];
  }

  // detect if new screen is going to be activated
  BOOL screenAdded = NO;
  for (ABI47_0_0RNSScreenView *screen in _ABI47_0_0ReactSubviews) {
    if (screen.activityState != ABI47_0_0RNSActivityStateInactive && ![_activeScreens containsObject:screen]) {
      screenAdded = YES;
    }
  }

  if (screenAdded) {
    // add new screens in order they are placed in subviews array
    NSInteger index = 0;
    for (ABI47_0_0RNSScreenView *screen in _ABI47_0_0ReactSubviews) {
      if (screen.activityState != ABI47_0_0RNSActivityStateInactive) {
        if ([_activeScreens containsObject:screen] && screen.activityState == ABI47_0_0RNSActivityStateTransitioningOrBelowTop) {
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

  for (ABI47_0_0RNSScreenView *screen in _ABI47_0_0ReactSubviews) {
    if (screen.activityState == ABI47_0_0RNSActivityStateOnTop) {
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

- (void)didUpdateABI47_0_0ReactSubviews
{
  [self markChildUpdated];
}

- (void)didMoveToWindow
{
  if (self.window && !_invalidated) {
    // We check whether the view has been invalidated before running side-effects in didMoveToWindow
    // This is needed because when LayoutAnimations are used it is possible for view to be re-attached
    // to a window despite the fact it has been removed from the ABI47_0_0React Native view hierarchy.
    [self ABI47_0_0ReactAddControllerToClosestParent:_controller];
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _controller.view.frame = self.bounds;
  for (ABI47_0_0RNSScreenView *subview in _ABI47_0_0ReactSubviews) {
#ifdef RN_FABRIC_ENABLED
    ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics screenLayoutMetrics = subview.newLayoutMetrics;
    screenLayoutMetrics.frame = ABI47_0_0RCTRectFromCGRect(CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height));
    [subview updateLayoutMetrics:screenLayoutMetrics oldLayoutMetrics:subview.oldLayoutMetrics];
#else
    [subview ABI47_0_0ReactSetFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];
#endif
    [subview setNeedsLayout];
  }
}

#pragma mark-- Fabric specific
#ifdef RN_FABRIC_ENABLED

- (void)mountChildComponentView:(UIView<ABI47_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (![childComponentView isKindOfClass:[ABI47_0_0RNSScreenView class]]) {
    ABI47_0_0RCTLogError(@"ScreenContainer only accepts children of type Screen");
    return;
  }

  ABI47_0_0RNSScreenView *screenView = (ABI47_0_0RNSScreenView *)childComponentView;

  ABI47_0_0RCTAssert(
      childComponentView.ABI47_0_0ReactSuperview == nil,
      @"Attempt to mount already mounted component view. (parent: %@, child: %@, index: %@, existing parent: %@)",
      self,
      childComponentView,
      @(index),
      @([childComponentView.superview tag]));

  [_ABI47_0_0ReactSubviews insertObject:screenView atIndex:index];
  screenView.ABI47_0_0ReactSuperview = self;
  ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics screenLayoutMetrics = screenView.newLayoutMetrics;
  screenLayoutMetrics.frame = ABI47_0_0RCTRectFromCGRect(CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height));
  [screenView updateLayoutMetrics:screenLayoutMetrics oldLayoutMetrics:screenView.oldLayoutMetrics];
  [self markChildUpdated];
}

- (void)unmountChildComponentView:(UIView<ABI47_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  ABI47_0_0RCTAssert(
      childComponentView.ABI47_0_0ReactSuperview == self,
      @"Attempt to unmount a view which is mounted inside different view. (parent: %@, child: %@, index: %@)",
      self,
      childComponentView,
      @(index));
  ABI47_0_0RCTAssert(
      (_ABI47_0_0ReactSubviews.count > index) && [_ABI47_0_0ReactSubviews objectAtIndex:index] == childComponentView,
      @"Attempt to unmount a view which has a different index. (parent: %@, child: %@, index: %@, actual index: %@, tag at index: %@)",
      self,
      childComponentView,
      @(index),
      @([_ABI47_0_0ReactSubviews indexOfObject:childComponentView]),
      @([[_ABI47_0_0ReactSubviews objectAtIndex:index] tag]));
  ((ABI47_0_0RNSScreenView *)childComponentView).ABI47_0_0ReactSuperview = nil;
  [_ABI47_0_0ReactSubviews removeObject:childComponentView];
  [childComponentView removeFromSuperview];
  [self markChildUpdated];
}

+ (ABI47_0_0facebook::ABI47_0_0React::ComponentDescriptorProvider)componentDescriptorProvider
{
  return ABI47_0_0facebook::ABI47_0_0React::concreteComponentDescriptorProvider<ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenContainerComponentDescriptor>();
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
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RNSScreenContainerCls(void)
{
  return ABI47_0_0RNSScreenContainerView.class;
}
#endif

@implementation ABI47_0_0RNSScreenContainerManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI47_0_0RNSScreenContainerView alloc] init];
}

@end
