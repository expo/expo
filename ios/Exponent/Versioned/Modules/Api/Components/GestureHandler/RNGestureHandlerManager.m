#import "RNGestureHandlerManager.h"

#import <React/RCTLog.h>
#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>
#import <React/RCTRootView.h>
#import <React/RCTTouchHandler.h>

#import "RNGestureHandlerState.h"
#import "RNGestureHandler.h"

@interface RNGestureHandlerManager () <RNGestureHandlerEventEmitter, RNRootViewGestureRecognizerDelegate>

@end

@implementation RNGestureHandlerManager
{
    RNGestureHandlerRegistry *_registry;
    RCTUIManager *_uiManager;
    NSMutableSet<UIView*> *_rootViews;
    RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager
                  eventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
    if ((self = [super init])) {
        _uiManager = uiManager;
        _eventDispatcher = eventDispatcher;
        _registry = [RNGestureHandlerRegistry new];
        _rootViews = [NSMutableSet new];
    }
    return self;
}

- (void)createGestureHandler:(NSNumber *)viewTag
                    withName:(NSString *)handlerName
                         tag:(NSNumber *)handlerTag
                      config:(NSDictionary *)config
{
    static NSDictionary *map;
    static dispatch_once_t mapToken;
    dispatch_once(&mapToken, ^{
        map = @{
                @"PanGestureHandler" : [RNPanGestureHandler class],
                @"TapGestureHandler" : [RNTapGestureHandler class],
                @"LongPressGestureHandler": [RNLongPressGestureHandler class],
                @"NativeViewGestureHandler": [RNNativeViewGestureHandler class],
                @"PinchGestureHandler": [RNPinchGestureHandler class],
                @"RotationGestureHandler": [RNRotationGestureHandler class],
                };
    });
    
    Class nodeClass = map[handlerName];
    if (!nodeClass) {
        RCTLogError(@"Gesture handler type %@ is not supported", handlerName);
        return;
    }
    
    RNGestureHandler *gestureHandler = [[nodeClass alloc] initWithTag:handlerTag];
    [gestureHandler configure:config];
    [_registry registerGestureHandler:gestureHandler forViewWithTag:viewTag];
    
    __weak id<RNGestureHandlerEventEmitter> emitter = self;
    gestureHandler.emitter = emitter;
        
    UIView *view = [_uiManager viewForReactTag:viewTag];
    [gestureHandler bindToView:view];
    
    // register root view if not already there
    [self registerRootViewIfNeeded:view];
}

- (void)updateGestureHandler:(NSNumber *)viewTag
                         tag:(NSNumber *)handlerTag
                      config:(NSDictionary *)config
{
    NSArray<RNGestureHandler*> *handlers = [_registry
                                            gestureHandlersForViewWithTag:viewTag
                                            andTag:handlerTag];
    for (RNGestureHandler *handler in handlers) {
        if ([handler.tag isEqual:handlerTag]) {
            [handler configure:config];
        }
    }
}

- (void)dropGestureHandlersForView:(NSNumber *)viewTag
{
    [_registry dropGestureHandlersForViewWithTag:viewTag];
}

- (void)handleSetJSResponder:(NSNumber *)viewTag blockNativeResponder:(NSNumber *)blockNativeResponder
{
    if ([blockNativeResponder boolValue]) {
        for (RCTRootView *rootView in _rootViews) {
            for (UIGestureRecognizer *recognizer in rootView.gestureRecognizers) {
                if ([recognizer isKindOfClass:[RNRootViewGestureRecognizer class]]) {
                    [(RNRootViewGestureRecognizer *)recognizer blockOtherRecognizers];
                }
            }
        }
    }
}

- (void)handleClearJSResponder
{
    // ignore...
}

#pragma mark Root Views Management

- (void)registerRootViewIfNeeded:(UIView*)childView
{
    UIView *parent = childView;
    while (parent != nil && ![parent isKindOfClass:[RCTRootView class]]) parent = parent.superview;
    
    RCTRootView *rootView = (RCTRootView *)parent;
    UIView *rootContentView = rootView.contentView;
    if (rootContentView != nil && ![_rootViews containsObject:rootContentView]) {
        RCTLogInfo(@"[GESTURE HANDLER] Initialize gesture handler for root view %@", rootContentView);
        [_rootViews addObject:rootContentView];
        RNRootViewGestureRecognizer *recognizer = [RNRootViewGestureRecognizer new];
        recognizer.delegate = self;
        rootContentView.userInteractionEnabled = YES;
        [rootContentView addGestureRecognizer:recognizer];
    }
}

- (void)gestureHandlerDidActivateInRootView:(UIView*)rootView
{
    // Dispatch touch cancel to JS in order to cancel all in-js recognizers
    RCTTouchHandler *touchHandler;
    // Find touch handlers - should be installed as the content view's recognizer
    for (UIGestureRecognizer *recognizer in rootView.gestureRecognizers) {
        if ([recognizer isKindOfClass:[RCTTouchHandler class]]) {
            touchHandler = (RCTTouchHandler *)recognizer;
            break;
        }
    }

    // We change touch handler to disabled and back to enabled, this will trigger cancel event
    // to be delivered to JS
    touchHandler.enabled = NO;
    touchHandler.enabled = YES;
}

- (void)dealloc
{
  if ([_rootViews count] > 0) {
    RCTLogInfo(@"[GESTURE HANDLER] Tearing down gesture handler registered for views %@", _rootViews);
  }
}

#pragma mark Events

- (void)sendTouchEvent:(RNGestureHandlerEvent *)event
{
    [_eventDispatcher sendEvent:event];
}

- (void)sendStateChangeEvent:(RNGestureHandlerStateChange *)event
{
    [_eventDispatcher sendEvent:event];
}

@end
