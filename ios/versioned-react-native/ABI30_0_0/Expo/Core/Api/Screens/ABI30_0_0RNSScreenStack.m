#import "ABI30_0_0RNSScreenStack.h"
#import "ABI30_0_0RNSScreen.h"

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerUtils.h>

@interface ABI30_0_0RNSCustomAnimator : NSObject <UIViewControllerAnimatedTransitioning>

@property (nonatomic) BOOL presenting;

@end

@implementation ABI30_0_0RNSCustomAnimator

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{
  UIView *fromView = [transitionContext viewForKey:UITransitionContextFromViewKey];
  UIView *toView = [transitionContext viewForKey:UITransitionContextToViewKey];

  UIView *container = transitionContext.containerView;
  if (_presenting) {
    [container addSubview:toView];
    toView.alpha = 0.99;
  } else {
    [container insertSubview:toView belowSubview:fromView];
  }

  // When view is added to UINavController it flattens view's translation into frame and makes it
  // so that the view with translation applied is centered. We often don't want that as we want the
  // view to animated from side. In order to achieve this we reset the translation applied to the
  // view such that the frame is at point 0,0 and translation adds an offset from that position.
  CATransform3D origTransform = toView.layer.transform;
  toView.transform = CGAffineTransformIdentity;
  toView.frame = CGRectMake(0, 0, toView.frame.size.width, toView.frame.size.height);
  toView.layer.transform = origTransform;

  [UIView
   animateWithDuration:[self transitionDuration:transitionContext]
   animations:^{
     // We need to animate at least one property, otherwise the interactive animation wouldn't
     // behave as expected. I haven't had enough time to investigate and hence as a workaround
     // we are animating alpha from 1 to 0.99
     if (_presenting) {
       toView.alpha = 1.0;
     } else {
       fromView.alpha = 0.99;
     }
   } completion:^(BOOL finished) {
     BOOL success = !transitionContext.transitionWasCancelled;
     if (!success) {
       [toView removeFromSuperview];
     }
     [transitionContext completeTransition:success];
   }];
}

- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext
{
  // as long as it is non-zero it does not matter what value is here, we turn animation into
  // "interactive" mode anyways which make it be controlled by "progress" property anyways.
  return 0.1;
}

@end

@interface ABI30_0_0RNSScreenStackView () <UINavigationControllerDelegate>

@property (nonatomic) NSInteger transitioning;
@property (nonatomic) CGFloat progress;

@end

@implementation ABI30_0_0RNSScreenStackView {
  BOOL _needUpdate;
  BOOL _transitioningStateChanged;
  UINavigationController *_controller;
  NSMutableSet<ABI30_0_0RNSScreenView *> *_activeScreens;
  NSMutableArray<ABI30_0_0RNSScreenView *> *_ReactABI30_0_0Subviews;
  UIPercentDrivenInteractiveTransition *_interactor;
  __weak ABI30_0_0RNSScreenStackManager *_manager;
}

- (instancetype)initWithManager:(ABI30_0_0RNSScreenStackManager*)manager
{
  if (self = [super init]) {
    _manager = manager;
    _ReactABI30_0_0Subviews = [NSMutableArray new];
    _controller = [[UINavigationController alloc] init];
    _controller.navigationBarHidden = YES;
    _controller.delegate = self;
    _needUpdate = NO;
    [self addSubview:_controller.view];
  }
  return self;
}

- (id<UIViewControllerInteractiveTransitioning>)navigationController:(UINavigationController *)navigationController
                         interactionControllerForAnimationController:(id<UIViewControllerAnimatedTransitioning>)animationController
{
  return _interactor;
}

- (id<UIViewControllerAnimatedTransitioning>)navigationController:(UINavigationController *)navigationController
                                  animationControllerForOperation:(UINavigationControllerOperation)operation
                                               fromViewController:(UIViewController *)fromVC
                                                 toViewController:(UIViewController *)toVC
{
  ABI30_0_0RNSCustomAnimator *animator = [ABI30_0_0RNSCustomAnimator new];
  animator.presenting = _transitioning > 0;
  return animator;
}

