/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTNavigator.h"

#import "ABI29_0_0RCTAssert.h"
#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTConvert.h"
#import "ABI29_0_0RCTEventDispatcher.h"
#import "ABI29_0_0RCTLog.h"
#import "ABI29_0_0RCTNavItem.h"
#import "ABI29_0_0RCTScrollView.h"
#import "ABI29_0_0RCTUtils.h"
#import "ABI29_0_0RCTView.h"
#import "ABI29_0_0RCTWrapperViewController.h"
#import "UIView+ReactABI29_0_0.h"

typedef NS_ENUM(NSUInteger, ABI29_0_0RCTNavigationLock) {
  ABI29_0_0RCTNavigationLockNone,
  ABI29_0_0RCTNavigationLockNative,
  ABI29_0_0RCTNavigationLockJavaScript
};

// By default the interactive pop gesture will be enabled when the navigation bar is displayed
// and disabled when hidden
// ABI29_0_0RCTPopGestureStateDefault maps to the default behavior (mentioned above). Once popGestureState
// leaves this value, it can never be returned back to it. This is because, due to a limitation in
// the iOS APIs, once we override the default behavior of the gesture recognizer, we cannot return
// back to it.
// ABI29_0_0RCTPopGestureStateEnabled will enable the gesture independent of nav bar visibility
// ABI29_0_0RCTPopGestureStateDisabled will disable the gesture independent of nav bar visibility
typedef NS_ENUM(NSUInteger, ABI29_0_0RCTPopGestureState) {
  ABI29_0_0RCTPopGestureStateDefault = 0,
  ABI29_0_0RCTPopGestureStateEnabled,
  ABI29_0_0RCTPopGestureStateDisabled
};

NSInteger kNeverRequested = -1;
NSInteger kNeverProgressed = -10000;


@interface UINavigationController ()

// need to declare this since `UINavigationController` doesn't publicly declare the fact that it implements
// UINavigationBarDelegate :(
- (BOOL)navigationBar:(UINavigationBar *)navigationBar shouldPopItem:(UINavigationItem *)item;

@end

// http://stackoverflow.com/questions/5115135/uinavigationcontroller-how-to-cancel-the-back-button-event
// There's no other way to do this unfortunately :(
@interface ABI29_0_0RCTNavigationController : UINavigationController <UINavigationBarDelegate>
{
  dispatch_block_t _scrollCallback;
}

@property (nonatomic, assign) ABI29_0_0RCTNavigationLock navigationLock;

@end

