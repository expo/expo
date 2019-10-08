#import "ABI35_0_0REATransitionManager.h"

#import <ReactABI35_0_0/ABI35_0_0RCTUIManager.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI35_0_0REATransition.h"

@interface ABI35_0_0REATransitionManager () <ABI35_0_0RCTUIManagerObserver>
@end

@implementation ABI35_0_0REATransitionManager {
  ABI35_0_0REATransition *_pendingTransition;
  UIView *_pendingTransitionRoot;
  ABI35_0_0RCTUIManager *_uiManager;
}

- (instancetype)initWithUIManager:(id)uiManager
{
  if (self = [super init]) {
    _uiManager = uiManager;
  }
  return self;
}

- (void)beginTransition:(ABI35_0_0REATransition *)transition forView:(UIView *)view
{
  ABI35_0_0RCTAssertMainQueue();
  if (_pendingTransition != nil) {
    return;
  }
  _pendingTransition = transition;
  _pendingTransitionRoot = view;
  [transition startCaptureInRoot:view];
}

- (void)uiManagerWillPerformMounting:(ABI35_0_0RCTUIManager *)manager
{
  [manager addUIBlock:^(ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    [_pendingTransition playInRoot:_pendingTransitionRoot];
    _pendingTransitionRoot = nil;
    _pendingTransition = nil;
  }];
}

- (void)animateNextTransitionInRoot:(NSNumber *)ReactABI35_0_0Tag withConfig:(NSDictionary *)config
{
  [_uiManager.observerCoordinator addObserver:self];
  [_uiManager prependUIBlock:^(ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI35_0_0Tag];
    NSArray *transitionConfigs = [ABI35_0_0RCTConvert NSArray:config[@"transitions"]];
    for (id transitionConfig in transitionConfigs) {
      ABI35_0_0REATransition *transition = [ABI35_0_0REATransition inflate:transitionConfig];
      [self beginTransition:transition forView:view];
    }
  }];
  __weak id weakSelf = self;
  [_uiManager addUIBlock:^(ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    [uiManager.observerCoordinator removeObserver:weakSelf];
  }];
}

@end
