#import "RNSScreenStack.h"
#import "RNSScreen.h"
#import "RNSScreenStackHeaderConfig.h"

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTShadowView.h>
#import <React/RCTRootContentView.h>
#import <React/RCTTouchHandler.h>

@interface RNSScreenStackView () <UINavigationControllerDelegate, UIGestureRecognizerDelegate>
@end

@interface RNSScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>
- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
@end

@implementation RNSScreenStackView {
  BOOL _needUpdate;
  UINavigationController *_controller;
  NSMutableArray<RNSScreenView *> *_reactSubviews;
  NSMutableSet<RNSScreenView *> *_dismissedScreens;
  NSMutableArray<UIViewController *> *_presentedModals;
  __weak RNSScreenStackManager *_manager;
}

- (instancetype)initWithManager:(RNSScreenStackManager*)manager
{
  if (self = [super init]) {
    _manager = manager;
    _reactSubviews = [NSMutableArray new];
    _presentedModals = [NSMutableArray new];
    _dismissedScreens = [NSMutableSet new];
    _controller = [[UINavigationController alloc] init];
    _controller.delegate = self;
    _needUpdate = NO;
    [self addSubview:_controller.view];
    _controller.interactivePopGestureRecognizer.delegate = self;

    // we have to initialize viewControllers with a non empty array for
    // largeTitle header to render in the opened state. If it is empty
    // the header will render in collapsed state which is perhaps a bug
    // in UIKit but ¯\_(ツ)_/¯
    [_controller setViewControllers:@[[UIViewController new]]];
  }
  return self;
}

- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  UIView *view = viewController.view;
  RNSScreenStackHeaderConfig *config = nil;
  for (UIView *subview in view.reactSubviews) {
    if ([subview isKindOfClass:[RNSScreenStackHeaderConfig class]]) {
      config = (RNSScreenStackHeaderConfig*) subview;
      break;
    }
  }
  [RNSScreenStackHeaderConfig willShowViewController:viewController withConfig:config];
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  for (NSUInteger i = _reactSubviews.count; i > 0; i--) {
    if ([viewController isEqual:[_reactSubviews objectAtIndex:i - 1].controller]) {
      break;
    } else {
      [_dismissedScreens addObject:[_reactSubviews objectAtIndex:i - 1]];
    }
  }
}

- (id<UIViewControllerAnimatedTransitioning>)navigationController:(UINavigationController *)navigationController animationControllerForOperation:(UINavigationControllerOperation)operation fromViewController:(UIViewController *)fromVC toViewController:(UIViewController *)toVC
{
  RNSScreenView *screen;
  if (operation == UINavigationControllerOperationPush) {
    screen = (RNSScreenView *) toVC.view;
  } else if (operation == UINavigationControllerOperationPop) {
   screen = (RNSScreenView *) fromVC.view;
  }
  if (screen != nil && (screen.stackAnimation == RNSScreenStackAnimationFade || screen.stackAnimation == RNSScreenStackAnimationNone)) {
    return  [[RNSScreenStackAnimator alloc] initWithOperation:operation];
  }
  return nil;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  // cancel touches in parent, this is needed to cancel RN touch events. For example when Touchable
  // item is close to an edge and we start pulling from edge we want the Touchable to be cancelled.
  // Without the below code the Touchable will remain active (highlighted) for the duration of back
  // gesture and onPress may fire when we release the finger.
  UIView *parent = _controller.view;
  while (parent != nil && ![parent isKindOfClass:[RCTRootContentView class]]) parent = parent.superview;
  RCTRootContentView *rootView = (RCTRootContentView *)parent;
  [rootView.touchHandler cancel];

  return _controller.viewControllers.count > 1;
}

- (void)markChildUpdated
{
  // do nothing
}

- (void)didUpdateChildren
{
  // do nothing
}

