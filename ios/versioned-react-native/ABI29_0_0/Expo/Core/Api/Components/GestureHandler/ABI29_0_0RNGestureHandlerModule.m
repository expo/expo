#import "ABI29_0_0RNGestureHandlerModule.h"

#import <ReactABI29_0_0/ABI29_0_0RCTLog.h>
#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>
#import <ReactABI29_0_0/ABI29_0_0RCTComponent.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManager.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManagerUtils.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI29_0_0RNGestureHandlerState.h"
#import "ABI29_0_0RNGestureHandlerDirection.h"
#import "ABI29_0_0RNGestureHandler.h"
#import "ABI29_0_0RNGestureHandlerManager.h"

#import "ABI29_0_0RNGestureHandlerButton.h"

@interface ABI29_0_0RNGestureHandlerModule () <ABI29_0_0RCTUIManagerObserver>

@end

@interface ABI29_0_0RNGestureHandlerButtonManager : ABI29_0_0RCTViewManager
@end

@implementation ABI29_0_0RNGestureHandlerButtonManager

ABI29_0_0RCT_EXPORT_MODULE(ABI29_0_0RNGestureHandlerButton)

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)

- (UIView *)view
{
    return [ABI29_0_0RNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(ABI29_0_0RNGestureHandlerManager *manager);

@implementation ABI29_0_0RNGestureHandlerModule
{
    ABI29_0_0RNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

ABI29_0_0RCT_EXPORT_MODULE()

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
    return ABI29_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI29_0_0RCTBridge *)bridge
{
    [super setBridge:bridge];

    _manager = [[ABI29_0_0RNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

ABI29_0_0RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI29_0_0RNGestureHandlerManager *manager) {
        [manager createGestureHandler:handlerName tag:handlerTag config:config];
    }];
}

ABI29_0_0RCT_EXPORT_METHOD(attachGestureHandler:(nonnull NSNumber *)handlerTag toViewWithTag:(nonnull NSNumber *)viewTag)
{
    [self addOperationBlock:^(ABI29_0_0RNGestureHandlerManager *manager) {
        [manager attachGestureHandler:handlerTag toViewWithTag:viewTag];
    }];
}

ABI29_0_0RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI29_0_0RNGestureHandlerManager *manager) {
        [manager updateGestureHandler:handlerTag config:config];
    }];
}

ABI29_0_0RCT_EXPORT_METHOD(dropGestureHandler:(nonnull NSNumber *)handlerTag)
{
    [self addOperationBlock:^(ABI29_0_0RNGestureHandlerManager *manager) {
        [manager dropGestureHandler:handlerTag];
    }];
}

ABI29_0_0RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(ABI29_0_0RNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

ABI29_0_0RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(ABI29_0_0RNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(GestureHandlerOperation)operation
{
    [_operations addObject:operation];
}

#pragma mark - ABI29_0_0RCTUIManagerObserver

- (void)uiManagerWillFlushUIBlocks:(ABI29_0_0RCTUIManager *)uiManager
{
  [self uiManagerWillPerformMounting:uiManager];
}

- (void)uiManagerWillPerformMounting:(ABI29_0_0RCTUIManager *)uiManager
{
    if (_operations.count == 0) {
        return;
    }

    NSArray<GestureHandlerOperation> *operations = _operations;
    _operations = [NSMutableArray new];

    [uiManager addUIBlock:^(__unused ABI29_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
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
                      @"UNDETERMINED": @(ABI29_0_0RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(ABI29_0_0RNGestureHandlerStateBegan),
                      @"ACTIVE": @(ABI29_0_0RNGestureHandlerStateActive),
                      @"CANCELLED": @(ABI29_0_0RNGestureHandlerStateCancelled),
                      @"FAILED": @(ABI29_0_0RNGestureHandlerStateFailed),
                      @"END": @(ABI29_0_0RNGestureHandlerStateEnd)
                      },
              @"Direction": @{
                      @"RIGHT": @(ABI29_0_0RNGestureHandlerDirectionRight),
                      @"LEFT": @(ABI29_0_0RNGestureHandlerDirectionLeft),
                      @"UP": @(ABI29_0_0RNGestureHandlerDirectionUp),
                      @"DOWN": @(ABI29_0_0RNGestureHandlerDirectionDown)
                      }
              };
}



@end
