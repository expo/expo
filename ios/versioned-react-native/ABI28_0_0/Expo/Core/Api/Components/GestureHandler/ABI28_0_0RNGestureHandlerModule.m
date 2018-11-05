#import "ABI28_0_0RNGestureHandlerModule.h"

#import <ReactABI28_0_0/ABI28_0_0RCTLog.h>
#import <ReactABI28_0_0/ABI28_0_0RCTViewManager.h>
#import <ReactABI28_0_0/ABI28_0_0RCTComponent.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManagerUtils.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI28_0_0RNGestureHandlerState.h"
#import "ABI28_0_0RNGestureHandlerDirection.h"
#import "ABI28_0_0RNGestureHandler.h"
#import "ABI28_0_0RNGestureHandlerManager.h"

#import "ABI28_0_0RNGestureHandlerButton.h"

@interface ABI28_0_0RNGestureHandlerModule () <ABI28_0_0RCTUIManagerObserver>

@end

@interface ABI28_0_0RNGestureHandlerButtonManager : ABI28_0_0RCTViewManager
@end

@implementation ABI28_0_0RNGestureHandlerButtonManager

ABI28_0_0RCT_EXPORT_MODULE(ABI28_0_0RNGestureHandlerButton)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)

- (UIView *)view
{
    return [ABI28_0_0RNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(ABI28_0_0RNGestureHandlerManager *manager);

@implementation ABI28_0_0RNGestureHandlerModule
{
    ABI28_0_0RNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

ABI28_0_0RCT_EXPORT_MODULE()

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
    return ABI28_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI28_0_0RCTBridge *)bridge
{
    [super setBridge:bridge];

    _manager = [[ABI28_0_0RNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

ABI28_0_0RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI28_0_0RNGestureHandlerManager *manager) {
        [manager createGestureHandler:handlerName tag:handlerTag config:config];
    }];
}

ABI28_0_0RCT_EXPORT_METHOD(attachGestureHandler:(nonnull NSNumber *)handlerTag toViewWithTag:(nonnull NSNumber *)viewTag)
{
    [self addOperationBlock:^(ABI28_0_0RNGestureHandlerManager *manager) {
        [manager attachGestureHandler:handlerTag toViewWithTag:viewTag];
    }];
}

ABI28_0_0RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI28_0_0RNGestureHandlerManager *manager) {
        [manager updateGestureHandler:handlerTag config:config];
    }];
}

ABI28_0_0RCT_EXPORT_METHOD(dropGestureHandler:(nonnull NSNumber *)handlerTag)
{
    [self addOperationBlock:^(ABI28_0_0RNGestureHandlerManager *manager) {
        [manager dropGestureHandler:handlerTag];
    }];
}

ABI28_0_0RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(ABI28_0_0RNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

ABI28_0_0RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(ABI28_0_0RNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(GestureHandlerOperation)operation
{
    [_operations addObject:operation];
}

#pragma mark - ABI28_0_0RCTUIManagerObserver

- (void)uiManagerWillFlushUIBlocks:(ABI28_0_0RCTUIManager *)uiManager
{
  [self uiManagerWillPerformMounting:uiManager];
}

- (void)uiManagerWillPerformMounting:(ABI28_0_0RCTUIManager *)uiManager
{
    if (_operations.count == 0) {
        return;
    }

    NSArray<GestureHandlerOperation> *operations = _operations;
    _operations = [NSMutableArray new];

    [uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
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
                      @"UNDETERMINED": @(ABI28_0_0RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(ABI28_0_0RNGestureHandlerStateBegan),
                      @"ACTIVE": @(ABI28_0_0RNGestureHandlerStateActive),
                      @"CANCELLED": @(ABI28_0_0RNGestureHandlerStateCancelled),
                      @"FAILED": @(ABI28_0_0RNGestureHandlerStateFailed),
                      @"END": @(ABI28_0_0RNGestureHandlerStateEnd)
                      },
              @"Direction": @{
                      @"RIGHT": @(ABI28_0_0RNGestureHandlerDirectionRight),
                      @"LEFT": @(ABI28_0_0RNGestureHandlerDirectionLeft),
                      @"UP": @(ABI28_0_0RNGestureHandlerDirectionUp),
                      @"DOWN": @(ABI28_0_0RNGestureHandlerDirectionDown)
                      }
              };
}



@end