/**
 * In general, `ABI29_0_0RCTNavigator` examines `_currentViews` (which are ReactABI29_0_0 child
 * views), and compares them to `_navigationController.viewControllers` (which
 * are controlled by UIKit).
 *
 * It is possible for JavaScript (`_currentViews`) to "get ahead" of native
 * (`navigationController.viewControllers`) and vice versa. JavaScript gets
 * ahead by adding/removing ReactABI29_0_0 subviews. Native gets ahead by swiping back,
 * or tapping the back button. In both cases, the other system is initially
 * unaware. And in both cases, `ABI29_0_0RCTNavigator` helps the other side "catch up".
 *
 * If `ABI29_0_0RCTNavigator` sees the number of ReactABI29_0_0 children have changed, it
 * pushes/pops accordingly. If `ABI29_0_0RCTNavigator` sees a `UIKit` driven push/pop, it
 * notifies JavaScript that this has happened, and expects that JavaScript will
 * eventually render more children to match `UIKit`. There's no rush for
 * JavaScript to catch up. But if it does render anything, it must catch up to
 * UIKit. It cannot deviate.
 *
 * To implement this, we need a lock, which we store on the native thread. This
 * lock allows one of the systems to push/pop views. Whoever wishes to
 * "get ahead" must obtain the lock. Whoever wishes to "catch up" must obtain
 * the lock. One thread may not "get ahead" or "catch up" when the other has
 * the lock. Once a thread has the lock, it can only do the following:
 *
 * 1. If it is behind, it may only catch up.
 * 2. If it is caught up or ahead, it may push or pop.
 *
 *
 * ========= Acquiring The Lock ==========
 *
 * JavaScript asynchronously acquires the lock using a native hook. It might be
 * rejected and receive the return value `false`.
 *
 * We acquire the native lock in `shouldPopItem`, which is called right before
 * native tries to push/pop, but only if JavaScript doesn't already have the
 * lock.
 *
 * ========  While JavaScript Has Lock ====
 *
 * When JavaScript has the lock, we have to block all `UIKit` driven pops:
 *
 * 1. Block back button navigation:
 *   - Back button will invoke `shouldPopItem`, from which we return `NO` if
 *   JavaScript has the lock.
 *   - Back button will respect the return value `NO` and not permit
 *   navigation.
 *
 * 2. Block swipe-to-go-back navigation:
 *   - Swipe will trigger `shouldPopItem`, but swipe won't respect our `NO`
 *   return value so we must disable the gesture recognizer while JavaScript
 *   has the lock.
 *
 * ========  While Native Has Lock =======
 *
 * We simply deny JavaScript the right to acquire the lock.
 *
 *
 * ======== Releasing The Lock ===========
 *
 * Recall that the lock represents who has the right to either push/pop (or
 * catch up). As soon as we recognize that the side that has locked has carried
 * out what it scheduled to do, we can release the lock, but only after any
 * possible animations are completed.
 *
 * *IF* a scheduled operation results in a push/pop (not all do), then we can
 * only release the lock after the push/pop animation is complete because
 * UIKit. `didMoveToNavigationController` is invoked when the view is done
 * pushing/popping/animating. Native swipe-to-go-back interactions can be
 * aborted, however, and you'll never see that method invoked. So just to cover
 * that case, we also put an animation complete hook in
 * `animateAlongsideTransition` to make sure we free the lock, in case the
 * scheduled native push/pop never actually happened.
 *
 * For JavaScript:
 * - When we see that JavaScript has "caught up" to `UIKit`, and no pushes/pops
 * were needed, we can release the lock.
 * - When we see that JavaScript requires *some* push/pop, it's not yet done
 * carrying out what it scheduled to do. Just like with `UIKit` push/pops, we
 * still have to wait for it to be done animating
 * (`didMoveToNavigationController` is a suitable hook).
 *
 */
@implementation ABI29_0_0RCTNavigationController

/**
 * @param callback Callback that is invoked when a "scroll" interaction begins
 * so that `ABI29_0_0RCTNavigator` can notify `JavaScript`.
 */
- (instancetype)initWithScrollCallback:(dispatch_block_t)callback
{
  if ((self = [super initWithNibName:nil bundle:nil])) {
    _scrollCallback = callback;
  }
  return self;
}

/**
 * Invoked when either a navigation item has been popped off, or when a
 * swipe-back gesture has began. The swipe-back gesture doesn't respect the
 * return value of this method. The back button does. That's why we have to
 * completely disable the gesture recognizer for swipe-back while JS has the
 * lock.
 */
- (BOOL)navigationBar:(UINavigationBar *)navigationBar shouldPopItem:(UINavigationItem *)item
{
#if !TARGET_OS_TV
  if (self.interactivePopGestureRecognizer.state == UIGestureRecognizerStateBegan) {
    if (self.navigationLock == ABI29_0_0RCTNavigationLockNone) {
      self.navigationLock = ABI29_0_0RCTNavigationLockNative;
      if (_scrollCallback) {
        _scrollCallback();
      }
    } else if (self.navigationLock == ABI29_0_0RCTNavigationLockJavaScript) {
      // This should never happen because we disable/enable the gesture
      // recognizer when we lock the navigation.
      ABI29_0_0RCTAssert(NO, @"Should never receive gesture start while JS locks navigator");
    }
  } else
#endif //TARGET_OS_TV
  {
    if (self.navigationLock == ABI29_0_0RCTNavigationLockNone) {
      // Must be coming from native interaction, lock it - it will be unlocked
      // in `didMoveToNavigationController`
      self.navigationLock = ABI29_0_0RCTNavigationLockNative;
      if (_scrollCallback) {
        _scrollCallback();
      }
    } else if (self.navigationLock == ABI29_0_0RCTNavigationLockJavaScript) {
      // This should only occur when JS has the lock, and
      // - JS is driving the pop
      // - Or the back button was pressed
      // TODO: We actually want to disable the backbutton while JS has the
      // lock, but it's not so easy. Even returning `NO` wont' work because it
      // will also block JS driven pops. We simply need to disallow a standard
      // back button, and instead use a custom one that tells JS to pop to
      // length (`currentReactABI29_0_0Count` - 1).
      return [super navigationBar:navigationBar shouldPopItem:item];
    }
  }
  return [super navigationBar:navigationBar shouldPopItem:item];
}

