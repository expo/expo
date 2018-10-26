#import "ABI31_0_0RNSScreenContainer.h"
#import "ABI31_0_0RNSScreen.h"

#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManagerUtils.h>

@interface ABI31_0_0RNSScreenContainerManager : ABI31_0_0RCTViewManager

- (void)markUpdated:(ABI31_0_0RNSScreenContainerView *)screen;

@end

@interface ABI31_0_0RNSScreenContainerView ()

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableSet<ABI31_0_0RNSScreenView *> *activeScreens;
@property (nonatomic, retain) NSMutableArray<ABI31_0_0RNSScreenView *> *ReactABI31_0_0Subviews;

- (void)updateContainer;

@end

@implementation ABI31_0_0RNSScreenContainerView {
  BOOL _needUpdate;
  __weak ABI31_0_0RNSScreenContainerManager *_manager;
}

- (instancetype)initWithManager:(ABI31_0_0RNSScreenContainerManager *)manager
{
  if (self = [super init]) {
    _activeScreens = [NSMutableSet new];
    _ReactABI31_0_0Subviews = [NSMutableArray new];
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

- (void)insertReactABI31_0_0Subview:(ABI31_0_0RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  subview.ReactABI31_0_0Superview = self;
  [_ReactABI31_0_0Subviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactABI31_0_0Subview:(ABI31_0_0RNSScreenView *)subview
{
  subview.ReactABI31_0_0Superview = nil;
  [_ReactABI31_0_0Subviews removeObject:subview];
}

- (NSArray<UIView *> *)ReactABI31_0_0Subviews
{
  return _ReactABI31_0_0Subviews;
}

- (void)detachScreen:(ABI31_0_0RNSScreenView *)screen
{
  [screen.controller willMoveToParentViewController:nil];
  [screen.controller.view removeFromSuperview];
  [screen.controller removeFromParentViewController];
  [_activeScreens removeObject:screen];
}

- (void)attachScreen:(ABI31_0_0RNSScreenView *)screen
{
  [_controller addChildViewController:screen.controller];
  [_controller.view addSubview:screen.controller.view];
  [screen.controller didMoveToParentViewController:_controller];
  [_activeScreens addObject:screen];
}

- (void)updateContainer
{
  _needUpdate = NO;
  BOOL activeScreenChanged = NO;
  // remove screens that are no longer active
  NSMutableSet *orphaned = [NSMutableSet setWithSet:_activeScreens];
  for (ABI31_0_0RNSScreenView *screen in _ReactABI31_0_0Subviews) {
    if (!screen.active && [_activeScreens containsObject:screen]) {
      activeScreenChanged = YES;
      [self detachScreen:screen];
    }
    [orphaned removeObject:screen];
  }
  for (ABI31_0_0RNSScreenView *screen in orphaned) {
    activeScreenChanged = YES;
    [self detachScreen:screen];
  }

  // add new screens in order they are placed in subviews array
  for (ABI31_0_0RNSScreenView *screen in _ReactABI31_0_0Subviews) {
    if (screen.active && ![_activeScreens containsObject:screen]) {
      activeScreenChanged = YES;
      [self attachScreen:screen];
    } else if (screen.active) {
      // if the view was already there we move it to "front" so that it is in the right
      // order accoring to the subviews array
      [_controller.view bringSubviewToFront:screen.controller.view];
    }
  }

  if (activeScreenChanged) {
    // if user has reachability enabled (one hand use) and the window is slided down the below
    // method will force it to slide back up as it is expected to happen with UINavController when
    // we push or pop views.
    [_controller dismissViewControllerAnimated:NO completion:nil];
  }
}

- (void)didUpdateReactABI31_0_0Subviews
{
  [self markChildUpdated];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self ReactABI31_0_0AddControllerToClosestParent:_controller];
  _controller.view.frame = self.bounds;
}

@end


@implementation ABI31_0_0RNSScreenContainerManager {
  NSMutableArray<ABI31_0_0RNSScreenContainerView *> *_markedContainers;
}

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_markedContainers) {
    _markedContainers = [NSMutableArray new];
  }
  return [[ABI31_0_0RNSScreenContainerView alloc] initWithManager:self];
}

- (void)markUpdated:(ABI31_0_0RNSScreenContainerView *)screen
{
  ABI31_0_0RCTAssertMainQueue();
  [_markedContainers addObject:screen];
  if ([_markedContainers count] == 1) {
    // we enqueue updates to be run on the main queue in order to make sure that
    // all this updates (new screens attached etc) are executed in one batch
    ABI31_0_0RCTExecuteOnMainQueue(^{
      for (ABI31_0_0RNSScreenContainerView *container in _markedContainers) {
        [container updateContainer];
      }
      [_markedContainers removeAllObjects];
    });
  }
}

@end
