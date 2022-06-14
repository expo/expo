#import "DevMenuRNGestureHandlerManager.h"

#import <React/RCTLog.h>
#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>
#import <React/RCTRootView.h>
#import <React/RCTTouchHandler.h>
#import <React/RCTUIManager.h>
#import <React/RCTEventDispatcher.h>

#if __has_include(<React/RCTRootContentView.h>)
#import <React/RCTRootContentView.h>
#else
#import "RCTRootContentView.h"
#endif

#import "DevMenuRNGestureHandlerState.h"
#import "DevMenuRNGestureHandler.h"
#import "DevMenuRNGestureHandlerRegistry.h"
#import "DevMenuRNRootViewGestureRecognizer.h"

#import "Handlers/DevMenuRNPanHandler.h"
#import "Handlers/DevMenuRNTapHandler.h"
#import "Handlers/DevMenuRNFlingHandler.h"
#import "Handlers/DevMenuRNLongPressHandler.h"
#import "Handlers/DevMenuRNNativeViewHandler.h"
#import "Handlers/DevMenuRNPinchHandler.h"
#import "Handlers/DevMenuRNRotationHandler.h"
#import "Handlers/DevMenuRNForceTouchHandler.h"
#import "Handlers/DevMenuRNManualHandler.h"

// We use the method below instead of RCTLog because we log out messages after the bridge gets
// turned down in some cases. Which normally with RCTLog would cause a crash in DEBUG mode
#define RCTLifecycleLog(...) RCTDefaultLogFunction(RCTLogLevelInfo, RCTLogSourceNative, @(__FILE__), @(__LINE__), [NSString stringWithFormat:__VA_ARGS__])

@interface DevMenuRNGestureHandlerManager () <DevMenuRNGestureHandlerEventEmitter, DevMenuRNRootViewGestureRecognizerDelegate>

@end

@implementation DevMenuRNGestureHandlerManager
{
    DevMenuRNGestureHandlerRegistry *_registry;
    RCTUIManager *_uiManager;
    NSHashTable<DevMenuRNRootViewGestureRecognizer *> *_rootViewGestureRecognizers;
    RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager
                  eventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
    if ((self = [super init])) {
        _uiManager = uiManager;
        _eventDispatcher = eventDispatcher;
        _registry = [DevMenuRNGestureHandlerRegistry new];
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
                @"PanGestureHandler" : [DevMenuRNPanGestureHandler class],
                @"TapGestureHandler" : [DevMenuRNTapGestureHandler class],
                @"FlingGestureHandler" : [DevMenuRNFlingGestureHandler class],
                @"LongPressGestureHandler": [DevMenuRNLongPressGestureHandler class],
                @"NativeViewGestureHandler": [DevMenuRNNativeViewGestureHandler class],
                @"PinchGestureHandler": [DevMenuRNPinchGestureHandler class],
                @"RotationGestureHandler": [DevMenuRNRotationGestureHandler class],
                @"ForceTouchGestureHandler": [DevMenuRNForceTouchHandler class],
                @"ManualGestureHandler": [DevMenuRNManualGestureHandler class],
                };
    });
    
    Class nodeClass = map[handlerName];
    if (!nodeClass) {
        RCTLogError(@"Gesture handler type %@ is not supported", handlerName);
        return;
    }
    
    DevMenuRNGestureHandler *gestureHandler = [[nodeClass alloc] initWithTag:handlerTag];
    [gestureHandler configure:config];
    [_registry registerGestureHandler:gestureHandler];
    
    __weak id<DevMenuRNGestureHandlerEventEmitter> emitter = self;
    gestureHandler.emitter = emitter;
}


- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag
{
    UIView *view = [_uiManager viewForReactTag:viewTag];

    [_registry attachHandlerWithTag:handlerTag toView:view];

    // register view if not already there
    [self registerViewWithGestureRecognizerAttachedIfNeeded:view];
}

- (void)attachGestureHandlerForDeviceEvents:(nonnull NSNumber *)handlerTag
                              toViewWithTag:(nonnull NSNumber *)viewTag
{
    UIView *view = [_uiManager viewForReactTag:viewTag];

    [_registry attachHandlerWithTagForDeviceEvents:handlerTag toView:view];

    // register view if not already there
    [self registerViewWithGestureRecognizerAttachedIfNeeded:view];
}

- (void)updateGestureHandler:(NSNumber *)handlerTag config:(NSDictionary *)config
{
    DevMenuRNGestureHandler *handler = [_registry handlerWithTag:handlerTag];
    [handler configure:config];
}

- (void)dropGestureHandler:(NSNumber *)handlerTag
{
    [_registry dropHandlerWithTag:handlerTag];
}

- (void)handleSetJSResponder:(NSNumber *)viewTag blockNativeResponder:(NSNumber *)blockNativeResponder
{
    if ([blockNativeResponder boolValue]) {
        for (DevMenuRNRootViewGestureRecognizer *recognizer in _rootViewGestureRecognizers) {
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
      if ([recognizer isKindOfClass:[DevMenuRNRootViewGestureRecognizer class]]) {
        return;
      }
    }
  
    RCTLifecycleLog(@"[GESTURE HANDLER] Initialize gesture handler for view %@", touchHandlerView);
    DevMenuRNRootViewGestureRecognizer *recognizer = [DevMenuRNRootViewGestureRecognizer new];
    recognizer.delegate = self;
    touchHandlerView.userInteractionEnabled = YES;
    [touchHandlerView addGestureRecognizer:recognizer];
    [_rootViewGestureRecognizers addObject:recognizer];
}

- (void)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    didActivateInViewWithTouchHandler:(UIView *)viewWithTouchHandler
{
    // Cancel touches in DevMenuRN's root view in order to cancel all in-js recognizers

    // As scroll events are special-cased in DevMenuRN responder implementation and sending them would
    // trigger JS responder change, we don't cancel touches if the handler that got activated is
    // a scroll recognizer. This way root view will keep sending touchMove and touchEnd events
    // and therefore allow JS responder to properly release the responder at the end of the touch
    // stream.
    // NOTE: this is not a proper fix and solving this problem requires upstream fixes to DevMenuRN. In
    // particular if we have one PanHandler and ScrollView that can work simultaniously then when
    // the Pan handler activates it would still tigger cancel events.
    // Once the upstream fix lands the line below along with this comment can be removed
    if ([gestureRecognizer.view isKindOfClass:[UIScrollView class]]) return;

    RCTTouchHandler *touchHandler = [viewWithTouchHandler performSelector:@selector(touchHandler)];
    [touchHandler cancel];
}

#pragma mark Events

- (void)sendTouchEvent:(DevMenuRNGestureHandlerEvent *)event
{
    [_eventDispatcher sendEvent:event];
}

- (void)sendStateChangeEvent:(DevMenuRNGestureHandlerStateChange *)event
{
    [_eventDispatcher sendEvent:event];
}

- (void)sendTouchDeviceEvent:(DevMenuRNGestureHandlerEvent *)event
{
    NSMutableDictionary *body = [[event arguments] objectAtIndex:2];
    [_eventDispatcher sendDeviceEventWithName:@"onGestureHandlerEvent" body:body];
}

- (void)sendStateChangeDeviceEvent:(DevMenuRNGestureHandlerStateChange *)event
{
    NSMutableDictionary *body = [[event arguments] objectAtIndex:2];
    [_eventDispatcher sendDeviceEventWithName:@"onGestureHandlerStateChange" body:body];
}

@end