@end

@interface ABI29_0_0RCTNavigator() <ABI29_0_0RCTWrapperViewControllerNavigationListener, UINavigationControllerDelegate, UIGestureRecognizerDelegate>

@property (nonatomic, copy) ABI29_0_0RCTDirectEventBlock onNavigationProgress;
@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onNavigationComplete;

@property (nonatomic, assign) NSInteger previousRequestedTopOfStack;

@property (nonatomic, assign) ABI29_0_0RCTPopGestureState popGestureState;

// Previous views are only mainted in order to detect incorrect
// addition/removal of views below the `requestedTopOfStack`
@property (nonatomic, copy, readwrite) NSArray<ABI29_0_0RCTNavItem *> *previousViews;
@property (nonatomic, readwrite, strong) ABI29_0_0RCTNavigationController *navigationController;
/**
 * Display link is used to get high frequency sample rate during
 * interaction/animation of view controller push/pop.
 *
 * - The run loop retains the displayLink.
 * - `displayLink` retains its target.
 * - We use `invalidate` to remove the `ABI29_0_0RCTNavigator`'s reference to the
 * `displayLink` and remove the `displayLink` from the run loop.
 *
 *
 * `displayLink`:
 * --------------
 *
 * - Even though we could implement the `displayLink` cleanup without the
 * `invalidate` hook by adding and removing it from the run loop at the
 * right times (begin/end animation), we need to account for the possibility
 * that the view itself is destroyed mid-interaction. So we always keep it
 * added to the run loop, but start/stop it with interactions/animations. We
 * remove it from the run loop when the view will be destroyed by ReactABI29_0_0.
 *
 * +----------+              +--------------+
 * | run loop o----strong--->|  displayLink |
 * +----------+              +--o-----------+
 *                              |        ^
 *                              |        |
 *                            strong   strong
 *                              |        |
 *                              v        |
 *                             +---------o---+
 *                             | ABI29_0_0RCTNavigator |
 *                             +-------------+
 *
 * `dummyView`:
 * ------------
 * There's no easy way to get a callback that fires when the position of a
 * navigation item changes. The actual layers that are moved around during the
 * navigation transition are private. Our only hope is to use
 * `animateAlongsideTransition`, to set a dummy view's position to transition
 * anywhere from -1.0 to 1.0. We later set up a `CADisplayLink` to poll the
 * `presentationLayer` of that dummy view and report the value as a "progress"
 * percentage.
 *
 * It was critical that we added the dummy view as a subview of the
 * transitionCoordinator's `containerView`, otherwise the animations would not
 * work correctly when reversing the gesture direction etc. This seems to be
 * undocumented behavior/requirement.
 *
 */
@property (nonatomic, readonly, assign) CGFloat mostRecentProgress;
@property (nonatomic, readonly, strong) NSTimer *runTimer;
@property (nonatomic, readonly, assign) NSInteger currentlyTransitioningFrom;
@property (nonatomic, readonly, assign) NSInteger currentlyTransitioningTo;

// Dummy view that we make animate with the same curve/interaction as the
// navigation animation/interaction.
@property (nonatomic, readonly, strong) UIView *dummyView;

