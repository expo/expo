#import "RNSScreenContainer.h"
#import "RNSScreen.h"

#import <React/RCTUIManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import <React/RCTUIManagerUtils.h>

@interface RNSScreenContainerManager : RCTViewManager

- (void)markUpdated:(RNSScreenContainerView *)screen;

@end

@interface RNSScreenContainerView ()

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableSet<RNSScreenView *> *activeScreens;
@property (nonatomic, retain) NSMutableArray<RNSScreenView *> *reactSubviews;

- (void)updateContainer;

@end

@implementation RNSScreenContainerView {
  BOOL _needUpdate;
  __weak RNSScreenContainerManager *_manager;
}

- (instancetype)initWithManager:(RNSScreenContainerManager *)manager
{
  if (self = [super init]) {
    _activeScreens = [NSMutableSet new];
    _reactSubviews = [NSMutableArray new];
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

- (void)insertReactSubview:(RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  subview.reactSuperview = self;
  [_reactSubviews insertObject:subview atIndex:atIndex];
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

- (void)detachScreen:(RNSScreenView *)screen
{
  [screen.controller willMoveToParentViewController:nil];
  [screen.controller.view removeFromSuperview];
  [screen.controller removeFromParentViewController];
  [_activeScreens removeObject:screen];
}

- (void)attachScreen:(RNSScreenView *)screen
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
  for (RNSScreenView *screen in _reactSubviews) {
    if (!screen.active && [_activeScreens containsObject:screen]) {
      activeScreenChanged = YES;
      [self detachScreen:screen];
    }
    [orphaned removeObject:screen];
  }
  for (RNSScreenView *screen in orphaned) {
    activeScreenChanged = YES;
    [self detachScreen:screen];
  }

  // add new screens in order they are placed in subviews array
  for (RNSScreenView *screen in _reactSubviews) {
    if (screen.active && ![_activeScreens containsObject:screen]) {
      activeScreenChanged = YES;
      [self attachScreen:screen];
    } else if (screen.active) {
      // if the view was already there we move it to "front" so that it is in the right
      // order accoring to the subviews array
      [_controller.view bringSubviewToFront:screen.controller.view];
    }
  }

  if (activeScreenChanged && _controller.presentedViewController == nil) {
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

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self reactAddControllerToClosestParent:_controller];
  _controller.view.frame = self.bounds;
}

@end


@implementation RNSScreenContainerManager {
  NSMutableArray<RNSScreenContainerView *> *_markedContainers;
}

RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_markedContainers) {
    _markedContainers = [NSMutableArray new];
  }
  return [[RNSScreenContainerView alloc] initWithManager:self];
}

- (void)markUpdated:(RNSScreenContainerView *)screen
{
  RCTAssertMainQueue();
  [_markedContainers addObject:screen];
  if ([_markedContainers count] == 1) {
    // we enqueue updates to be run on the main queue in order to make sure that
    // all this updates (new screens attached etc) are executed in one batch
    RCTExecuteOnMainQueue(^{
      for (RNSScreenContainerView *container in _markedContainers) {
        [container updateContainer];
      }
      [_markedContainers removeAllObjects];
    });
  }
}

@end
