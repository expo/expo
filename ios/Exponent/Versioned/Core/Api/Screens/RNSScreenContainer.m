#import "RNSScreenContainer.h"
#import "RNSScreen.h"

#import <React/RCTUIManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import <React/RCTUIManagerUtils.h>

@interface RNSScreenContainerManager : RCTViewManager <RCTUIManagerObserver>

- (void)markUpdated:(RNSScreenContainerView *)screen;

@end

@interface RNSScreenContainerView ()

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableSet<RNSScreenView *> *activeScreens;
@property (nonatomic, retain) NSMutableArray<RNSScreenView *> *reactSubviews;

- (void)updateConatiner;

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
  // uimanager are complete. In order to achieve that we enqueue call on UIManagerQueue from which
  // we enqueue call on the main queue. This seems to be working ok in all the cases I've tried but
  // there is a chance it is not the correct way to do that.
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

  if (activeScreenChanged) {
    // if user has reachability enabled (one hand use) and the window is slided down the below
    // method will force it to slide back up as it is expected to happen with UINavController when
    // we push or pop views.
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
  @synchronized(self) {
    // we need to synchronize write operations so that in didPerformMounting we can reliably
    // tell if _markedCOntainers is empty or not
    [_markedContainers addObject:screen];
  }
}

#pragma mark - RCTUIManagerObserver

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  [self.bridge.uiManager.observerCoordinator addObserver:self];
}

- (void)invalidate
{
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

- (void)uiManagerDidPerformMounting:(__unused RCTUIManager *)manager
{
  @synchronized(self) {
    if ([_markedContainers count] == 0) {
      // we return early if there are no updated containers. This check needs to be
      // synchronized as UIThread can modify _markedContainers array
      return;
    }
  }
  RCTExecuteOnMainQueue(^{
    for (RNSScreenContainerView *screen in _markedContainers) {
      [screen updateContainer];
    }
    @synchronized(self) {
      // we only synchronize write operations and not reading in UIThread as UIThread
      // is the only thread that changes _markedContainers
      [_markedContainers removeAllObjects];
    }
  });
}

@end
