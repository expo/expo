#import "ABI42_0_0RNGestureHandlerModule.h"

#import <ABI42_0_0React/ABI42_0_0RCTLog.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTComponent.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManagerUtils.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI42_0_0RNGestureHandlerState.h"
#import "ABI42_0_0RNGestureHandlerDirection.h"
#import "ABI42_0_0RNGestureHandler.h"
#import "ABI42_0_0RNGestureHandlerManager.h"

#import "ABI42_0_0RNGestureHandlerButton.h"

@interface ABI42_0_0RNGestureHandlerModule () <ABI42_0_0RCTUIManagerObserver>

@end

@interface ABI42_0_0RNGestureHandlerButtonManager : ABI42_0_0RCTViewManager
@end

@implementation ABI42_0_0RNGestureHandlerButtonManager

ABI42_0_0RCT_EXPORT_MODULE(ABI42_0_0RNGestureHandlerButton)

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
#if !TARGET_OS_TV
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(exclusive, BOOL, ABI42_0_0RNGestureHandlerButton)
{
  [view setExclusiveTouch: json == nil ? YES : [ABI42_0_0RCTConvert BOOL: json]];
}
#endif
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI42_0_0RNGestureHandlerButton)
{
  if (json) {
    UIEdgeInsets hitSlopInsets = [ABI42_0_0RCTConvert UIEdgeInsets:json];
    view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
  } else {
    view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
  }
}

- (UIView *)view
{
    return [ABI42_0_0RNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(ABI42_0_0RNGestureHandlerManager *manager);

@implementation ABI42_0_0RNGestureHandlerModule
{
    ABI42_0_0RNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

ABI42_0_0RCT_EXPORT_MODULE()

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
    return ABI42_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI42_0_0RCTBridge *)bridge
{
    [super setBridge:bridge];

    _manager = [[ABI42_0_0RNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

ABI42_0_0RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI42_0_0RNGestureHandlerManager *manager) {
        [manager createGestureHandler:handlerName tag:handlerTag config:config];
    }];
}

ABI42_0_0RCT_EXPORT_METHOD(attachGestureHandler:(nonnull NSNumber *)handlerTag toViewWithTag:(nonnull NSNumber *)viewTag)
{
    [self addOperationBlock:^(ABI42_0_0RNGestureHandlerManager *manager) {
        [manager attachGestureHandler:handlerTag toViewWithTag:viewTag];
    }];
}

ABI42_0_0RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI42_0_0RNGestureHandlerManager *manager) {
        [manager updateGestureHandler:handlerTag config:config];
    }];
}

ABI42_0_0RCT_EXPORT_METHOD(dropGestureHandler:(nonnull NSNumber *)handlerTag)
{
    [self addOperationBlock:^(ABI42_0_0RNGestureHandlerManager *manager) {
        [manager dropGestureHandler:handlerTag];
    }];
}

ABI42_0_0RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(ABI42_0_0RNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

ABI42_0_0RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(ABI42_0_0RNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(GestureHandlerOperation)operation
{
    [_operations addObject:operation];
}

#pragma mark - ABI42_0_0RCTUIManagerObserver

- (void)uiManagerWillFlushUIBlocks:(ABI42_0_0RCTUIManager *)uiManager
{
  [self uiManagerWillPerformMounting:uiManager];
}

- (void)uiManagerWillPerformMounting:(ABI42_0_0RCTUIManager *)uiManager
{
    if (_operations.count == 0) {
        return;
    }

    NSArray<GestureHandlerOperation> *operations = _operations;
    _operations = [NSMutableArray new];

    [uiManager addUIBlock:^(__unused ABI42_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
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
                      @"UNDETERMINED": @(ABI42_0_0RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(ABI42_0_0RNGestureHandlerStateBegan),
                      @"ACTIVE": @(ABI42_0_0RNGestureHandlerStateActive),
                      @"CANCELLED": @(ABI42_0_0RNGestureHandlerStateCancelled),
                      @"FAILED": @(ABI42_0_0RNGestureHandlerStateFailed),
                      @"END": @(ABI42_0_0RNGestureHandlerStateEnd)
                      },
              @"Direction": @{
                      @"RIGHT": @(ABI42_0_0RNGestureHandlerDirectionRight),
                      @"LEFT": @(ABI42_0_0RNGestureHandlerDirectionLeft),
                      @"UP": @(ABI42_0_0RNGestureHandlerDirectionUp),
                      @"DOWN": @(ABI42_0_0RNGestureHandlerDirectionDown)
                      }
              };
}



@end
