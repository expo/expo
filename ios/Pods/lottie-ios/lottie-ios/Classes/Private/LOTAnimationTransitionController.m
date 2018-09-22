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
  LOTAnimationView *tranistionAnimationView_;
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
    tranistionAnimationView_ = [LOTAnimationView animationNamed:animation inBundle:bundle];
    fromLayerName_ = fromLayer;
    toLayerName_ = toLayer;
    _applyTransform = applyAnimationTransform;
  }
  return self;
}

- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext {
  return tranistionAnimationView_.animationDuration;
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
  
  tranistionAnimationView_.frame = containerView.bounds;
  tranistionAnimationView_.contentMode = UIViewContentModeScaleAspectFill;
  [containerView addSubview:tranistionAnimationView_];
  
  BOOL crossFadeViews = NO;
  
  if (toLayerName_.length) {
    LOTKeypath *toKeypath = [LOTKeypath keypathWithString:toLayerName_];
    CGRect convertedBounds = [tranistionAnimationView_ convertRect:containerView.bounds toKeypathLayer:toKeypath];
    toSnapshot.frame = convertedBounds;
    if (_applyTransform) {
      [tranistionAnimationView_ addSubview:toSnapshot toKeypathLayer:toKeypath];
    } else {
      [tranistionAnimationView_ maskSubview:toSnapshot toKeypathLayer:toKeypath];
    }
  } else {
    [containerView addSubview:toSnapshot];
    [containerView sendSubviewToBack:toSnapshot];
    toSnapshot.alpha = 0;
    crossFadeViews = YES;
  }
  
  if (fromLayerName_.length) {
    LOTKeypath *fromKeypath = [LOTKeypath keypathWithString:fromLayerName_];
    CGRect convertedBounds = [tranistionAnimationView_ convertRect:containerView.bounds fromKeypathLayer:fromKeypath];
    fromSnapshot.frame = convertedBounds;
    if (_applyTransform) {
      [tranistionAnimationView_ addSubview:fromSnapshot toKeypathLayer:fromKeypath];
    } else {
      [tranistionAnimationView_ maskSubview:fromSnapshot toKeypathLayer:fromKeypath];
    }
  } else {
    [containerView addSubview:fromSnapshot];
    [containerView sendSubviewToBack:fromSnapshot];
  }
  
  [containerView addSubview:toVC.view];
  toVC.view.hidden = YES;
  
  if (crossFadeViews) {
    CGFloat duration = tranistionAnimationView_.animationDuration * 0.25;
    CGFloat delay = (tranistionAnimationView_.animationDuration - duration) / 2.f;
    
    [UIView animateWithDuration:duration
                          delay:delay
                        options:(UIViewAnimationOptionCurveEaseInOut)
                     animations:^{
                       toSnapshot.alpha = 1;
                     } completion:^(BOOL finished) {
                       
                     }];
  }
  
  [tranistionAnimationView_ playWithCompletion:^(BOOL animationFinished) {
    toVC.view.hidden = false;
    [tranistionAnimationView_ removeFromSuperview];
    [transitionContext completeTransition:animationFinished];
  }];
}

@end