@end

@implementation ABI29_0_0RCTNavigator
{
  __weak ABI29_0_0RCTBridge *_bridge;
  NSInteger _numberOfViewControllerMovesToIgnore;
}

@synthesize paused = _paused;
@synthesize pauseCallback = _pauseCallback;

- (instancetype)initWithBridge:(ABI29_0_0RCTBridge *)bridge
{
  ABI29_0_0RCTAssertParam(bridge);

  if ((self = [super initWithFrame:CGRectZero])) {
    _paused = YES;

    _bridge = bridge;
    _mostRecentProgress = kNeverProgressed;
    _dummyView = [[UIView alloc] initWithFrame:CGRectZero];
    _previousRequestedTopOfStack = kNeverRequested; // So that we initialize with a push.
    _previousViews = @[];
    __weak ABI29_0_0RCTNavigator *weakSelf = self;
    _navigationController = [[ABI29_0_0RCTNavigationController alloc] initWithScrollCallback:^{
      [weakSelf dispatchFakeScrollEvent];
    }];
    _navigationController.delegate = self;
    ABI29_0_0RCTAssert([self requestSchedulingJavaScriptNavigation], @"Could not acquire JS navigation lock on init");

    [self addSubview:_navigationController.view];
    [_navigationController.view addSubview:_dummyView];
  }
  return self;
}

ABI29_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI29_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)didUpdateFrame:(__unused ABI29_0_0RCTFrameUpdate *)update
{
  if (_currentlyTransitioningFrom != _currentlyTransitioningTo) {
    UIView *topView = _dummyView;
    id presentationLayer = [topView.layer presentationLayer];
    CGRect frame = [presentationLayer frame];
    CGFloat nextProgress = ABS(frame.origin.x);
    // Don't want to spam the bridge, when the user holds their finger still mid-navigation.
    if (nextProgress == _mostRecentProgress) {
      return;
    }
    _mostRecentProgress = nextProgress;
    if (_onNavigationProgress) {
      _onNavigationProgress(@{
        @"fromIndex": @(_currentlyTransitioningFrom),
        @"toIndex": @(_currentlyTransitioningTo),
        @"progress": @(nextProgress),
      });
    }
  }
}

- (void)setPaused:(BOOL)paused
{
  if (_paused != paused) {
    _paused = paused;
    if (_pauseCallback) {
      _pauseCallback();
    }
  }
}

- (void)setInteractivePopGestureEnabled:(BOOL)interactivePopGestureEnabled
{
#if !TARGET_OS_TV
  _interactivePopGestureEnabled = interactivePopGestureEnabled;

  _navigationController.interactivePopGestureRecognizer.delegate = self;
  _navigationController.interactivePopGestureRecognizer.enabled = interactivePopGestureEnabled;

  _popGestureState = interactivePopGestureEnabled ? ABI29_0_0RCTPopGestureStateEnabled : ABI29_0_0RCTPopGestureStateDisabled;
#endif
}

- (void)dealloc
{
#if !TARGET_OS_TV
  if (_navigationController.interactivePopGestureRecognizer.delegate == self) {
    _navigationController.interactivePopGestureRecognizer.delegate = nil;
  }
#endif
  _navigationController.delegate = nil;
  [_navigationController removeFromParentViewController];
}

- (UIViewController *)ReactABI29_0_0ViewController
{
  return _navigationController;
}

- (BOOL)gestureRecognizerShouldBegin:(__unused UIGestureRecognizer *)gestureRecognizer
{
  return _navigationController.viewControllers.count > 1;
}

/**
 * See documentation about lock lifecycle. This is only here to clean up
 * swipe-back abort interaction, which leaves us *no* other way to clean up
 * locks aside from the animation complete hook.
 */
