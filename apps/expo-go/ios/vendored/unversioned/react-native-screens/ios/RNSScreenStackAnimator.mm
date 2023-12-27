#import "RNSScreenStackAnimator.h"
#import "RNSScreenStack.h"

#import "RNSScreen.h"

// proportions to default transition duration
static const float RNSSlideOpenTransitionDurationProportion = 1;
static const float RNSFadeOpenTransitionDurationProportion = 0.2 / 0.35;
static const float RNSSlideCloseTransitionDurationProportion = 0.25 / 0.35;
static const float RNSFadeCloseTransitionDurationProportion = 0.15 / 0.35;
static const float RNSFadeCloseDelayTransitionDurationProportion = 0.1 / 0.35;

@implementation RNSScreenStackAnimator {
  UINavigationControllerOperation _operation;
  NSTimeInterval _transitionDuration;
}

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation
{
  if (self = [super init]) {
    _operation = operation;
    _transitionDuration = 0.35; // default duration in seconds
  }
  return self;
}

- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext
{
  RNSScreenView *screen;
  if (_operation == UINavigationControllerOperationPush) {
    UIViewController *toViewController =
        [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
    screen = ((RNSScreen *)toViewController).screenView;
  } else if (_operation == UINavigationControllerOperationPop) {
    UIViewController *fromViewController =
        [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    screen = ((RNSScreen *)fromViewController).screenView;
  }

  if (screen != nil && screen.stackAnimation == RNSScreenStackAnimationNone) {
    return 0;
  }

  if (screen != nil && screen.transitionDuration != nil && [screen.transitionDuration floatValue] >= 0) {
    float durationInSeconds = [screen.transitionDuration floatValue] / 1000.0;
    return durationInSeconds;
  }

  return _transitionDuration;
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{
  UIViewController *toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
  UIViewController *fromViewController =
      [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
  toViewController.view.frame = [transitionContext finalFrameForViewController:toViewController];

  RNSScreenView *screen;
  if (_operation == UINavigationControllerOperationPush) {
    screen = ((RNSScreen *)toViewController).screenView;
  } else if (_operation == UINavigationControllerOperationPop) {
    screen = ((RNSScreen *)fromViewController).screenView;
  }

  if (screen != nil) {
    if (screen.fullScreenSwipeEnabled && transitionContext.isInteractive) {
      // we are swiping with full width gesture
      if (screen.customAnimationOnSwipe) {
        [self animateTransitionWithStackAnimation:screen.stackAnimation
                                transitionContext:transitionContext
                                             toVC:toViewController
                                           fromVC:fromViewController];
      } else {
        // we have to provide an animation when swiping, otherwise the screen will be popped immediately,
        // so in case of no custom animation on swipe set, we provide the one closest to the default
        [self animateSimplePushWithTransitionContext:transitionContext toVC:toViewController fromVC:fromViewController];
      }
    } else {
      // we are going forward or provided custom animation on swipe or clicked native header back button
      [self animateTransitionWithStackAnimation:screen.stackAnimation
                              transitionContext:transitionContext
                                           toVC:toViewController
                                         fromVC:fromViewController];
    }
  }
}

- (void)animateSimplePushWithTransitionContext:(id<UIViewControllerContextTransitioning>)transitionContext
                                          toVC:(UIViewController *)toViewController
                                        fromVC:(UIViewController *)fromViewController
{
  float containerWidth = transitionContext.containerView.bounds.size.width;
  float belowViewWidth = containerWidth * 0.3;

  CGAffineTransform rightTransform = CGAffineTransformMakeTranslation(containerWidth, 0);
  CGAffineTransform leftTransform = CGAffineTransformMakeTranslation(-belowViewWidth, 0);

  if (toViewController.navigationController.view.semanticContentAttribute ==
      UISemanticContentAttributeForceRightToLeft) {
    rightTransform = CGAffineTransformMakeTranslation(-containerWidth, 0);
    leftTransform = CGAffineTransformMakeTranslation(belowViewWidth, 0);
  }

  if (_operation == UINavigationControllerOperationPush) {
    toViewController.view.transform = rightTransform;
    [[transitionContext containerView] addSubview:toViewController.view];
    [UIView animateWithDuration:[self transitionDuration:transitionContext]
        animations:^{
          fromViewController.view.transform = leftTransform;
          toViewController.view.transform = CGAffineTransformIdentity;
        }
        completion:^(BOOL finished) {
          fromViewController.view.transform = CGAffineTransformIdentity;
          toViewController.view.transform = CGAffineTransformIdentity;
          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
  } else if (_operation == UINavigationControllerOperationPop) {
    toViewController.view.transform = leftTransform;
    [[transitionContext containerView] insertSubview:toViewController.view belowSubview:fromViewController.view];

    void (^animationBlock)(void) = ^{
      toViewController.view.transform = CGAffineTransformIdentity;
      fromViewController.view.transform = rightTransform;
    };
    void (^completionBlock)(BOOL) = ^(BOOL finished) {
      fromViewController.view.transform = CGAffineTransformIdentity;
      toViewController.view.transform = CGAffineTransformIdentity;
      [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
    };

    if (!transitionContext.isInteractive) {
      [UIView animateWithDuration:[self transitionDuration:transitionContext]
                       animations:animationBlock
                       completion:completionBlock];
    } else {
      // we don't want the EaseInOut option when swiping to dismiss the view, it is the same in default animation option
      [UIView animateWithDuration:[self transitionDuration:transitionContext]
                            delay:0.0
                          options:UIViewAnimationOptionCurveLinear
                       animations:animationBlock
                       completion:completionBlock];
    }
  }
}

- (void)animateFadeWithTransitionContext:(id<UIViewControllerContextTransitioning>)transitionContext
                                    toVC:(UIViewController *)toViewController
                                  fromVC:(UIViewController *)fromViewController
{
  toViewController.view.frame = [transitionContext finalFrameForViewController:toViewController];

  if (_operation == UINavigationControllerOperationPush) {
    [[transitionContext containerView] addSubview:toViewController.view];
    toViewController.view.alpha = 0.0;
    [UIView animateWithDuration:[self transitionDuration:transitionContext]
        animations:^{
          toViewController.view.alpha = 1.0;
        }
        completion:^(BOOL finished) {
          toViewController.view.alpha = 1.0;
          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
  } else if (_operation == UINavigationControllerOperationPop) {
    [[transitionContext containerView] insertSubview:toViewController.view belowSubview:fromViewController.view];

    [UIView animateWithDuration:[self transitionDuration:transitionContext]
        animations:^{
          fromViewController.view.alpha = 0.0;
        }
        completion:^(BOOL finished) {
          fromViewController.view.alpha = 1.0;

          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
  }
}

- (void)animateSlideFromBottomWithTransitionContext:(id<UIViewControllerContextTransitioning>)transitionContext
                                               toVC:(UIViewController *)toViewController
                                             fromVC:(UIViewController *)fromViewController
{
  CGAffineTransform topBottomTransform =
      CGAffineTransformMakeTranslation(0, transitionContext.containerView.bounds.size.height);

  if (_operation == UINavigationControllerOperationPush) {
    toViewController.view.transform = topBottomTransform;
    [[transitionContext containerView] addSubview:toViewController.view];
    [UIView animateWithDuration:[self transitionDuration:transitionContext]
        animations:^{
          fromViewController.view.transform = CGAffineTransformIdentity;
          toViewController.view.transform = CGAffineTransformIdentity;
        }
        completion:^(BOOL finished) {
          fromViewController.view.transform = CGAffineTransformIdentity;
          toViewController.view.transform = CGAffineTransformIdentity;
          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
  } else if (_operation == UINavigationControllerOperationPop) {
    toViewController.view.transform = CGAffineTransformIdentity;
    [[transitionContext containerView] insertSubview:toViewController.view belowSubview:fromViewController.view];

    void (^animationBlock)(void) = ^{
      toViewController.view.transform = CGAffineTransformIdentity;
      fromViewController.view.transform = topBottomTransform;
    };
    void (^completionBlock)(BOOL) = ^(BOOL finished) {
      fromViewController.view.transform = CGAffineTransformIdentity;
      toViewController.view.transform = CGAffineTransformIdentity;
      [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
    };

    if (!transitionContext.isInteractive) {
      [UIView animateWithDuration:[self transitionDuration:transitionContext]
                       animations:animationBlock
                       completion:completionBlock];
    } else {
      // we don't want the EaseInOut option when swiping to dismiss the view, it is the same in default animation option
      [UIView animateWithDuration:[self transitionDuration:transitionContext]
                            delay:0.0
                          options:UIViewAnimationOptionCurveLinear
                       animations:animationBlock
                       completion:completionBlock];
    }
  }
}

- (void)animateFadeFromBottomWithTransitionContext:(id<UIViewControllerContextTransitioning>)transitionContext
                                              toVC:(UIViewController *)toViewController
                                            fromVC:(UIViewController *)fromViewController
{
  CGAffineTransform topBottomTransform =
      CGAffineTransformMakeTranslation(0, 0.08 * transitionContext.containerView.bounds.size.height);

  const float transitionDuration = [self transitionDuration:transitionContext];

  if (_operation == UINavigationControllerOperationPush) {
    toViewController.view.transform = topBottomTransform;
    toViewController.view.alpha = 0.0;
    [[transitionContext containerView] addSubview:toViewController.view];

    // Android Nougat open animation
    // http://aosp.opersys.com/xref/android-7.1.2_r37/xref/frameworks/base/core/res/res/anim/activity_open_enter.xml
    [UIView animateWithDuration:transitionDuration * RNSSlideOpenTransitionDurationProportion // defaults to 0.35 s
        delay:0
        options:UIViewAnimationOptionCurveEaseOut
        animations:^{
          fromViewController.view.transform = CGAffineTransformIdentity;
          toViewController.view.transform = CGAffineTransformIdentity;
        }
        completion:^(BOOL finished) {
          fromViewController.view.transform = CGAffineTransformIdentity;
          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
    [UIView animateWithDuration:transitionDuration * RNSFadeOpenTransitionDurationProportion // defaults to 0.2 s
                          delay:0
                        options:UIViewAnimationOptionCurveEaseOut
                     animations:^{
                       toViewController.view.alpha = 1.0;
                     }
                     completion:nil];

  } else if (_operation == UINavigationControllerOperationPop) {
    toViewController.view.transform = CGAffineTransformIdentity;
    [[transitionContext containerView] insertSubview:toViewController.view belowSubview:fromViewController.view];

    // Android Nougat exit animation
    // http://aosp.opersys.com/xref/android-7.1.2_r37/xref/frameworks/base/core/res/res/anim/activity_close_exit.xml
    [UIView animateWithDuration:transitionDuration * RNSSlideCloseTransitionDurationProportion // defaults to 0.25 s
        delay:0
        options:UIViewAnimationOptionCurveEaseIn
        animations:^{
          toViewController.view.transform = CGAffineTransformIdentity;
          fromViewController.view.transform = topBottomTransform;
        }
        completion:^(BOOL finished) {
          fromViewController.view.transform = CGAffineTransformIdentity;
          toViewController.view.transform = CGAffineTransformIdentity;
          fromViewController.view.alpha = 1.0;
          toViewController.view.alpha = 1.0;
          [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
        }];
    [UIView animateWithDuration:transitionDuration * RNSFadeCloseTransitionDurationProportion // defaults to 0.15 s
                          delay:transitionDuration * RNSFadeCloseDelayTransitionDurationProportion // defaults to 0.1 s
                        options:UIViewAnimationOptionCurveLinear
                     animations:^{
                       fromViewController.view.alpha = 0.0;
                     }
                     completion:nil];
  }
}

+ (BOOL)isCustomAnimation:(RNSScreenStackAnimation)animation
{
  return (animation != RNSScreenStackAnimationFlip && animation != RNSScreenStackAnimationDefault);
}

- (void)animateTransitionWithStackAnimation:(RNSScreenStackAnimation)animation
                          transitionContext:(id<UIViewControllerContextTransitioning>)transitionContext
                                       toVC:(UIViewController *)toVC
                                     fromVC:(UIViewController *)fromVC
{
  if (animation == RNSScreenStackAnimationSimplePush) {
    [self animateSimplePushWithTransitionContext:transitionContext toVC:toVC fromVC:fromVC];
    return;
  } else if (animation == RNSScreenStackAnimationFade || animation == RNSScreenStackAnimationNone) {
    [self animateFadeWithTransitionContext:transitionContext toVC:toVC fromVC:fromVC];
    return;
  } else if (animation == RNSScreenStackAnimationSlideFromBottom) {
    [self animateSlideFromBottomWithTransitionContext:transitionContext toVC:toVC fromVC:fromVC];
    return;
  } else if (animation == RNSScreenStackAnimationFadeFromBottom) {
    [self animateFadeFromBottomWithTransitionContext:transitionContext toVC:toVC fromVC:fromVC];
    return;
  }
  // simple_push is the default custom animation
  [self animateSimplePushWithTransitionContext:transitionContext toVC:toVC fromVC:fromVC];
}

@end
