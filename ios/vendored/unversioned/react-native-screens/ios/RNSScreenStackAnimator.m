#import "RNSScreenStackAnimator.h"
#import "RNSScreenStack.h"
#import "RNSScreen.h"

@implementation RNSScreenStackAnimator {
  UINavigationControllerOperation _operation;
  NSTimeInterval _transitionDuration;
}

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation
{
  if (self = [super init]) {
    _operation = operation;
    _transitionDuration = 0.35; // default duration
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
  return _transitionDuration;
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{
  UIViewController* toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
  UIViewController* fromViewController = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
  toViewController.view.frame = [transitionContext finalFrameForViewController:toViewController];

  RNSScreenView *screen;
  if (_operation == UINavigationControllerOperationPush) {
    screen = (RNSScreenView *)toViewController.view;
  } else if (_operation == UINavigationControllerOperationPop) {
    screen = (RNSScreenView *)fromViewController.view;
  }
  
  if (screen != nil) {
    if (screen.stackAnimation == RNSScreenStackAnimationSimplePush) {
      [self animateSimplePushWithTransitionContext:transitionContext toVC:toViewController fromVC:fromViewController];
    } else if (screen.stackAnimation == RNSScreenStackAnimationFade || screen.stackAnimation == RNSScreenStackAnimationNone) {
      [self animateFadeWithTransitionContext:transitionContext toVC:toViewController fromVC:fromViewController];
    } else if (screen.stackAnimation == RNSScreenStackAnimationSlideFromBottom) {
      [self animateSlideFromBottomWithTransitionContext:transitionContext toVC:toViewController fromVC:fromViewController];
    }
  }
}

- (void)animateSimplePushWithTransitionContext:(id<UIViewControllerContextTransitioning>)transitionContext
                                          toVC:(UIViewController *)toViewController fromVC:(UIViewController *)fromViewController
{
  float containerWidth = transitionContext.containerView.bounds.size.width;
  float belowViewWidth = containerWidth * 0.3;

  CGAffineTransform rightTransform = CGAffineTransformMakeTranslation(containerWidth, 0);
  CGAffineTransform leftTransform = CGAffineTransformMakeTranslation(-belowViewWidth, 0);
  
  if (toViewController.navigationController.view.semanticContentAttribute == UISemanticContentAttributeForceRightToLeft) {
    rightTransform = CGAffineTransformMakeTranslation(-containerWidth, 0);
    leftTransform = CGAffineTransformMakeTranslation(belowViewWidth, 0);
    }
  
  if (_operation == UINavigationControllerOperationPush) {
    toViewController.view.transform = rightTransform;
    [[transitionContext containerView] addSubview:toViewController.view];
    [UIView animateWithDuration:[self transitionDuration:transitionContext] animations:^{
      fromViewController.view.transform = leftTransform;
      toViewController.view.transform = CGAffineTransformIdentity;
    } completion:^(BOOL finished) {
      fromViewController.view.transform = CGAffineTransformIdentity;
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
        if (transitionContext.transitionWasCancelled) {
          toViewController.view.transform = CGAffineTransformIdentity;
        }
        [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
    };
      
    if (!transitionContext.isInteractive) {
      [UIView animateWithDuration:[self transitionDuration:transitionContext] animations:animationBlock completion:completionBlock];
    } else {
      // we don't want the EaseInOut option when swiping to dismiss the view, it is the same in default animation option
      [UIView animateWithDuration:[self transitionDuration:transitionContext] delay:0.0 options:UIViewAnimationOptionCurveLinear animations:animationBlock completion:completionBlock];
    }
  }
}

- (void)animateFadeWithTransitionContext:(id<UIViewControllerContextTransitioning>)transitionContext
                                    toVC:(UIViewController *)toViewController fromVC:(UIViewController *)fromViewController
{
  toViewController.view.frame = [transitionContext finalFrameForViewController:toViewController];
  
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
      if (transitionContext.transitionWasCancelled) {
        toViewController.view.transform = CGAffineTransformIdentity;
      }
      [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
    }];
  }
}

- (void)animateSlideFromBottomWithTransitionContext:(id<UIViewControllerContextTransitioning>)transitionContext
                                    toVC:(UIViewController *)toViewController fromVC:(UIViewController *)fromViewController
{
  CGAffineTransform topBottomTransform = CGAffineTransformMakeTranslation(0, transitionContext.containerView.bounds.size.height);

   if (_operation == UINavigationControllerOperationPush) {
     toViewController.view.transform = topBottomTransform;
     [[transitionContext containerView] addSubview:toViewController.view];
     [UIView animateWithDuration:[self transitionDuration:transitionContext] animations:^{
       fromViewController.view.transform = CGAffineTransformIdentity;
       toViewController.view.transform = CGAffineTransformIdentity;
     } completion:^(BOOL finished) {
       fromViewController.view.transform = CGAffineTransformIdentity;
       [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
     }];
   } else if (_operation == UINavigationControllerOperationPop) {
     toViewController.view.transform = CGAffineTransformIdentity;
     [[transitionContext containerView] insertSubview:toViewController.view belowSubview:fromViewController.view];
     [UIView animateWithDuration:[self transitionDuration:transitionContext] animations:^{
         toViewController.view.transform = CGAffineTransformIdentity;
         fromViewController.view.transform = topBottomTransform;
     } completion:^(BOOL finished) {
       [transitionContext completeTransition:![transitionContext transitionWasCancelled]];
     }];
   }
}

@end
