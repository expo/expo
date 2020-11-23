#import "ABI40_0_0RNSScreenContainer.h"
#import "ABI40_0_0RNSScreen.h"

#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManagerUtils.h>

@interface ABI40_0_0RNSScreenContainerManager : ABI40_0_0RCTViewManager

- (void)markUpdated:(ABI40_0_0RNSScreenContainerView *)screen;

@end

@interface ABI40_0_0RNSScreenContainerView () <ABI40_0_0RCTInvalidating>

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableSet<ABI40_0_0RNSScreenView *> *activeScreens;
@property (nonatomic, retain) NSMutableArray<ABI40_0_0RNSScreenView *> *ABI40_0_0ReactSubviews;

- (void)updateContainer;

@end

@implementation ABI40_0_0RNScreensViewController

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

- (UIViewController *)findActiveChildVC
{
  for (UIViewController *childVC in self.childViewControllers) {
    if ([childVC isKindOfClass:[ABI40_0_0RNSScreen class]] && ((ABI40_0_0RNSScreenView *)((ABI40_0_0RNSScreen *)childVC.view)).activityState == ABI40_0_0RNSActivityStateOnTop) {
      return childVC;
    }
  }
  return [[self childViewControllers] lastObject];
}

@end

@implementation ABI40_0_0RNSScreenContainerView {
  BOOL _needUpdate;
  BOOL _invalidated;
  __weak ABI40_0_0RNSScreenContainerManager *_manager;
}

- (instancetype)initWithManager:(ABI40_0_0RNSScreenContainerManager *)manager
{
  if (self = [super init]) {
    _activeScreens = [NSMutableSet new];
    _ABI40_0_0ReactSubviews = [NSMutableArray new];
    _controller = [[ABI40_0_0RNScreensViewController alloc] init];
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

- (void)insertABI40_0_0ReactSubview:(ABI40_0_0RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  subview.ABI40_0_0ReactSuperview = self;
  [_ABI40_0_0ReactSubviews insertObject:subview atIndex:atIndex];
  [subview ABI40_0_0ReactSetFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];
}

- (void)removeABI40_0_0ReactSubview:(ABI40_0_0RNSScreenView *)subview
{
  subview.ABI40_0_0ReactSuperview = nil;
  [_ABI40_0_0ReactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)ABI40_0_0ReactSubviews
{
  return _ABI40_0_0ReactSubviews;
}

- (UIViewController *)ABI40_0_0ReactViewController
{
  return _controller;
}

- (UIViewController*)findChildControllerForScreen:(ABI40_0_0RNSScreenView*)screen
{
  for (UIViewController *vc in _controller.childViewControllers) {
    if (vc.view == screen) {
      return vc;
    }
  }
  return nil;
}

- (void)prepareDetach:(ABI40_0_0RNSScreenView *)screen
{
  [[self findChildControllerForScreen:screen] willMoveToParentViewController:nil];
}

- (void)detachScreen:(ABI40_0_0RNSScreenView *)screen
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

- (void)attachScreen:(ABI40_0_0RNSScreenView *)screen atIndex:(NSInteger)index
{
  [_controller addChildViewController:screen.controller];
  // the frame is already set at this moment because we adjust it in insertABI40_0_0ReactSubview. We don't
  // want to update it here as ABI40_0_0React-driven animations may already run and hence changing the frame
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
  for (ABI40_0_0RNSScreenView *screen in _ABI40_0_0ReactSubviews) {
    if (screen.activityState == ABI40_0_0RNSActivityStateInactive && [_activeScreens containsObject:screen]) {
      screenRemoved = YES;
      [self detachScreen:screen];
    }
    [orphaned removeObject:screen];
  }
  for (ABI40_0_0RNSScreenView *screen in orphaned) {
    screenRemoved = YES;
    [self detachScreen:screen];
  }

  // detect if new screen is going to be activated
  BOOL screenAdded = NO;
  for (ABI40_0_0RNSScreenView *screen in _ABI40_0_0ReactSubviews) {
    if (screen.activityState != ABI40_0_0RNSActivityStateInactive && ![_activeScreens containsObject:screen]) {
      screenAdded = YES;
    }
  }

  if (screenAdded) {
    // add new screens in order they are placed in subviews array
    NSInteger index = 0;
    for (ABI40_0_0RNSScreenView *screen in _ABI40_0_0ReactSubviews) {
      if (screen.activityState != ABI40_0_0RNSActivityStateInactive) {
        if ([_activeScreens containsObject:screen] && screen.activityState == ABI40_0_0RNSActivityStateTransitioningOrBelowTop) {
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

  if (screenRemoved || screenAdded) {
    // we disable interaction for the duration of the transition until one of the screens changes its state to "onTop"
    self.userInteractionEnabled = NO;
    
    for (ABI40_0_0RNSScreenView *screen in _ABI40_0_0ReactSubviews) {
      if (screen.activityState == ABI40_0_0RNSActivityStateOnTop) {
        // if there is an "onTop" screen it means the transition has ended so we restore interactions
        self.userInteractionEnabled = YES;
        [screen notifyFinishTransitioning];
      }
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

- (void)didUpdateABI40_0_0ReactSubviews
{
  [self markChildUpdated];
}

- (void)didMoveToWindow
{
  if (self.window && !_invalidated) {
    // We check whether the view has been invalidated before running side-effects in didMoveToWindow
    // This is needed because when LayoutAnimations are used it is possible for view to be re-attached
    // to a window despite the fact it has been removed from the ABI40_0_0React Native view hierarchy.
    [self ABI40_0_0ReactAddControllerToClosestParent:_controller];
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
  for (ABI40_0_0RNSScreenView *subview in _ABI40_0_0ReactSubviews) {
    [subview ABI40_0_0ReactSetFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];
    [subview setNeedsLayout];
  }
}

@end


@implementation ABI40_0_0RNSScreenContainerManager {
  NSMutableArray<ABI40_0_0RNSScreenContainerView *> *_markedContainers;
}

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_markedContainers) {
    _markedContainers = [NSMutableArray new];
  }
  return [[ABI40_0_0RNSScreenContainerView alloc] initWithManager:self];
}

- (void)markUpdated:(ABI40_0_0RNSScreenContainerView *)screen
{
  ABI40_0_0RCTAssertMainQueue();
  [_markedContainers addObject:screen];
  if ([_markedContainers count] == 1) {
    // we enqueue updates to be run on the main queue in order to make sure that
    // all this updates (new screens attached etc) are executed in one batch
    ABI40_0_0RCTExecuteOnMainQueue(^{
      for (ABI40_0_0RNSScreenContainerView *container in self->_markedContainers) {
        [container updateContainer];
      }
      [self->_markedContainers removeAllObjects];
    });
  }
}

@end
