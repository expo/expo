#import "RNSScreenContainer.h"
#import "RNSScreen.h"

#import <React/RCTUIManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import <React/RCTUIManagerUtils.h>

@interface RNSScreenContainerManager : RCTViewManager

- (void)markUpdated:(RNSScreenContainerView *)screen;

@end

@interface RNSScreenContainerView () <RCTInvalidating>

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableSet<RNSScreenView *> *activeScreens;
@property (nonatomic, retain) NSMutableArray<RNSScreenView *> *reactSubviews;

- (void)updateContainer;

@end

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

- (UIViewController *)findActiveChildVC
{
  for (UIViewController *childVC in self.childViewControllers) {
    if ([childVC isKindOfClass:[RNSScreen class]] && ((RNSScreenView *)((RNSScreen *)childVC.view)).activityState == RNSActivityStateOnTop) {
      return childVC;
    }
  }
  return [[self childViewControllers] lastObject];
}
#endif

@end

@implementation RNSScreenContainerView {
  BOOL _needUpdate;
  BOOL _invalidated;
  __weak RNSScreenContainerManager *_manager;
}

- (instancetype)initWithManager:(RNSScreenContainerManager *)manager
{
  if (self = [super init]) {
    _activeScreens = [NSMutableSet new];
    _reactSubviews = [NSMutableArray new];
    _controller = [[RNScreensViewController alloc] init];
    _needUpdate = NO;
    _invalidated = NO;
    _manager = manager;
    [self addSubview:_controller.view];
  }
  return self;
}

- (void)markChildUpdated
{
  // We want 'updateContainer' to be executed on main thread after all enqueued operations in
  // uimanager are complete. For that we collect all marked containers in manager class and enqueue
  // operation on ui thread that should run once all the updates are completed.
  if (!_needUpdate) {
    _needUpdate = YES;
    [_manager markUpdated:self];
  }
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

- (UIViewController*)findChildControllerForScreen:(RNSScreenView*)screen
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
  _needUpdate = NO;
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

  if ((screenRemoved || screenAdded) && _controller.presentedViewController == nil && _controller.presentingViewController == nil) {
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

- (void)invalidate
{
  _invalidated = YES;
  [_controller willMoveToParentViewController:nil];
  [_controller removeFromParentViewController];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _controller.view.frame = self.bounds;
  for (RNSScreenView *subview in _reactSubviews) {
    [subview reactSetFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];
    [subview setNeedsLayout];
  }
}

@end


@implementation RNSScreenContainerManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RNSScreenContainerView alloc] initWithManager:self];
}

- (void)markUpdated:(RNSScreenContainerView *)container
{
  // we want the attaching/detaching of children to be always made on main queue, which
  // is currently true for `react-navigation` since the changes of `Animated` value in stack's
  // transition and mounting/unmounting views in tabs and drawer are dispatched on main queue.
  RCTAssertMainQueue();
  [container updateContainer];
}

@end
