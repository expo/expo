#import "ABI33_0_0REATransitionManager.h"

#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI33_0_0REATransition.h"

@interface ABI33_0_0REATransitionManager () <ABI33_0_0RCTUIManagerObserver>
@end

@implementation ABI33_0_0REATransitionManager {
  ABI33_0_0REATransition *_pendingTransition;
  UIView *_pendingTransitionRoot;
  ABI33_0_0RCTUIManager *_uiManager;
}

- (instancetype)initWithUIManager:(id)uiManager
{
  if (self = [super init]) {
    _uiManager = uiManager;
  }
  return self;
}

- (void)beginTransition:(ABI33_0_0REATransition *)transition forView:(UIView *)view
{
  ABI33_0_0RCTAssertMainQueue();
  if (_pendingTransition != nil) {
    return;
  }
  _pendingTransition = transition;
  _pendingTransitionRoot = view;
  [transition startCaptureInRoot:view];
}

- (void)uiManagerWillPerformMounting:(ABI33_0_0RCTUIManager *)manager
{
  [manager addUIBlock:^(ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    [_pendingTransition playInRoot:_pendingTransitionRoot];
    _pendingTransitionRoot = nil;
    _pendingTransition = nil;
  }];
}

- (void)animateNextTransitionInRoot:(NSNumber *)ReactABI33_0_0Tag withConfig:(NSDictionary *)config
{
  [_uiManager.observerCoordinator addObserver:self];
  [_uiManager prependUIBlock:^(ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI33_0_0Tag];
    NSArray *transitionConfigs = [ABI33_0_0RCTConvert NSArray:config[@"transitions"]];
    for (id transitionConfig in transitionConfigs) {
      ABI33_0_0REATransition *transition = [ABI33_0_0REATransition inflate:transitionConfig];
      [self beginTransition:transition forView:view];
    }
  }];
  __weak id weakSelf = self;
  [_uiManager addUIBlock:^(ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    [uiManager.observerCoordinator removeObserver:weakSelf];
  }];
}

@end
