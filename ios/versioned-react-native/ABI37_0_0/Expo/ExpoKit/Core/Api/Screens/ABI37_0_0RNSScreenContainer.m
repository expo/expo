#import "ABI37_0_0RNSScreenContainer.h"
#import "ABI37_0_0RNSScreen.h"

#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerUtils.h>

@interface ABI37_0_0RNSScreenContainerManager : ABI37_0_0RCTViewManager

- (void)markUpdated:(ABI37_0_0RNSScreenContainerView *)screen;

@end

@interface ABI37_0_0RNSScreenContainerView () <ABI37_0_0RCTInvalidating>

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableSet<ABI37_0_0RNSScreenView *> *activeScreens;
@property (nonatomic, retain) NSMutableArray<ABI37_0_0RNSScreenView *> *ABI37_0_0ReactSubviews;

- (void)updateContainer;

@end

@implementation ABI37_0_0RNSScreenContainerView {
  BOOL _needUpdate;
  __weak ABI37_0_0RNSScreenContainerManager *_manager;
}

- (instancetype)initWithManager:(ABI37_0_0RNSScreenContainerManager *)manager
{
  if (self = [super init]) {
    _activeScreens = [NSMutableSet new];
    _ABI37_0_0ReactSubviews = [NSMutableArray new];
    _controller = [[UIViewController alloc] init];
    _needUpdate = NO;
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

- (void)insertABI37_0_0ReactSubview:(ABI37_0_0RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  subview.ABI37_0_0ReactSuperview = self;
  [_ABI37_0_0ReactSubviews insertObject:subview atIndex:atIndex];
  [subview ABI37_0_0ReactSetFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];
}

- (void)removeABI37_0_0ReactSubview:(ABI37_0_0RNSScreenView *)subview
{
  subview.ABI37_0_0ReactSuperview = nil;
  [_ABI37_0_0ReactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)ABI37_0_0ReactSubviews
{
  return _ABI37_0_0ReactSubviews;
}

- (UIViewController *)ABI37_0_0ReactViewController
{
  return _controller;
}

- (void)detachScreen:(ABI37_0_0RNSScreenView *)screen
{
  [screen.controller willMoveToParentViewController:nil];
  [screen.controller.view removeFromSuperview];
  [screen.controller removeFromParentViewController];
  [_activeScreens removeObject:screen];
}

- (void)attachScreen:(ABI37_0_0RNSScreenView *)screen
{
  [_controller addChildViewController:screen.controller];
  // the frame is already set at this moment because we adjust it in insertABI37_0_0ReactSubview. We don't
  // want to update it here as ABI37_0_0React-driven animations may already run and hence changing the frame
  // would result in visual glitches
  [_controller.view addSubview:screen.controller.view];
  [screen.controller didMoveToParentViewController:_controller];
  [_activeScreens addObject:screen];
}

- (void)updateContainer
{
  _needUpdate = NO;
  BOOL activeScreenRemoved = NO;
  // remove screens that are no longer active
  NSMutableSet *orphaned = [NSMutableSet setWithSet:_activeScreens];
  for (ABI37_0_0RNSScreenView *screen in _ABI37_0_0ReactSubviews) {
    if (!screen.active && [_activeScreens containsObject:screen]) {
      activeScreenRemoved = YES;
      [self detachScreen:screen];
    }
    [orphaned removeObject:screen];
  }
  for (ABI37_0_0RNSScreenView *screen in orphaned) {
    activeScreenRemoved = YES;
    [self detachScreen:screen];
  }

  // detect if new screen is going to be activated
  BOOL activeScreenAdded = NO;
  for (ABI37_0_0RNSScreenView *screen in _ABI37_0_0ReactSubviews) {
    if (screen.active && ![_activeScreens containsObject:screen]) {
      activeScreenAdded = YES;
    }
  }

  // if we are adding new active screen, we perform remounting of all already marked as active
  // this is done to mimick the effect UINavigationController has when willMoveToWindow:nil is
  // triggered before the animation starts
  if (activeScreenAdded) {
    for (ABI37_0_0RNSScreenView *screen in _ABI37_0_0ReactSubviews) {
      if (screen.active && [_activeScreens containsObject:screen]) {
        [self detachScreen:screen];
        // disable interactions for the duration of transition
        screen.userInteractionEnabled = NO;
      }
    }

    // add new screens in order they are placed in subviews array
    for (ABI37_0_0RNSScreenView *screen in _ABI37_0_0ReactSubviews) {
      if (screen.active) {
        [self attachScreen:screen];
      }
    }
  }

  // if we are down to one active screen it means the transitioning is over and we want to notify
  // the transition has finished
  if ((activeScreenRemoved || activeScreenAdded) && _activeScreens.count == 1) {
    ABI37_0_0RNSScreenView *singleActiveScreen = [_activeScreens anyObject];
    // restore interactions
    singleActiveScreen.userInteractionEnabled = YES;
    [singleActiveScreen notifyFinishTransitioning];
  }

  if ((activeScreenRemoved || activeScreenAdded) && _controller.presentedViewController == nil) {
    // if user has reachability enabled (one hand use) and the window is slided down the below
    // method will force it to slide back up as it is expected to happen with UINavController when
    // we push or pop views.
    // We only do that if `presentedViewController` is nil, as otherwise it'd mean that modal has
    // been presented on top of recently changed controller in which case the below method would
    // dismiss such a modal (e.g., permission modal or alert)
    [_controller dismissViewControllerAnimated:NO completion:nil];
  }
}

- (void)didUpdateABI37_0_0ReactSubviews
{
  [self markChildUpdated];
}

- (void)didMoveToWindow
{
  if (self.window) {
    [self ABI37_0_0ReactAddControllerToClosestParent:_controller];
  }
}

- (void)invalidate
{
  [_controller willMoveToParentViewController:nil];
  [_controller removeFromParentViewController];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _controller.view.frame = self.bounds;
  for (ABI37_0_0RNSScreenView *subview in _ABI37_0_0ReactSubviews) {
    [subview ABI37_0_0ReactSetFrame:CGRectMake(0, 0, self.bounds.size.width, self.bounds.size.height)];
    [subview setNeedsLayout];
  }
}

@end


@implementation ABI37_0_0RNSScreenContainerManager {
  NSMutableArray<ABI37_0_0RNSScreenContainerView *> *_markedContainers;
}

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_markedContainers) {
    _markedContainers = [NSMutableArray new];
  }
  return [[ABI37_0_0RNSScreenContainerView alloc] initWithManager:self];
}

- (void)markUpdated:(ABI37_0_0RNSScreenContainerView *)screen
{
  ABI37_0_0RCTAssertMainQueue();
  [_markedContainers addObject:screen];
  if ([_markedContainers count] == 1) {
    // we enqueue updates to be run on the main queue in order to make sure that
    // all this updates (new screens attached etc) are executed in one batch
    ABI37_0_0RCTExecuteOnMainQueue(^{
      for (ABI37_0_0RNSScreenContainerView *container in _markedContainers) {
        [container updateContainer];
      }
      [_markedContainers removeAllObjects];
    });
  }
}

@end
