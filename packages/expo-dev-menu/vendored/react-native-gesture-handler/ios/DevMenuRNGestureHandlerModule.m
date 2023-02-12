#import "DevMenuRNGestureHandlerModule.h"

#import <React/RCTLog.h>
#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTUIManagerObserverCoordinator.h>

#import "DevMenuRNGestureHandlerState.h"
#import "DevMenuRNGestureHandlerDirection.h"
#import "DevMenuRNGestureHandler.h"
#import "DevMenuRNGestureHandlerManager.h"

#import "DevMenuRNGestureHandlerButton.h"
#import "DevMenuRNGestureHandlerStateManager.h"

@interface DevMenuRNGestureHandlerModule () <RCTUIManagerObserver, DevMenuRNGestureHandlerStateManager>

@end



@implementation DevMenuRNGestureHandlerButtonManager

+ (NSString *)moduleName { return @"RNGestureHandlerButton"; }

RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
#if !TARGET_OS_TV
RCT_CUSTOM_VIEW_PROPERTY(exclusive, BOOL, DevMenuRNGestureHandlerButton)
{
  [view setExclusiveTouch: json == nil ? YES : [RCTConvert BOOL: json]];
}
#endif
RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, DevMenuRNGestureHandlerButton)
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
    return [DevMenuRNGestureHandlerButton new];
}

@end


typedef void (^GestureHandlerOperation)(DevMenuRNGestureHandlerManager *manager);

@implementation DevMenuRNGestureHandlerModule
{
    DevMenuRNGestureHandlerManager *_manager;

    // Oparations called after views have been updated.
    NSMutableArray<GestureHandlerOperation> *_operations;
}

+ (NSString *)moduleName { return @"RNGestureHandlerModule"; }

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

    _manager = [[DevMenuRNGestureHandlerManager alloc]
                initWithUIManager:bridge.uiManager
                eventDispatcher:bridge.eventDispatcher];
    _operations = [NSMutableArray new];
    [bridge.uiManager.observerCoordinator addObserver:self];
}

RCT_EXPORT_METHOD(createGestureHandler:(nonnull NSString *)handlerName tag:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(DevMenuRNGestureHandlerManager *manager) {
        [manager createGestureHandler:handlerName tag:handlerTag config:config];
    }];
}

RCT_EXPORT_METHOD(attachGestureHandler:(nonnull NSNumber *)handlerTag toViewWithTag:(nonnull NSNumber *)viewTag useDeviceEvents: (BOOL)useDeviceEvents)
{
    [self addOperationBlock:^(DevMenuRNGestureHandlerManager *manager) {
        if (useDeviceEvents) {
            [manager attachGestureHandlerForDeviceEvents:handlerTag toViewWithTag:viewTag];
        } else {
            [manager attachGestureHandler:handlerTag toViewWithTag:viewTag];
        }
    }];
}

RCT_EXPORT_METHOD(updateGestureHandler:(nonnull NSNumber *)handlerTag config:(NSDictionary *)config)
{
    [self addOperationBlock:^(DevMenuRNGestureHandlerManager *manager) {
        [manager updateGestureHandler:handlerTag config:config];
    }];
}

RCT_EXPORT_METHOD(dropGestureHandler:(nonnull NSNumber *)handlerTag)
{
    [self addOperationBlock:^(DevMenuRNGestureHandlerManager *manager) {
        [manager dropGestureHandler:handlerTag];
    }];
}

RCT_EXPORT_METHOD(handleSetJSResponder:(nonnull NSNumber *)viewTag blockNativeResponder:(nonnull NSNumber *)blockNativeResponder)
{
    [self addOperationBlock:^(DevMenuRNGestureHandlerManager *manager) {
        [manager handleSetJSResponder:viewTag blockNativeResponder:blockNativeResponder];
    }];
}

RCT_EXPORT_METHOD(handleClearJSResponder)
{
    [self addOperationBlock:^(DevMenuRNGestureHandlerManager *manager) {
        [manager handleClearJSResponder];
    }];
}

- (void)setGestureState:(int)state forHandler:(int)handlerTag
{
  DevMenuRNGestureHandler *handler = [_manager handlerWithTag:@(handlerTag)];

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
                      @"UNDETERMINED": @(DevMenuRNGestureHandlerStateUndetermined),
                      @"BEGAN": @(DevMenuRNGestureHandlerStateBegan),
                      @"ACTIVE": @(DevMenuRNGestureHandlerStateActive),
                      @"CANCELLED": @(DevMenuRNGestureHandlerStateCancelled),
                      @"FAILED": @(DevMenuRNGestureHandlerStateFailed),
                      @"END": @(DevMenuRNGestureHandlerStateEnd)
                      },
              @"Direction": @{
                      @"RIGHT": @(DevMenuRNGestureHandlerDirectionRight),
                      @"LEFT": @(DevMenuRNGestureHandlerDirectionLeft),
                      @"UP": @(DevMenuRNGestureHandlerDirectionUp),
                      @"DOWN": @(DevMenuRNGestureHandlerDirectionDown)
                      }
              };
}



@end
