#import <ABI47_0_0RNReanimated/ABI47_0_0REATransition.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REATransitionManager.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManagerObserverCoordinator.h>

@interface ABI47_0_0REATransitionManager () <ABI47_0_0RCTUIManagerObserver>
@end

@implementation ABI47_0_0REATransitionManager {
  ABI47_0_0REATransition *_pendingTransition;
  UIView *_pendingTransitionRoot;
  ABI47_0_0RCTUIManager *_uiManager;
}

- (instancetype)initWithUIManager:(id)uiManager
{
  if (self = [super init]) {
    _uiManager = uiManager;
  }
  return self;
}

- (void)beginTransition:(ABI47_0_0REATransition *)transition forView:(UIView *)view
{
  ABI47_0_0RCTAssertMainQueue();
  if (_pendingTransition != nil) {
    return;
  }
  _pendingTransition = transition;
  _pendingTransitionRoot = view;
  [transition startCaptureInRoot:view];
}

- (void)uiManagerWillPerformMounting:(ABI47_0_0RCTUIManager *)manager
{
  [manager addUIBlock:^(ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    [_pendingTransition playInRoot:_pendingTransitionRoot];
    _pendingTransitionRoot = nil;
    _pendingTransition = nil;
  }];
}

- (void)animateNextTransitionInRoot:(NSNumber *)ABI47_0_0ReactTag withConfig:(NSDictionary *)config
{
  [_uiManager.observerCoordinator addObserver:self];
  [_uiManager prependUIBlock:^(ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ABI47_0_0ReactTag];
    NSArray *transitionConfigs = [ABI47_0_0RCTConvert NSArray:config[@"transitions"]];
    for (id transitionConfig in transitionConfigs) {
      ABI47_0_0REATransition *transition = [ABI47_0_0REATransition inflate:transitionConfig];
      [self beginTransition:transition forView:view];
    }
  }];
  __weak id weakSelf = self;
  [_uiManager addUIBlock:^(ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    [uiManager.observerCoordinator removeObserver:weakSelf];
  }];
}

@end
