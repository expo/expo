#import "ABI43_0_0REATransitionManager.h"

#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI43_0_0REATransition.h"

@interface ABI43_0_0REATransitionManager () <ABI43_0_0RCTUIManagerObserver>
@end

@implementation ABI43_0_0REATransitionManager {
  ABI43_0_0REATransition *_pendingTransition;
  UIView *_pendingTransitionRoot;
  ABI43_0_0RCTUIManager *_uiManager;
}

- (instancetype)initWithUIManager:(id)uiManager
{
  if (self = [super init]) {
    _uiManager = uiManager;
  }
  return self;
}

- (void)beginTransition:(ABI43_0_0REATransition *)transition forView:(UIView *)view
{
  ABI43_0_0RCTAssertMainQueue();
  if (_pendingTransition != nil) {
    return;
  }
  _pendingTransition = transition;
  _pendingTransitionRoot = view;
  [transition startCaptureInRoot:view];
}

- (void)uiManagerWillPerformMounting:(ABI43_0_0RCTUIManager *)manager
{
  [manager addUIBlock:^(ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    [_pendingTransition playInRoot:_pendingTransitionRoot];
    _pendingTransitionRoot = nil;
    _pendingTransition = nil;
  }];
}

- (void)animateNextTransitionInRoot:(NSNumber *)ABI43_0_0ReactTag withConfig:(NSDictionary *)config
{
  [_uiManager.observerCoordinator addObserver:self];
  [_uiManager prependUIBlock:^(ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ABI43_0_0ReactTag];
    NSArray *transitionConfigs = [ABI43_0_0RCTConvert NSArray:config[@"transitions"]];
    for (id transitionConfig in transitionConfigs) {
      ABI43_0_0REATransition *transition = [ABI43_0_0REATransition inflate:transitionConfig];
      [self beginTransition:transition forView:view];
    }
  }];
  __weak id weakSelf = self;
  [_uiManager addUIBlock:^(ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    [uiManager.observerCoordinator removeObserver:weakSelf];
  }];
}

@end