- (void)navigationController:(UINavigationController *)navigationController
      willShowViewController:(__unused UIViewController *)viewController
                    animated:(__unused BOOL)animated
{
  id<UIViewControllerTransitionCoordinator> tc =
    navigationController.topViewController.transitionCoordinator;
  __weak ABI29_0_0RCTNavigator *weakSelf = self;
  [tc.containerView addSubview: _dummyView];
  [tc animateAlongsideTransition: ^(id<UIViewControllerTransitionCoordinatorContext> context) {
    ABI29_0_0RCTWrapperViewController *fromController =
      (ABI29_0_0RCTWrapperViewController *)[context viewControllerForKey:UITransitionContextFromViewControllerKey];
    ABI29_0_0RCTWrapperViewController *toController =
      (ABI29_0_0RCTWrapperViewController *)[context viewControllerForKey:UITransitionContextToViewControllerKey];

    // This may be triggered by a navigation controller unrelated to me: if so, ignore.
    if (fromController.navigationController != self->_navigationController ||
        toController.navigationController != self->_navigationController) {
      return;
    }

    NSUInteger indexOfFrom = [self.ReactABI29_0_0Subviews indexOfObject:fromController.navItem];
    NSUInteger indexOfTo = [self.ReactABI29_0_0Subviews indexOfObject:toController.navItem];
    CGFloat destination = indexOfFrom < indexOfTo ? 1.0 : -1.0;
    self->_dummyView.frame = (CGRect){{destination, 0}, CGSizeZero};
    self->_currentlyTransitioningFrom = indexOfFrom;
    self->_currentlyTransitioningTo = indexOfTo;
    self.paused = NO;
  }
  completion:^(__unused id<UIViewControllerTransitionCoordinatorContext> context) {
    [weakSelf freeLock];
    self->_currentlyTransitioningFrom = 0;
    self->_currentlyTransitioningTo = 0;
    self->_dummyView.frame = CGRectZero;
    self.paused = YES;
    // Reset the parallel position tracker
  }];
}

- (BOOL)requestSchedulingJavaScriptNavigation
{
  if (_navigationController.navigationLock == ABI29_0_0RCTNavigationLockNone) {
    _navigationController.navigationLock = ABI29_0_0RCTNavigationLockJavaScript;
#if !TARGET_OS_TV
    _navigationController.interactivePopGestureRecognizer.enabled = NO;
#endif
    return YES;
  }
  return NO;
}

- (void)freeLock
{
  _navigationController.navigationLock = ABI29_0_0RCTNavigationLockNone;

  // Unless the pop gesture has been explicitly disabled (ABI29_0_0RCTPopGestureStateDisabled),
  // Set interactivePopGestureRecognizer.enabled to YES
  // If the popGestureState is ABI29_0_0RCTPopGestureStateDefault the default behavior will be maintained
#if !TARGET_OS_TV
  _navigationController.interactivePopGestureRecognizer.enabled = self.popGestureState != ABI29_0_0RCTPopGestureStateDisabled;
#endif
}

/**
 * A ReactABI29_0_0 subview can be inserted/removed at any time, however if the
 * `requestedTopOfStack` changes, there had better be enough subviews present
 * to satisfy the push/pop.
 */
- (void)insertReactABI29_0_0Subview:(ABI29_0_0RCTNavItem *)view atIndex:(NSInteger)atIndex
{
  ABI29_0_0RCTAssert([view isKindOfClass:[ABI29_0_0RCTNavItem class]], @"ABI29_0_0RCTNavigator only accepts ABI29_0_0RCTNavItem subviews");
  ABI29_0_0RCTAssert(
    _navigationController.navigationLock == ABI29_0_0RCTNavigationLockJavaScript,
    @"Cannot change subviews from JS without first locking."
  );
  [super insertReactABI29_0_0Subview:view atIndex:atIndex];
}

- (void)didUpdateReactABI29_0_0Subviews
{
  // Do nothing, as subviews are managed by `uiManagerDidPerformMounting`
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self ReactABI29_0_0AddControllerToClosestParent:_navigationController];
  _navigationController.view.frame = self.bounds;
}

