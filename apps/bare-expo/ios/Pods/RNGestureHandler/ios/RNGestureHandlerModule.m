#import "RNGestureHandlerModule.h"

#import <React/RCTLog.h>
#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTUIManagerObserverCoordinator.h>

#import "RNGestureHandlerState.h"
#import "RNGestureHandlerDirection.h"
#import "RNGestureHandler.h"
#import "RNGestureHandlerManager.h"

#import "RNGestureHandlerButton.h"

@interface RNGestureHandlerModule () <RCTUIManagerObserver>

@end

@interface RNGestureHandlerButtonManager : RCTViewManager
@end

@implementation RNGestureHandlerButtonManager

RCT_EXPORT_MODULE(RNGestureHandlerButton)

RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
#if !TARGET_OS_TV
RCT_CUSTOM_VIEW_PROPERTY(exclusive, BOOL, RNGestureHandlerButton)
{
  [view setExclusiveTouch: json == nil ? YES : [RCTConvert BOOL: json]];
}
#endif
RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, RNGestureHandlerButton)
{
  if (json) {
    UIEdgeInsets hitSlopInsets = [RCTConvert UIEdgeInsets:json];
    view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
  } else {
    view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
  }
}

- (UIView *)view
{
    return [RNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(RNGestureHandlerManager *manager);

@implementation RNGestureHandlerModule
{
    RNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

RCT_EXPORT_MODULE()

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
    return RCTGetUIManagerQueue();
}

- (void)setBridge:(RCTBridge *)bridge
{
    [super setBridge:bridge];

    _manager = [[RNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(RNGestureHandlerManager *manager) {
        [manager createGestureHandler:handlerName tag:handlerTag config:config];
    }];
}

RCT_EXPORT_METHOD(attachGestureHandler:(nonnull NSNumber *)handlerTag toViewWithTag:(nonnull NSNumber *)viewTag)
{
    [self addOperationBlock:^(RNGestureHandlerManager *manager) {
        [manager attachGestureHandler:handlerTag toViewWithTag:viewTag];
    }];
}

RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(RNGestureHandlerManager *manager) {
        [manager updateGestureHandler:handlerTag config:config];
    }];
}

RCT_EXPORT_METHOD(dropGestureHandler:(nonnull NSNumber *)handlerTag)
{
    [self addOperationBlock:^(RNGestureHandlerManager *manager) {
        [manager dropGestureHandler:handlerTag];
    }];
}

RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(RNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(RNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(GestureHandlerOperation)operation
{
    [_operations addObject:operation];
}

#pragma mark - RCTUIManagerObserver

- (void)uiManagerWillFlushUIBlocks:(RCTUIManager *)uiManager
{
  [self uiManagerWillPerformMounting:uiManager];
}

- (void)uiManagerWillPerformMounting:(RCTUIManager *)uiManager
{
    if (_operations.count == 0) {
        return;
    }

    NSArray<GestureHandlerOperation> *operations = _operations;
    _operations = [NSMutableArray new];

    [uiManager addUIBlock:^(__unused RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
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
                      @"UNDETERMINED": @(RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(RNGestureHandlerStateBegan),
                      @"ACTIVE": @(RNGestureHandlerStateActive),
                      @"CANCELLED": @(RNGestureHandlerStateCancelled),
                      @"FAILED": @(RNGestureHandlerStateFailed),
                      @"END": @(RNGestureHandlerStateEnd)
                      },
              @"Direction": @{
                      @"RIGHT": @(RNGestureHandlerDirectionRight),
                      @"LEFT": @(RNGestureHandlerDirectionLeft),
                      @"UP": @(RNGestureHandlerDirectionUp),
                      @"DOWN": @(RNGestureHandlerDirectionDown)
                      }
              };
}



@end