- (void)insertReactSubview:(RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  if (![subview isKindOfClass:[RNSScreenView class]]) {
    RCTLogError(@"ScreenStack only accepts children of type Screen");
    return;
  }
  [_reactSubviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactSubview:(RNSScreenView *)subview
{
  [_reactSubviews removeObject:subview];
  [_dismissedScreens removeObject:subview];
}

- (NSArray<UIView *> *)reactSubviews
{
  return _reactSubviews;
}

- (void)didUpdateReactSubviews
{
  // do nothing
  [self updateContainer];
}

- (void)setModalViewControllers:(NSArray<UIViewController *> *)controllers
{
  NSMutableArray<UIViewController *> *newControllers = [NSMutableArray arrayWithArray:controllers];
  [newControllers removeObjectsInArray:_presentedModals];

  NSMutableArray<UIViewController *> *controllersToRemove = [NSMutableArray arrayWithArray:_presentedModals];
  [controllersToRemove removeObjectsInArray:controllers];

  // presenting new controllers
  for (UIViewController *newController in newControllers) {
    [_presentedModals addObject:newController];
    if (_controller.presentedViewController != nil) {
      [_controller.presentedViewController presentViewController:newController animated:YES completion:nil];
    } else {
      [_controller presentViewController:newController animated:YES completion:nil];
    }
  }

  // hiding old controllers
  for (UIViewController *controller in [controllersToRemove reverseObjectEnumerator]) {
    [_presentedModals removeObject:controller];
    if (controller.presentedViewController != nil) {
      UIViewController *restore = controller.presentedViewController;
      UIViewController *parent = controller.presentingViewController;
      [controller dismissViewControllerAnimated:NO completion:^{
        [parent dismissViewControllerAnimated:NO completion:^{
          [parent presentViewController:restore animated:NO completion:nil];
        }];
      }];
    } else {
      [controller.presentingViewController dismissViewControllerAnimated:YES completion:nil];
    }
  }
}

- (void)setPushViewControllers:(NSArray<UIViewController *> *)controllers
{
  UIViewController *top = controllers.lastObject;
  UIViewController *lastTop = _controller.viewControllers.lastObject;

  // at the start we set viewControllers to contain a single UIVIewController
  // instance. This is a workaround for header height adjustment bug (see comment
  // in the init function). Here, we need to detect if the initial empty
  // controller is still there
  BOOL firstTimePush = ![lastTop isKindOfClass:[RNSScreen class]];

  BOOL shouldAnimate = !firstTimePush && ((RNSScreenView *) lastTop.view).stackAnimation != RNSScreenStackAnimationNone;

  if (firstTimePush) {
    // nothing pushed yet
    [_controller setViewControllers:controllers animated:NO];
  } else if (top != lastTop) {
    if (![controllers containsObject:lastTop]) {
      // last top controller is no longer on stack
      // in this case we set the controllers stack to the new list with
      // added the last top element to it and perform (animated) pop
      NSMutableArray *newControllers = [NSMutableArray arrayWithArray:controllers];
      [newControllers addObject:lastTop];
      [_controller setViewControllers:newControllers animated:NO];
      [_controller popViewControllerAnimated:shouldAnimate];
    } else if (![_controller.viewControllers containsObject:top]) {
      // new top controller is not on the stack
      // in such case we update the stack except from the last element with
      // no animation and do animated push of the last item
      NSMutableArray *newControllers = [NSMutableArray arrayWithArray:controllers];
      [newControllers removeLastObject];
      [_controller setViewControllers:newControllers animated:NO];
      [_controller pushViewController:top animated:shouldAnimate];
    } else {
      // don't really know what this case could be, but may need to handle it
      // somehow
      [_controller setViewControllers:controllers animated:shouldAnimate];
    }
  } else {
    // change wasn't on the top of the stack. We don't need animation.
    [_controller setViewControllers:controllers animated:NO];
  }
}

- (void)updateContainer
{
  NSMutableArray<UIViewController *> *pushControllers = [NSMutableArray new];
  NSMutableArray<UIViewController *> *modalControllers = [NSMutableArray new];
  for (RNSScreenView *screen in _reactSubviews) {
    if (![_dismissedScreens containsObject:screen]) {
      if (pushControllers.count == 0) {
        // first screen on the list needs to be places as "push controller"
        [pushControllers addObject:screen.controller];
      } else {
        if (screen.stackPresentation == RNSScreenStackPresentationPush) {
          [pushControllers addObject:screen.controller];
        } else {
          [modalControllers addObject:screen.controller];
        }
      }
    }
  }

  [self setPushViewControllers:pushControllers];
  [self setModalViewControllers:modalControllers];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self reactAddControllerToClosestParent:_controller];
  _controller.view.frame = self.bounds;
}

- (void)dismissOnReload
{
  dispatch_async(dispatch_get_main_queue(), ^{
    for (UIViewController *controller in self->_presentedModals) {
      [controller dismissViewControllerAnimated:NO completion:nil];
    }
  });
}

@end

@implementation RNSScreenStackManager {
  NSPointerArray *_stacks;
}

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(transitioning, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat)

- (UIView *)view
{
  RNSScreenStackView *view = [[RNSScreenStackView alloc] initWithManager:self];
  if (!_stacks) {
    _stacks = [NSPointerArray weakObjectsPointerArray];
  }
  [_stacks addPointer:(__bridge void *)view];
  return view;
}

- (void)invalidate
{
 for (RNSScreenStackView *stack in _stacks) {
   [stack dismissOnReload];
 }
 _stacks = nil;
}

@end

@implementation RNSScreenStackAnimator {
  UINavigationControllerOperation _operation;
}

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation
{
  if (self = [super init]) {
    _operation = operation;
  }
  return self;
}

- (NSTimeInterval)transitionDuration:(id <UIViewControllerContextTransitioning>)transitionContext
{
  RNSScreenView *screen;
  if (_operation == UINavigationControllerOperationPush) {
    UIViewController* toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
    screen = (RNSScreenView *)toViewController.view;
  } else if (_operation == UINavigationControllerOperationPop) {
    UIViewController* fromViewController = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    screen = (RNSScreenView *)fromViewController.view;
  }

  if (screen != nil && screen.stackAnimation == RNSScreenStackAnimationNone) {
    return 0;
  }
  return 0.35; // default duration
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{
  UIViewController* toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
  UIViewController* fromViewController = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];

  if (_operation == UINavigationControllerOperationPush) {
    [[transitionContext containerView] addSubview:toViewController.view];
    toViewController.view.alpha = 0.0;
    [UIView animateWithDuration:[self transitionDuration:transitionContext] animations:^{
      toViewController.view.alpha = 1.0;
    } completion:^(BOOL finished) {
      [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
    }];
  } else if (_operation == UINavigationControllerOperationPop) {
    [[transitionContext containerView] insertSubview:toViewController.view belowSubview:fromViewController.view];

    [UIView animateWithDuration:[self transitionDuration:transitionContext] animations:^{
      fromViewController.view.alpha = 0.0;
    } completion:^(BOOL finished) {
      [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
    }];
  }
}

@end