- (void)removeReactABI29_0_0Subview:(ABI29_0_0RCTNavItem *)subview
{
  if (self.ReactABI29_0_0Subviews.count <= 0 || subview == self.ReactABI29_0_0Subviews[0]) {
    ABI29_0_0RCTLogError(@"Attempting to remove invalid ABI29_0_0RCT subview of ABI29_0_0RCTNavigator");
    return;
  }
  [super removeReactABI29_0_0Subview:subview];
}

- (void)handleTopOfStackChanged
{
  if (_onNavigationComplete) {
    _onNavigationComplete(@{
      @"stackLength":@(_navigationController.viewControllers.count)
    });
  }
}

- (void)dispatchFakeScrollEvent
{
  [_bridge.eventDispatcher sendFakeScrollEvent:self.ReactABI29_0_0Tag];
}

/**
 * Must be overridden because UIKit removes the view's superview when used
 * as a navigator - it's considered outside the view hierarchy.
 */
- (UIView *)ReactABI29_0_0Superview
{
  ABI29_0_0RCTAssert(!_bridge.isValid || self.superview != nil, @"put ReactABI29_0_0NavSuperviewLink back");
  UIView *superview = [super ReactABI29_0_0Superview];
  return superview ?: self.ReactABI29_0_0NavSuperviewLink;
}

- (void)uiManagerDidPerformMounting
{
  // we can't hook up the VC hierarchy in 'init' because the subviews aren't
  // hooked up yet, so we do it on demand here
  [self ReactABI29_0_0AddControllerToClosestParent:_navigationController];

  NSUInteger viewControllerCount = _navigationController.viewControllers.count;
  // The "ReactABI29_0_0 count" is the count of views that are visible on the navigation
  // stack.  There may be more beyond this - that aren't visible, and may be
  // deleted/purged soon.
  NSUInteger previousReactABI29_0_0Count =
    _previousRequestedTopOfStack == kNeverRequested ? 0 : _previousRequestedTopOfStack + 1;
  NSUInteger currentReactABI29_0_0Count = _requestedTopOfStack + 1;

  BOOL jsGettingAhead =
    //    ----- previously caught up ------          ------ no longer caught up -------
    viewControllerCount == previousReactABI29_0_0Count && currentReactABI29_0_0Count != viewControllerCount;
  BOOL jsCatchingUp =
    //    --- previously not caught up ----          --------- now caught up ----------
    viewControllerCount != previousReactABI29_0_0Count && currentReactABI29_0_0Count == viewControllerCount;
  BOOL jsMakingNoProgressButNeedsToCatchUp =
    //    --- previously not caught up ----          ------- still the same -----------
    viewControllerCount != previousReactABI29_0_0Count && currentReactABI29_0_0Count == previousReactABI29_0_0Count;
  BOOL jsMakingNoProgressAndDoesntNeedTo =
    //    --- previously caught up --------          ------- still caught up ----------
    viewControllerCount == previousReactABI29_0_0Count && currentReactABI29_0_0Count == previousReactABI29_0_0Count;

BOOL jsGettingtooSlow =
  //    --- previously not caught up --------          ------- no longer caught up ----------
  viewControllerCount < previousReactABI29_0_0Count && currentReactABI29_0_0Count < previousReactABI29_0_0Count;

  BOOL ReactABI29_0_0PushOne = jsGettingAhead && currentReactABI29_0_0Count == previousReactABI29_0_0Count + 1;
  BOOL ReactABI29_0_0PopN = jsGettingAhead && currentReactABI29_0_0Count < previousReactABI29_0_0Count;

  // We can actually recover from this situation, but it would be nice to know
  // when this error happens. This simply means that JS hasn't caught up to a
  // back navigation before progressing. It's likely a bug in the JS code that
  // catches up/schedules navigations.
  if (!(jsGettingAhead ||
        jsCatchingUp ||
        jsMakingNoProgressButNeedsToCatchUp ||
        jsMakingNoProgressAndDoesntNeedTo ||
        jsGettingtooSlow)) {
    ABI29_0_0RCTLogError(@"JS has only made partial progress to catch up to UIKit");
  }
  if (currentReactABI29_0_0Count > self.ReactABI29_0_0Subviews.count) {
    ABI29_0_0RCTLogError(@"Cannot adjust current top of stack beyond available views");
  }

  // Views before the previous ReactABI29_0_0 count must not have changed. Views greater than previousReactABI29_0_0Count
  // up to currentReactABI29_0_0Count may have changed.
  for (NSUInteger i = 0; i < MIN(self.ReactABI29_0_0Subviews.count, MIN(_previousViews.count, previousReactABI29_0_0Count)); i++) {
    if (self.ReactABI29_0_0Subviews[i] != _previousViews[i]) {
      ABI29_0_0RCTLogError(@"current view should equal previous view");
    }
  }
  if (currentReactABI29_0_0Count < 1) {
    ABI29_0_0RCTLogError(@"should be at least one current view");
  }
  if (jsGettingAhead) {
    if (ReactABI29_0_0PushOne) {
      UIView *lastView = self.ReactABI29_0_0Subviews.lastObject;
      ABI29_0_0RCTWrapperViewController *vc = [[ABI29_0_0RCTWrapperViewController alloc] initWithNavItem:(ABI29_0_0RCTNavItem *)lastView];
      vc.navigationListener = self;
      _numberOfViewControllerMovesToIgnore = 1;
      [_navigationController pushViewController:vc animated:(currentReactABI29_0_0Count > 1)];
    } else if (ReactABI29_0_0PopN) {
      UIViewController *viewControllerToPopTo = _navigationController.viewControllers[(currentReactABI29_0_0Count - 1)];
      _numberOfViewControllerMovesToIgnore = viewControllerCount - currentReactABI29_0_0Count;
      [_navigationController popToViewController:viewControllerToPopTo animated:YES];
    } else {
      ABI29_0_0RCTLogError(@"Pushing or popping more than one view at a time from JS");
    }
  } else if (jsCatchingUp) {
    [self freeLock]; // Nothing to push/pop
  } else {
    // Else, JS making no progress, could have been unrelated to anything nav.
    return;
  }

  // Only make a copy of the subviews whose validity we expect to be able to check (in the loop, above),
  // otherwise we would unnecessarily retain a reference to view(s) no longer on the ReactABI29_0_0 navigation stack:
  NSUInteger expectedCount = MIN(currentReactABI29_0_0Count, self.ReactABI29_0_0Subviews.count);
  _previousViews = [[self.ReactABI29_0_0Subviews subarrayWithRange: NSMakeRange(0, expectedCount)] copy];
  _previousRequestedTopOfStack = _requestedTopOfStack;
}

