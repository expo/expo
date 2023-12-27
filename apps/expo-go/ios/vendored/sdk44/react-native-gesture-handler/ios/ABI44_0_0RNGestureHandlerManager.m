#import "ABI44_0_0RNGestureHandlerManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTLog.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>
#import <ABI44_0_0React/ABI44_0_0RCTComponent.h>
#import <ABI44_0_0React/ABI44_0_0RCTRootView.h>
#import <ABI44_0_0React/ABI44_0_0RCTTouchHandler.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>

#if __has_include(<ABI44_0_0React/ABI44_0_0RCTRootContentView.h>)
#import <ABI44_0_0React/ABI44_0_0RCTRootContentView.h>
#else
#import "ABI44_0_0RCTRootContentView.h"
#endif

#import "ABI44_0_0RNGestureHandlerState.h"
#import "ABI44_0_0RNGestureHandler.h"
#import "ABI44_0_0RNGestureHandlerRegistry.h"
#import "ABI44_0_0RNRootViewGestureRecognizer.h"

#import "Handlers/ABI44_0_0RNPanHandler.h"
#import "Handlers/ABI44_0_0RNTapHandler.h"
#import "Handlers/ABI44_0_0RNFlingHandler.h"
#import "Handlers/ABI44_0_0RNLongPressHandler.h"
#import "Handlers/ABI44_0_0RNNativeViewHandler.h"
#import "Handlers/ABI44_0_0RNPinchHandler.h"
#import "Handlers/ABI44_0_0RNRotationHandler.h"
#import "Handlers/ABI44_0_0RNForceTouchHandler.h"
#import "Handlers/ABI44_0_0RNManualHandler.h"

// We use the method below instead of ABI44_0_0RCTLog because we log out messages after the bridge gets
// turned down in some cases. Which normally with ABI44_0_0RCTLog would cause a crash in DEBUG mode
#define ABI44_0_0RCTLifecycleLog(...) ABI44_0_0RCTDefaultLogFunction(ABI44_0_0RCTLogLevelInfo, ABI44_0_0RCTLogSourceNative, @(__FILE__), @(__LINE__), [NSString stringWithFormat:__VA_ARGS__])

@interface ABI44_0_0RNGestureHandlerManager () <ABI44_0_0RNGestureHandlerEventEmitter, ABI44_0_0RNRootViewGestureRecognizerDelegate>

@end

