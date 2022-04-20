#import "ABI45_0_0RNGestureHandlerModule.h"

#import <ABI45_0_0React/ABI45_0_0RCTLog.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>
#import <ABI45_0_0React/ABI45_0_0RCTComponent.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManagerUtils.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI45_0_0RNGestureHandlerState.h"
#import "ABI45_0_0RNGestureHandlerDirection.h"
#import "ABI45_0_0RNGestureHandler.h"
#import "ABI45_0_0RNGestureHandlerManager.h"

#import "ABI45_0_0RNGestureHandlerButton.h"
#import "ABI45_0_0RNGestureHandlerStateManager.h"

@interface ABI45_0_0RNGestureHandlerModule () <ABI45_0_0RCTUIManagerObserver, ABI45_0_0RNGestureHandlerStateManager>

@end

@interface ABI45_0_0RNGestureHandlerButtonManager : ABI45_0_0RCTViewManager
@end

@implementation ABI45_0_0RNGestureHandlerButtonManager

ABI45_0_0RCT_EXPORT_MODULE(ABI45_0_0RNGestureHandlerButton)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
#if !TARGET_OS_TV
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(exclusive, BOOL, ABI45_0_0RNGestureHandlerButton)
{
  [view setExclusiveTouch: json == nil ? YES : [ABI45_0_0RCTConvert BOOL: json]];
}
#endif
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI45_0_0RNGestureHandlerButton)
{
  if (json) {
    UIEdgeInsets hitSlopInsets = [ABI45_0_0RCTConvert UIEdgeInsets:json];
    view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
  } else {
    view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
  }
}

- (UIView *)view
{
    return [ABI45_0_0RNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(ABI45_0_0RNGestureHandlerManager *manager);

@implementation ABI45_0_0RNGestureHandlerModule
{
    ABI45_0_0RNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

ABI45_0_0RCT_EXPORT_MODULE()

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
    return ABI45_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI45_0_0RCTBridge *)bridge
{
    [super setBridge:bridge];

    _manager = [[ABI45_0_0RNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

ABI45_0_0RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI45_0_0RNGestureHandlerManager *manager) {
        [manager createGestureHandler:handlerName tag:handlerTag config:config];
    }];
}

ABI45_0_0RCT_EXPORT_METHOD(attachGestureHandler:(nonnull NSNumber *)handlerTag toViewWithTag:(nonnull NSNumber *)viewTag useDeviceEvents: (BOOL)useDeviceEvents)
{
    [self addOperationBlock:^(ABI45_0_0RNGestureHandlerManager *manager) {
        if (useDeviceEvents) {
            [manager attachGestureHandlerForDeviceEvents:handlerTag toViewWithTag:viewTag];
        } else {
            [manager attachGestureHandler:handlerTag toViewWithTag:viewTag];
        }
    }];
}

ABI45_0_0RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(ABI45_0_0RNGestureHandlerManager *manager) {
        [manager updateGestureHandler:handlerTag config:config];
    }];
}

ABI45_0_0RCT_EXPORT_METHOD(dropGestureHandler:(nonnull NSNumber *)handlerTag)
{
    [self addOperationBlock:^(ABI45_0_0RNGestureHandlerManager *manager) {
        [manager dropGestureHandler:handlerTag];
    }];
}

ABI45_0_0RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(ABI45_0_0RNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

ABI45_0_0RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(ABI45_0_0RNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

- (void)setGestureState:(int)state forHandler:(int)handlerTag
{
  ABI45_0_0RNGestureHandler *handler = [_manager handlerWithTag:@(handlerTag)];

  if (handler != nil) {
    if (state == 1) { // FAILED
      handler.recognizer.state = UIGestureRecognizerStateFailed;
    } else if (state == 2) { // BEGAN
      handler.recognizer.state = UIGestureRecognizerStatePossible;
    } else if (state == 3) { // CANCELLED
      handler.recognizer.state = UIGestureRecognizerStateCancelled;
    } else if (state == 4) { // ACTIVE
      [handler stopActivationBlocker];
      handler.recognizer.state = UIGestureRecognizerStateBegan;
    } else if (state == 5) { // ENDED
      handler.recognizer.state = UIGestureRecognizerStateEnded;
    }
  }
  
  // if the gesture was set to finish, cancel all pointers it was tracking
  if (state == 1 || state == 3 || state == 5) {
    [handler.pointerTracker cancelPointers];
  }
  
  // do not send state change event when activating because it bypasses
  // shouldRequireFailureOfGestureRecognizer
  if (state != 4) {
    [handler handleGesture:handler.recognizer];
  }
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(GestureHandlerOperation)operation
{
    [_operations addObject:operation];
}

#pragma mark - ABI45_0_0RCTUIManagerObserver

- (void)uiManagerWillFlushUIBlocks:(ABI45_0_0RCTUIManager *)uiManager
{
  [self uiManagerWillPerformMounting:uiManager];
}

- (void)uiManagerWillPerformMounting:(ABI45_0_0RCTUIManager *)uiManager
{
    if (_operations.count == 0) {
        return;
    }

    NSArray<GestureHandlerOperation> *operations = _operations;
    _operations = [NSMutableArray new];

    [uiManager addUIBlock:^(__unused ABI45_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
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
                      @"UNDETERMINED": @(ABI45_0_0RNGestureHandlerStateUndetermined),
                      @"BEGAN": @(ABI45_0_0RNGestureHandlerStateBegan),
                      @"ACTIVE": @(ABI45_0_0RNGestureHandlerStateActive),
                      @"CANCELLED": @(ABI45_0_0RNGestureHandlerStateCancelled),
                      @"FAILED": @(ABI45_0_0RNGestureHandlerStateFailed),
                      @"END": @(ABI45_0_0RNGestureHandlerStateEnd)
                      },
              @"Direction": @{
                      @"RIGHT": @(ABI45_0_0RNGestureHandlerDirectionRight),
                      @"LEFT": @(ABI45_0_0RNGestureHandlerDirectionLeft),
                      @"UP": @(ABI45_0_0RNGestureHandlerDirectionUp),
                      @"DOWN": @(ABI45_0_0RNGestureHandlerDirectionDown)
                      }
              };
}



@end
