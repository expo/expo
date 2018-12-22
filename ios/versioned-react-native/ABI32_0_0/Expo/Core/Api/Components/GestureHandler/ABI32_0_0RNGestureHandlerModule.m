#import "ABI32_0_0RNGestureHandlerModule.h"

#import <ReactABI32_0_0/ABI32_0_0RCTLog.h>
#import <ReactABI32_0_0/ABI32_0_0RCTViewManager.h>
#import <ReactABI32_0_0/ABI32_0_0RCTComponent.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManager.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManagerUtils.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI32_0_0RNGestureHandlerState.h"
#import "ABI32_0_0RNGestureHandlerDirection.h"
#import "ABI32_0_0RNGestureHandler.h"
#import "ABI32_0_0RNGestureHandlerManager.h"

#import "ABI32_0_0RNGestureHandlerButton.h"

@interface ABI32_0_0RNGestureHandlerModule () <ABI32_0_0RCTUIManagerObserver>

@end

@interface ABI32_0_0RNGestureHandlerButtonManager : ABI32_0_0RCTViewManager
@end

@implementation ABI32_0_0RNGestureHandlerButtonManager

ABI32_0_0RCT_EXPORT_MODULE(ABI32_0_0RNGestureHandlerButton)

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI32_0_0RNGestureHandlerButton)
{
  if (json) {
    UIEdgeInsets hitSlopInsets = [ABI32_0_0RCTConvert UIEdgeInsets:json];
    view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
  } else {
    view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
  }
}

- (UIView *)view
{
    return [ABI32_0_0RNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(ABI32_0_0RNGestureHandlerManager *manager);

@implementation ABI32_0_0RNGestureHandlerModule
{
    ABI32_0_0RNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

ABI32_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (void)invalidate
{
    _manager = nil;
    [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
    // This module needs to be on the same queue as the UIManager to avoid
    // having to lock `_operations` and `_preOperations` since `uiManagerWillFlushUIBlocks`
    // will be called from that queue.

    // This is required as this module rely on having all the view nodes created before
    // gesture handlers can be associated with them
    return ABI32_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI32_0_0RCTBridge *)bridge
{
    [super setBridge:bridge];

    _manager = [[ABI32_0_0RNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

ABI32_0_0RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI32_0_0RNGestureHandlerManager *manager) {
        [manager createGestureHandler:handlerName tag:handlerTag config:config];
    }];
}

ABI32_0_0RCT_EXPORT_METHOD(attachGestureHandler:(nonnull NSNumber *)handlerTag toViewWithTag:(nonnull NSNumber *)viewTag)
{
    [self addOperationBlock:^(ABI32_0_0RNGestureHandlerManager *manager) {
        [manager attachGestureHandler:handlerTag toViewWithTag:viewTag];
    }];
}

ABI32_0_0RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI32_0_0RNGestureHandlerManager *manager) {
        [manager updateGestureHandler:handlerTag config:config];
    }];
}

ABI32_0_0RCT_EXPORT_METHOD(dropGestureHandler:(nonnull NSNumber *)handlerTag)
{
    [self addOperationBlock:^(ABI32_0_0RNGestureHandlerManager *manager) {
        [manager dropGestureHandler:handlerTag];
    }];
}

ABI32_0_0RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(ABI32_0_0RNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

ABI32_0_0RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(ABI32_0_0RNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(GestureHandlerOperation)operation
{
    [_operations addObject:operation];
}

#pragma mark - ABI32_0_0RCTUIManagerObserver

- (void)uiManagerWillFlushUIBlocks:(ABI32_0_0RCTUIManager *)uiManager
{
  [self uiManagerWillPerformMounting:uiManager];
}

- (void)uiManagerWillPerformMounting:(ABI32_0_0RCTUIManager *)uiManager
{
    if (_operations.count == 0) {
        return;
    }

    NSArray<GestureHandlerOperation> *operations = _operations;
    _operations = [NSMutableArray new];

    [uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        for (GestureHandlerOperation operation in operations) {
            operation(self->_manager);
        }
    }];
}

#pragma mark Events

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onGestureHandlerEvent", @"onGestureHandlerStateChange"];
}

#pragma mark Module Constants

- (NSDictionary *)constantsToExport
{
    return @{ @"State": @{
                      @"UNDETERMINED": @(ABI32_0_0RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(ABI32_0_0RNGestureHandlerStateBegan),
                      @"ACTIVE": @(ABI32_0_0RNGestureHandlerStateActive),
                      @"CANCELLED": @(ABI32_0_0RNGestureHandlerStateCancelled),
                      @"FAILED": @(ABI32_0_0RNGestureHandlerStateFailed),
                      @"END": @(ABI32_0_0RNGestureHandlerStateEnd)
                      },
              @"Direction": @{
                      @"RIGHT": @(ABI32_0_0RNGestureHandlerDirectionRight),
                      @"LEFT": @(ABI32_0_0RNGestureHandlerDirectionLeft),
                      @"UP": @(ABI32_0_0RNGestureHandlerDirectionUp),
                      @"DOWN": @(ABI32_0_0RNGestureHandlerDirectionDown)
                      }
              };
}



@end
