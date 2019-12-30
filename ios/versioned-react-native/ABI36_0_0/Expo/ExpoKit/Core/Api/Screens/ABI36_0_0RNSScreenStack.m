#import "ABI36_0_0RNSScreenStack.h"
#import "ABI36_0_0RNSScreen.h"
#import "ABI36_0_0RNSScreenStackHeaderConfig.h"

#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManager.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManagerUtils.h>
#import <ABI36_0_0React/ABI36_0_0RCTShadowView.h>
#import <ABI36_0_0React/ABI36_0_0RCTRootContentView.h>
#import <ABI36_0_0React/ABI36_0_0RCTTouchHandler.h>

@interface ABI36_0_0RNSScreenStackView () <UINavigationControllerDelegate, UIGestureRecognizerDelegate>
@end

@interface ABI36_0_0RNSScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>
- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
@end

@implementation ABI36_0_0RNSScreenStackView {
  BOOL _needUpdate;
  UINavigationController *_controller;
  NSMutableArray<ABI36_0_0RNSScreenView *> *_ABI36_0_0ReactSubviews;
  NSMutableSet<ABI36_0_0RNSScreenView *> *_dismissedScreens;
  NSMutableArray<UIViewController *> *_presentedModals;
  __weak ABI36_0_0RNSScreenStackManager *_manager;
}

- (instancetype)initWithManager:(ABI36_0_0RNSScreenStackManager*)manager
{
  if (self = [super init]) {
    _manager = manager;
    _ABI36_0_0ReactSubviews = [NSMutableArray new];
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
  ABI36_0_0RNSScreenStackHeaderConfig *config = nil;
  for (UIView *subview in view.ABI36_0_0ReactSubviews) {
    if ([subview isKindOfClass:[ABI36_0_0RNSScreenStackHeaderConfig class]]) {
      config = (ABI36_0_0RNSScreenStackHeaderConfig*) subview;
      break;
    }
  }
  [ABI36_0_0RNSScreenStackHeaderConfig willShowViewController:viewController withConfig:config];
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  for (NSUInteger i = _ABI36_0_0ReactSubviews.count; i > 0; i--) {
    if ([viewController isEqual:[_ABI36_0_0ReactSubviews objectAtIndex:i - 1].controller]) {
      break;
    } else {
      [_dismissedScreens addObject:[_ABI36_0_0ReactSubviews objectAtIndex:i - 1]];
    }
  }
}

- (id<UIViewControllerAnimatedTransitioning>)navigationController:(UINavigationController *)navigationController animationControllerForOperation:(UINavigationControllerOperation)operation fromViewController:(UIViewController *)fromVC toViewController:(UIViewController *)toVC
{
  ABI36_0_0RNSScreenView *screen;
  if (operation == UINavigationControllerOperationPush) {
    screen = (ABI36_0_0RNSScreenView *) toVC.view;
  } else if (operation == UINavigationControllerOperationPop) {
   screen = (ABI36_0_0RNSScreenView *) fromVC.view;
  }
  if (screen != nil && (screen.stackAnimation == ABI36_0_0RNSScreenStackAnimationFade || screen.stackAnimation == ABI36_0_0RNSScreenStackAnimationNone)) {
    return  [[ABI36_0_0RNSScreenStackAnimator alloc] initWithOperation:operation];
  }
  return nil;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  // cancel touches in parent, this is needed to cancel ABI36_0_0RN touch events. For example when Touchable
  // item is close to an edge and we start pulling from edge we want the Touchable to be cancelled.
  // Without the below code the Touchable will remain active (highlighted) for the duration of back
  // gesture and onPress may fire when we release the finger.
  UIView *parent = _controller.view;
  while (parent != nil && ![parent isKindOfClass:[ABI36_0_0RCTRootContentView class]]) parent = parent.superview;
  ABI36_0_0RCTRootContentView *rootView = (ABI36_0_0RCTRootContentView *)parent;
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

- (void)insertABI36_0_0ReactSubview:(ABI36_0_0RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  if (![subview isKindOfClass:[ABI36_0_0RNSScreenView class]]) {
    ABI36_0_0RCTLogError(@"ScreenStack only accepts children of type Screen");
    return;
  }
  [_ABI36_0_0ReactSubviews insertObject:subview atIndex:atIndex];
}

- (void)removeABI36_0_0ReactSubview:(ABI36_0_0RNSScreenView *)subview
{
  [_ABI36_0_0ReactSubviews removeObject:subview];
  [_dismissedScreens removeObject:subview];
}

- (NSArray<UIView *> *)ABI36_0_0ReactSubviews
{
  return _ABI36_0_0ReactSubviews;
}

- (void)didUpdateABI36_0_0ReactSubviews
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
  BOOL firstTimePush = ![lastTop isKindOfClass:[ABI36_0_0RNSScreen class]];

  BOOL shouldAnimate = !firstTimePush && ((ABI36_0_0RNSScreenView *) lastTop.view).stackAnimation != ABI36_0_0RNSScreenStackAnimationNone;

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
  for (ABI36_0_0RNSScreenView *screen in _ABI36_0_0ReactSubviews) {
    if (![_dismissedScreens containsObject:screen]) {
      if (pushControllers.count == 0) {
        // first screen on the list needs to be places as "push controller"
        [pushControllers addObject:screen.controller];
      } else {
        if (screen.stackPresentation == ABI36_0_0RNSScreenStackPresentationPush) {
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
  [self ABI36_0_0ReactAddControllerToClosestParent:_controller];
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

@implementation ABI36_0_0RNSScreenStackManager {
  NSPointerArray *_stacks;
}

ABI36_0_0RCT_EXPORT_MODULE()

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(transitioning, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat)

- (UIView *)view
{
  ABI36_0_0RNSScreenStackView *view = [[ABI36_0_0RNSScreenStackView alloc] initWithManager:self];
  if (!_stacks) {
    _stacks = [NSPointerArray weakObjectsPointerArray];
  }
  [_stacks addPointer:(__bridge void *)view];
  return view;
}

- (void)invalidate
{
 for (ABI36_0_0RNSScreenStackView *stack in _stacks) {
   [stack dismissOnReload];
 }
 _stacks = nil;
}

@end

@implementation ABI36_0_0RNSScreenStackAnimator {
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
  ABI36_0_0RNSScreenView *screen;
  if (_operation == UINavigationControllerOperationPush) {
    UIViewController* toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
    screen = (ABI36_0_0RNSScreenView *)toViewController.view;
  } else if (_operation == UINavigationControllerOperationPop) {
    UIViewController* fromViewController = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    screen = (ABI36_0_0RNSScreenView *)fromViewController.view;
  }

  if (screen != nil && screen.stackAnimation == ABI36_0_0RNSScreenStackAnimationNone) {
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