// TODO: This will likely fail when performing multiple pushes/pops. We must
// free the lock only after the *last* push/pop.
- (void)wrapperViewController:(ABI29_0_0RCTWrapperViewController *)wrapperViewController
didMoveToNavigationController:(UINavigationController *)navigationController
{
  if (self.superview == nil) {
    // If superview is nil, then a JS reload (Cmd+R) happened
    // while a push/pop is in progress.
    return;
  }

  ABI29_0_0RCTAssert(
    (navigationController == nil || [_navigationController.viewControllers containsObject:wrapperViewController]),
    @"if navigation controller is not nil, it should contain the wrapper view controller"
  );
  ABI29_0_0RCTAssert(_navigationController.navigationLock == ABI29_0_0RCTNavigationLockJavaScript ||
           _numberOfViewControllerMovesToIgnore == 0,
           @"If JS doesn't have the lock there should never be any pending transitions");
  /**
   * When JS has the lock we want to keep track of when the request completes
   * the pending transition count hitting 0 signifies this, and should always
   * remain at 0 when JS does not have the lock
   */
  if (_numberOfViewControllerMovesToIgnore > 0) {
    _numberOfViewControllerMovesToIgnore -= 1;
  }
  if (_numberOfViewControllerMovesToIgnore == 0) {
    [self handleTopOfStackChanged];
    [self freeLock];
  }
}

@end
