#import "ABI25_0_0RNGestureHandlerModule.h"

#import <ReactABI25_0_0/ABI25_0_0RCTLog.h>
#import <ReactABI25_0_0/ABI25_0_0RCTViewManager.h>
#import <ReactABI25_0_0/ABI25_0_0RCTComponent.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManager.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManagerUtils.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI25_0_0RNGestureHandlerState.h"
#import "ABI25_0_0RNGestureHandler.h"
#import "ABI25_0_0RNGestureHandlerManager.h"

#import "ABI25_0_0RNGestureHandlerButton.h"

@interface ABI25_0_0RNGestureHandlerModule () <ABI25_0_0RCTUIManagerObserver>

@end

@interface ABI25_0_0RNGestureHandlerButtonManager : ABI25_0_0RCTViewManager
@end

@implementation ABI25_0_0RNGestureHandlerButtonManager

ABI25_0_0RCT_EXPORT_MODULE(ABI25_0_0RNGestureHandlerButton)

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)

- (UIView *)view
{
    return [ABI25_0_0RNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(ABI25_0_0RNGestureHandlerManager *manager);

@implementation ABI25_0_0RNGestureHandlerModule
{
    ABI25_0_0RNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

ABI25_0_0RCT_EXPORT_MODULE()

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
    return ABI25_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI25_0_0RCTBridge *)bridge
{
    [super setBridge:bridge];

    _manager = [[ABI25_0_0RNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

ABI25_0_0RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI25_0_0RNGestureHandlerManager *manager) {
        [manager createGestureHandler:handlerName tag:handlerTag config:config];
    }];
}

ABI25_0_0RCT_EXPORT_METHOD(attachGestureHandler:(nonnull NSNumber *)handlerTag toViewWithTag:(nonnull NSNumber *)viewTag)
{
    [self addOperationBlock:^(ABI25_0_0RNGestureHandlerManager *manager) {
        [manager attachGestureHandler:handlerTag toViewWithTag:viewTag];
    }];
}

ABI25_0_0RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI25_0_0RNGestureHandlerManager *manager) {
        [manager updateGestureHandler:handlerTag config:config];
    }];
}

ABI25_0_0RCT_EXPORT_METHOD(dropGestureHandler:(nonnull NSNumber *)handlerTag)
{
    [self addOperationBlock:^(ABI25_0_0RNGestureHandlerManager *manager) {
        [manager dropGestureHandler:handlerTag];
    }];
}

ABI25_0_0RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(ABI25_0_0RNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

ABI25_0_0RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(ABI25_0_0RNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(GestureHandlerOperation)operation
{
    [_operations addObject:operation];
}

#pragma mark - ABI25_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(ABI25_0_0RCTUIManager *)uiManager
{
    if (_operations.count == 0) {
        return;
    }

    NSArray<GestureHandlerOperation> *operations = _operations;
    _operations = [NSMutableArray new];

    [uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
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
                      @"UNDETERMINED": @(ABI25_0_0RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(ABI25_0_0RNGestureHandlerStateBegan),
                      @"ACTIVE": @(ABI25_0_0RNGestureHandlerStateActive),
                      @"CANCELLED": @(ABI25_0_0RNGestureHandlerStateCancelled),
                      @"FAILED": @(ABI25_0_0RNGestureHandlerStateFailed),
                      @"END": @(ABI25_0_0RNGestureHandlerStateEnd)
                      }
              };
}



@end
