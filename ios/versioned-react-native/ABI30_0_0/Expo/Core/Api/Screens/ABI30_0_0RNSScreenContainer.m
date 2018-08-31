#import "ABI30_0_0RNSScreenContainer.h"
#import "ABI30_0_0RNSScreen.h"

#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerUtils.h>

@interface ABI30_0_0RNSScreenContainerManager : ABI30_0_0RCTViewManager <ABI30_0_0RCTUIManagerObserver>

- (void)markUpdated:(ABI30_0_0RNSScreenContainerView *)screen;

@end

@interface ABI30_0_0RNSScreenContainerView ()

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableSet<ABI30_0_0RNSScreenView *> *activeScreens;
@property (nonatomic, retain) NSMutableArray<ABI30_0_0RNSScreenView *> *ReactABI30_0_0Subviews;

- (void)updateConatiner;

@end

@implementation ABI30_0_0RNSScreenContainerView {
  BOOL _needUpdate;
  __weak ABI30_0_0RNSScreenContainerManager *_manager;
}

- (instancetype)initWithManager:(ABI30_0_0RNSScreenContainerManager *)manager
{
  if (self = [super init]) {
    _activeScreens = [NSMutableSet new];
    _ReactABI30_0_0Subviews = [NSMutableArray new];
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

- (void)insertReactABI30_0_0Subview:(ABI30_0_0RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  subview.ReactABI30_0_0Superview = self;
  [_ReactABI30_0_0Subviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactABI30_0_0Subview:(ABI30_0_0RNSScreenView *)subview
{
  subview.ReactABI30_0_0Superview = nil;
  [_ReactABI30_0_0Subviews removeObject:subview];
}

- (NSArray<UIView *> *)ReactABI30_0_0Subviews
{
  return _ReactABI30_0_0Subviews;
}

- (void)detachScreen:(ABI30_0_0RNSScreenView *)screen
{
  [screen.controller willMoveToParentViewController:nil];
  [screen.controller.view removeFromSuperview];
  [screen.controller removeFromParentViewController];
  [_activeScreens removeObject:screen];
}

- (void)attachScreen:(ABI30_0_0RNSScreenView *)screen
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
  for (ABI30_0_0RNSScreenView *screen in _ReactABI30_0_0Subviews) {
    if (!screen.active && [_activeScreens containsObject:screen]) {
      activeScreenChanged = YES;
      [self detachScreen:screen];
    }
    [orphaned removeObject:screen];
  }
  for (ABI30_0_0RNSScreenView *screen in orphaned) {
    activeScreenChanged = YES;
    [self detachScreen:screen];
  }

  // add new screens in order they are placed in subviews array
  for (ABI30_0_0RNSScreenView *screen in _ReactABI30_0_0Subviews) {
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

- (void)didUpdateReactABI30_0_0Subviews
{
  [self markChildUpdated];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self ReactABI30_0_0AddControllerToClosestParent:_controller];
  _controller.view.frame = self.bounds;
}

@end


@implementation ABI30_0_0RNSScreenContainerManager {
  NSMutableArray<ABI30_0_0RNSScreenContainerView *> *_markedContainers;
}

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_markedContainers) {
    _markedContainers = [NSMutableArray new];
  }
  return [[ABI30_0_0RNSScreenContainerView alloc] initWithManager:self];
}

- (void)markUpdated:(ABI30_0_0RNSScreenContainerView *)screen
{
  ABI30_0_0RCTAssertMainQueue();
  @synchronized(self) {
    // we need to synchronize write operations so that in didPerformMounting we can reliably
    // tell if _markedCOntainers is empty or not
    [_markedContainers addObject:screen];
  }
}

#pragma mark - ABI30_0_0RCTUIManagerObserver

- (void)setBridge:(ABI30_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  [self.bridge.uiManager.observerCoordinator addObserver:self];
}

- (void)invalidate
{
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

- (void)uiManagerDidPerformMounting:(__unused ABI30_0_0RCTUIManager *)manager
{
  @synchronized(self) {
    if ([_markedContainers count] == 0) {
      // we return early if there are no updated containers. This check needs to be
      // synchronized as UIThread can modify _markedContainers array
      return;
    }
  }
  ABI30_0_0RCTExecuteOnMainQueue(^{
    for (ABI30_0_0RNSScreenContainerView *screen in _markedContainers) {
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
