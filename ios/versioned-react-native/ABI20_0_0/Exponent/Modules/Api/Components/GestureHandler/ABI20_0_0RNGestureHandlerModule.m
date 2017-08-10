#import "ABI20_0_0RNGestureHandlerModule.h"

#import <ReactABI20_0_0/ABI20_0_0RCTLog.h>
#import <ReactABI20_0_0/ABI20_0_0RCTViewManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTComponent.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUIManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI20_0_0RNGestureHandlerState.h"
#import "ABI20_0_0RNGestureHandler.h"
#import "ABI20_0_0RNGestureHandlerManager.h"

@interface ABI20_0_0RNGestureHandlerModule () <ABI20_0_0RCTUIManagerObserver>

@end


@interface ABI20_0_0RNDummyViewManager : ABI20_0_0RCTViewManager
@end

@implementation ABI20_0_0RNDummyViewManager

ABI20_0_0RCT_EXPORT_MODULE()

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onGestureHandlerEvent, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onGestureHandlerStateChange, ABI20_0_0RCTDirectEventBlock)

@end


@interface ABI20_0_0RNGestureHandlerButtonManager : ABI20_0_0RCTViewManager
@end

@implementation ABI20_0_0RNGestureHandlerButtonManager

ABI20_0_0RCT_EXPORT_MODULE(ABI20_0_0RNGestureHandlerButton)

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)

- (UIView *)view
{
    return [ABI20_0_0RNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(ABI20_0_0RNGestureHandlerManager *manager);

@implementation ABI20_0_0RNGestureHandlerModule
{
    ABI20_0_0RNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

ABI20_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
    // This module needs to be on the same queue as the UIManager to avoid
    // having to lock `_operations` and `_preOperations` since `uiManagerWillFlushUIBlocks`
    // will be called from that queue.

    // This is required as this module rely on having all the view nodes created before
    // gesture handlers can be associated with them
    return ABI20_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI20_0_0RCTBridge *)bridge
{
    [super setBridge:bridge];

    _manager = [[ABI20_0_0RNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

ABI20_0_0RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSNumber *)viewTag withName:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI20_0_0RNGestureHandlerManager *manager) {
        [manager createGestureHandler:viewTag withName:handlerName tag:handlerTag config:config];
    }];
}

ABI20_0_0RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)viewTag tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI20_0_0RNGestureHandlerManager *manager) {
        [manager updateGestureHandler:viewTag tag:handlerTag config:config];
    }];
}

ABI20_0_0RCT_EXPORT_METHOD(dropGestureHandlersForView:(nonnull NSNumber *)viewTag)
{
    [self addOperationBlock:^(ABI20_0_0RNGestureHandlerManager *manager) {
        [manager dropGestureHandlersForView:viewTag];
    }];
}

ABI20_0_0RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(ABI20_0_0RNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

ABI20_0_0RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(ABI20_0_0RNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(GestureHandlerOperation)operation
{
    [_operations addObject:operation];
}

#pragma mark - ABI20_0_0RCTUIManagerObserver

- (void)uiManagerWillFlushUIBlocks:(ABI20_0_0RCTUIManager *)uiManager
{
    if (_operations.count == 0) {
        return;
    }

    NSArray<GestureHandlerOperation> *operations = _operations;
    _operations = [NSMutableArray new];

    [uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
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
                      @"UNDETERMINED": @(ABI20_0_0RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(ABI20_0_0RNGestureHandlerStateBegan),
                      @"ACTIVE": @(ABI20_0_0RNGestureHandlerStateActive),
                      @"CANCELLED": @(ABI20_0_0RNGestureHandlerStateCancelled),
                      @"FAILED": @(ABI20_0_0RNGestureHandlerStateFailed),
                      @"END": @(ABI20_0_0RNGestureHandlerStateEnd)
                      }
              };
}



@end