@implementation ABI44_0_0RNGestureHandlerManager
{
    ABI44_0_0RNGestureHandlerRegistry *_registry;
    ABI44_0_0RCTUIManager *_uiManager;
    NSHashTable<ABI44_0_0RNRootViewGestureRecognizer *> *_rootViewGestureRecognizers;
    ABI44_0_0RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithUIManager:(ABI44_0_0RCTUIManager *)uiManager
                  eventDispatcher:(ABI44_0_0RCTEventDispatcher *)eventDispatcher
{
    if ((self = [super init])) {
        _uiManager = uiManager;
        _eventDispatcher = eventDispatcher;
        _registry = [ABI44_0_0RNGestureHandlerRegistry new];
        _rootViewGestureRecognizers = [NSHashTable hashTableWithOptions:NSPointerFunctionsWeakMemory];
    }
    return self;
}

- (void)createGestureHandler:(NSString *)handlerName
                         tag:(NSNumber *)handlerTag
                      config:(NSDictionary *)config
{
    static NSDictionary *map;
    static dispatch_once_t mapToken;
    dispatch_once(&mapToken, ^{
        map = @{
                @"PanGestureHandler" : [ABI44_0_0RNPanGestureHandler class],
                @"TapGestureHandler" : [ABI44_0_0RNTapGestureHandler class],
                @"FlingGestureHandler" : [ABI44_0_0RNFlingGestureHandler class],
                @"LongPressGestureHandler": [ABI44_0_0RNLongPressGestureHandler class],
                @"NativeViewGestureHandler": [ABI44_0_0RNNativeViewGestureHandler class],
                @"PinchGestureHandler": [ABI44_0_0RNPinchGestureHandler class],
                @"RotationGestureHandler": [ABI44_0_0RNRotationGestureHandler class],
                @"ForceTouchGestureHandler": [ABI44_0_0RNForceTouchHandler class],
                @"ManualGestureHandler": [ABI44_0_0RNManualGestureHandler class],
                };
    });
    
    Class nodeClass = map[handlerName];
    if (!nodeClass) {
        ABI44_0_0RCTLogError(@"Gesture handler type %@ is not supported", handlerName);
        return;
    }
    
    ABI44_0_0RNGestureHandler *gestureHandler = [[nodeClass alloc] initWithTag:handlerTag];
    [gestureHandler configure:config];
    [_registry registerGestureHandler:gestureHandler];
    
    __weak id<ABI44_0_0RNGestureHandlerEventEmitter> emitter = self;
    gestureHandler.emitter = emitter;
}


- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag
{
    UIView *view = [_uiManager viewForABI44_0_0ReactTag:viewTag];

    [_registry attachHandlerWithTag:handlerTag toView:view];

    // register view if not already there
    [self registerViewWithGestureRecognizerAttachedIfNeeded:view];
}

- (void)attachGestureHandlerForDeviceEvents:(nonnull NSNumber *)handlerTag
                              toViewWithTag:(nonnull NSNumber *)viewTag
{
    UIView *view = [_uiManager viewForABI44_0_0ReactTag:viewTag];

    [_registry attachHandlerWithTagForDeviceEvents:handlerTag toView:view];

    // register view if not already there
    [self registerViewWithGestureRecognizerAttachedIfNeeded:view];
}

- (void)updateGestureHandler:(NSNumber *)handlerTag config:(NSDictionary *)config
{
    ABI44_0_0RNGestureHandler *handler = [_registry handlerWithTag:handlerTag];
    [handler configure:config];
}

- (void)dropGestureHandler:(NSNumber *)handlerTag
{
    [_registry dropHandlerWithTag:handlerTag];
}

- (void)handleSetJSResponder:(NSNumber *)viewTag blockNativeResponder:(NSNumber *)blockNativeResponder
{
    if ([blockNativeResponder boolValue]) {
        for (ABI44_0_0RNRootViewGestureRecognizer *recognizer in _rootViewGestureRecognizers) {
            [recognizer blockOtherRecognizers];
        }
    }
}

- (void)handleClearJSResponder
{
    // ignore...
}

- (id)handlerWithTag:(NSNumber *)handlerTag
{
  return [_registry handlerWithTag:handlerTag];
}


#pragma mark Root Views Management

- (void)registerViewWithGestureRecognizerAttachedIfNeeded:(UIView *)childView
{
    UIView *parent = childView;
    while (parent != nil && ![parent respondsToSelector:@selector(touchHandler)]) parent = parent.superview;

    // Many views can return the same touchHandler so we check if the one we want to register
    // is not already present in the set.
    UIView *touchHandlerView = [[parent performSelector:@selector(touchHandler)] view];
  
    if (touchHandlerView == nil) {
      return;
    }
  
    for (UIGestureRecognizer *recognizer in touchHandlerView.gestureRecognizers) {
      if ([recognizer isKindOfClass:[ABI44_0_0RNRootViewGestureRecognizer class]]) {
        return;
      }
    }
  
    ABI44_0_0RCTLifecycleLog(@"[GESTURE HANDLER] Initialize gesture handler for view %@", touchHandlerView);
    ABI44_0_0RNRootViewGestureRecognizer *recognizer = [ABI44_0_0RNRootViewGestureRecognizer new];
    recognizer.delegate = self;
    touchHandlerView.userInteractionEnabled = YES;
    [touchHandlerView addGestureRecognizer:recognizer];
    [_rootViewGestureRecognizers addObject:recognizer];
}

- (void)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    didActivateInViewWithTouchHandler:(UIView *)viewWithTouchHandler
{
    // Cancel touches in RN's root view in order to cancel all in-js recognizers

    // As scroll events are special-cased in RN responder implementation and sending them would
    // trigger JS responder change, we don't cancel touches if the handler that got activated is
    // a scroll recognizer. This way root view will keep sending touchMove and touchEnd events
    // and therefore allow JS responder to properly release the responder at the end of the touch
    // stream.
    // NOTE: this is not a proper fix and solving this problem requires upstream fixes to RN. In
    // particular if we have one PanHandler and ScrollView that can work simultaniously then when
    // the Pan handler activates it would still tigger cancel events.
    // Once the upstream fix lands the line below along with this comment can be removed
    if ([gestureRecognizer.view isKindOfClass:[UIScrollView class]]) return;

    ABI44_0_0RCTTouchHandler *touchHandler = [viewWithTouchHandler performSelector:@selector(touchHandler)];
    [touchHandler cancel];
}

#pragma mark Events

- (void)sendTouchEvent:(ABI44_0_0RNGestureHandlerEvent *)event
{
    [_eventDispatcher sendEvent:event];
}

- (void)sendStateChangeEvent:(ABI44_0_0RNGestureHandlerStateChange *)event
{
    [_eventDispatcher sendEvent:event];
}

- (void)sendTouchDeviceEvent:(ABI44_0_0RNGestureHandlerEvent *)event
{
    NSMutableDictionary *body = [[event arguments] objectAtIndex:2];
    [_eventDispatcher sendDeviceEventWithName:@"onGestureHandlerEvent" body:body];
}

- (void)sendStateChangeDeviceEvent:(ABI44_0_0RNGestureHandlerStateChange *)event
{
    NSMutableDictionary *body = [[event arguments] objectAtIndex:2];
    [_eventDispatcher sendDeviceEventWithName:@"onGestureHandlerStateChange" body:body];
}

@end
