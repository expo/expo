//
//  LOTAnimationTransitionController.m
//  Lottie
//
//  Created by Brandon Withrow on 1/18/17.
//  Copyright © 2017 Brandon Withrow. All rights reserved.
//

#import "LOTAnimationTransitionController.h"
#import "LOTAnimationView.h"

@implementation LOTAnimationTransitionController {
  LOTAnimationView *transitionAnimationView_;
  NSString *fromLayerName_;
  NSString *toLayerName_;
  NSBundle *inBundle_;
  BOOL _applyTransform;
}

- (nonnull instancetype)initWithAnimationNamed:(nonnull NSString *)animation
                                fromLayerNamed:(nullable NSString *)fromLayer
                                  toLayerNamed:(nullable NSString *)toLayer
                       applyAnimationTransform:(BOOL)applyAnimationTransform {
  
  return [self initWithAnimationNamed:animation
                       fromLayerNamed:fromLayer
                         toLayerNamed:toLayer
              applyAnimationTransform:applyAnimationTransform
                             inBundle:[NSBundle mainBundle]];
}

- (instancetype)initWithAnimationNamed:(NSString *)animation
                        fromLayerNamed:(NSString *)fromLayer
                          toLayerNamed:(NSString *)toLayer
               applyAnimationTransform:(BOOL)applyAnimationTransform
                              inBundle:(NSBundle *)bundle {
  self = [super init];
  if (self) {
    transitionAnimationView_ = [LOTAnimationView animationNamed:animation inBundle:bundle];
    fromLayerName_ = fromLayer;
    toLayerName_ = toLayer;
    _applyTransform = applyAnimationTransform;
  }
  return self;
}

- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext {
  return transitionAnimationView_.animationDuration;
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext {
  UIViewController *fromVC = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
  UIViewController *toVC = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
  UIView *containerView = transitionContext.containerView;
  
  UIView *toSnapshot = [toVC.view resizableSnapshotViewFromRect:containerView.bounds
                                             afterScreenUpdates:YES
                                                  withCapInsets:UIEdgeInsetsZero];
  toSnapshot.frame = containerView.bounds;
  
  UIView *fromSnapshot = [fromVC.view resizableSnapshotViewFromRect:containerView.bounds
                                                 afterScreenUpdates:NO
                                                      withCapInsets:UIEdgeInsetsZero];
  fromSnapshot.frame = containerView.bounds;
  
  transitionAnimationView_.frame = containerView.bounds;
  transitionAnimationView_.contentMode = UIViewContentModeScaleAspectFill;
  [containerView addSubview:transitionAnimationView_];
  
  BOOL crossFadeViews = NO;
  
  if (toLayerName_.length) {
    LOTKeypath *toKeypath = [LOTKeypath keypathWithString:toLayerName_];
    CGRect convertedBounds = [transitionAnimationView_ convertRect:containerView.bounds toKeypathLayer:toKeypath];
    toSnapshot.frame = convertedBounds;
    if (_applyTransform) {
      [transitionAnimationView_ addSubview:toSnapshot toKeypathLayer:toKeypath];
    } else {
      [transitionAnimationView_ maskSubview:toSnapshot toKeypathLayer:toKeypath];
    }
  } else {
    [containerView addSubview:toSnapshot];
    [containerView sendSubviewToBack:toSnapshot];
    toSnapshot.alpha = 0;
    crossFadeViews = YES;
  }
  
  if (fromLayerName_.length) {
    LOTKeypath *fromKeypath = [LOTKeypath keypathWithString:fromLayerName_];
    CGRect convertedBounds = [transitionAnimationView_ convertRect:containerView.bounds fromKeypathLayer:fromKeypath];
    fromSnapshot.frame = convertedBounds;
    if (_applyTransform) {
      [transitionAnimationView_ addSubview:fromSnapshot toKeypathLayer:fromKeypath];
    } else {
      [transitionAnimationView_ maskSubview:fromSnapshot toKeypathLayer:fromKeypath];
    }
  } else {
    [containerView addSubview:fromSnapshot];
    [containerView sendSubviewToBack:fromSnapshot];
  }
  
  [containerView addSubview:toVC.view];
  toVC.view.hidden = YES;
  
  if (crossFadeViews) {
    CGFloat duration = transitionAnimationView_.animationDuration * 0.25;
    CGFloat delay = (transitionAnimationView_.animationDuration - duration) / 2.f;
    
    [UIView animateWithDuration:duration
                          delay:delay
                        options:(UIViewAnimationOptionCurveEaseInOut)
                     animations:^{
                       toSnapshot.alpha = 1;
                     } completion:^(BOOL finished) {
                       
                     }];
  }
  
  [transitionAnimationView_ playWithCompletion:^(BOOL animationFinished) {
    toVC.view.hidden = false;
    [self->transitionAnimationView_ removeFromSuperview];
    [transitionContext completeTransition:animationFinished];
  }];
}

@end

