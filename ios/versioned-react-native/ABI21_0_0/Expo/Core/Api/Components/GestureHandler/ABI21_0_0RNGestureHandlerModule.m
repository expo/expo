#import "ABI21_0_0RNGestureHandlerModule.h"

#import <ReactABI21_0_0/ABI21_0_0RCTLog.h>
#import <ReactABI21_0_0/ABI21_0_0RCTViewManager.h>
#import <ReactABI21_0_0/ABI21_0_0RCTComponent.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUIManager.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI21_0_0RNGestureHandlerState.h"
#import "ABI21_0_0RNGestureHandler.h"
#import "ABI21_0_0RNGestureHandlerManager.h"

@interface ABI21_0_0RNGestureHandlerModule () <ABI21_0_0RCTUIManagerObserver>

@end


@interface ABI21_0_0RNDummyViewManager : ABI21_0_0RCTViewManager
@end

@implementation ABI21_0_0RNDummyViewManager

ABI21_0_0RCT_EXPORT_MODULE()

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onGestureHandlerEvent, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onGestureHandlerStateChange, ABI21_0_0RCTDirectEventBlock)

@end


@interface ABI21_0_0RNGestureHandlerButtonManager : ABI21_0_0RCTViewManager
@end

@implementation ABI21_0_0RNGestureHandlerButtonManager

ABI21_0_0RCT_EXPORT_MODULE(ABI21_0_0RNGestureHandlerButton)

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)

- (UIView *)view
{
    return [ABI21_0_0RNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(ABI21_0_0RNGestureHandlerManager *manager);

@implementation ABI21_0_0RNGestureHandlerModule
{
    ABI21_0_0RNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

ABI21_0_0RCT_EXPORT_MODULE()

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
    return ABI21_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI21_0_0RCTBridge *)bridge
{
    [super setBridge:bridge];

    _manager = [[ABI21_0_0RNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

ABI21_0_0RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI21_0_0RNGestureHandlerManager *manager) {
        [manager createGestureHandler:handlerName tag:handlerTag config:config];
    }];
}

ABI21_0_0RCT_EXPORT_METHOD(attachGestureHandler:(nonnull NSNumber *)handlerTag toViewWithTag:(nonnull NSNumber *)viewTag)
{
    [self addOperationBlock:^(ABI21_0_0RNGestureHandlerManager *manager) {
        [manager attachGestureHandler:handlerTag toViewWithTag:viewTag];
    }];
}

ABI21_0_0RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI21_0_0RNGestureHandlerManager *manager) {
        [manager updateGestureHandler:handlerTag config:config];
    }];
}

ABI21_0_0RCT_EXPORT_METHOD(dropGestureHandler:(nonnull NSNumber *)handlerTag)
{
    [self addOperationBlock:^(ABI21_0_0RNGestureHandlerManager *manager) {
        [manager dropGestureHandler:handlerTag];
    }];
}

ABI21_0_0RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(ABI21_0_0RNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

ABI21_0_0RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(ABI21_0_0RNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(GestureHandlerOperation)operation
{
    [_operations addObject:operation];
}

#pragma mark - ABI21_0_0RCTUIManagerObserver

- (void)uiManagerWillFlushUIBlocks:(ABI21_0_0RCTUIManager *)uiManager
{
    if (_operations.count == 0) {
        return;
    }

    NSArray<GestureHandlerOperation> *operations = _operations;
    _operations = [NSMutableArray new];

    [uiManager addUIBlock:^(__unused ABI21_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
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
                      @"UNDETERMINED": @(ABI21_0_0RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(ABI21_0_0RNGestureHandlerStateBegan),
                      @"ACTIVE": @(ABI21_0_0RNGestureHandlerStateActive),
                      @"CANCELLED": @(ABI21_0_0RNGestureHandlerStateCancelled),
                      @"FAILED": @(ABI21_0_0RNGestureHandlerStateFailed),
                      @"END": @(ABI21_0_0RNGestureHandlerStateEnd)
                      }
              };
}



@end