- (void)markUpdated
{
  // We want 'updateContainer' to be executed on main thread after all enqueued operations in
  // uimanager are complete. In order to achieve that we enqueue call on UIManagerQueue from which
  // we enqueue call on the main queue. This seems to be working ok in all the cases I've tried but
  // there is a chance it is not the correct way to do that.
  if (!_needUpdate) {
    _needUpdate = YES;
    ABI30_0_0RCTExecuteOnUIManagerQueue(^{
      ABI30_0_0RCTExecuteOnMainQueue(^{
        _needUpdate = NO;
        [self updateContainer];
      });
    });
  }
}

- (void)markChildUpdated
{
  // do nothing
}

- (void)didUpdateChildren
{
  // do nothing
}

- (void)setProgress:(CGFloat)progress
{
  _progress = progress;
  [_interactor updateInteractiveTransition:progress];
}

- (void)setTransitioning:(NSInteger)transitioning
{
  if (_transitioning == transitioning) {
    return;
  }
  _transitioningStateChanged = YES;
  _transitioning = transitioning;
  [self markUpdated];
}

- (void)insertReactABI30_0_0Subview:(ABI30_0_0RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  subview.hidden = NO;
  subview.ReactABI30_0_0Superview = self;
  [_ReactABI30_0_0Subviews insertObject:subview atIndex:atIndex];
  [self markUpdated];
}

- (void)removeReactABI30_0_0Subview:(ABI30_0_0RNSScreenView *)subview
{
  // Right after the view gets removed properties such as transform will get reset. In addition to
  // that UINavigationController takes a snapshot of the view before it gets completely unmounted.
  // This causes an effect in which even so the view are detached from the hierarchy they could still
  // be visible for a frame. This is often undesirable e.g. in a case when we want to slide view
  // outside of the visible bounds, because as a result it will jump back to position 0,0 right before
  // the transition is over. To prevent that we hide the view right before removing it from the subviews
  // array.
  subview.hidden = YES;
  subview.ReactABI30_0_0Superview = nil;
  [_ReactABI30_0_0Subviews removeObject:subview];
  [self markUpdated];
}

- (NSArray<UIView *> *)ReactABI30_0_0Subviews
{
  return _ReactABI30_0_0Subviews;
}

- (void)didUpdateReactABI30_0_0Subviews
{
  // do nothing
}

- (void)updateContainer
{
  NSMutableArray<UIViewController *> *controllers = [NSMutableArray new];
  for (ABI30_0_0RNSScreenView *screen in _ReactABI30_0_0Subviews) {
    [controllers addObject:screen.controller];
  }
  if (_transitioningStateChanged) {
    if (_transitioning == 0) {
      // finish or cancel transitioning
      if ([_controller.viewControllers indexOfObject:controllers.lastObject] != NSNotFound) {
        [_interactor finishInteractiveTransition];
      } else {
        [_interactor cancelInteractiveTransition];
      }
      _interactor = nil;
    } else {
      _interactor = [UIPercentDrivenInteractiveTransition new];
      if (_transitioning < 0) {
        [_controller setViewControllers:controllers animated:NO];
        [_controller popViewControllerAnimated:YES];
      } else {
        UIViewController *lastController = [controllers lastObject];
        [controllers removeLastObject];
        [_controller setViewControllers:controllers animated:NO];
        [_controller pushViewController:lastController animated:YES];
      }
    }
    _transitioningStateChanged = NO;
  } else {
    [_controller setViewControllers:controllers animated:NO];
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self ReactABI30_0_0AddControllerToClosestParent:_controller];
  _controller.view.frame = self.bounds;
}

@end


@implementation ABI30_0_0RNSScreenStackManager

ABI30_0_0RCT_EXPORT_MODULE()

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(transitioning, NSInteger)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat)

- (UIView *)view
{
  return [[ABI30_0_0RNSScreenStackView alloc] initWithManager:self];
}

@end
