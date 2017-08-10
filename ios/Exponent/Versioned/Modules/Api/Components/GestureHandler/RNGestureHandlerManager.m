#import "RNGestureHandlerManager.h"

#import <React/RCTLog.h>
#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>
#import <React/RCTRootView.h>

#import "RNGestureHandlerState.h"
#import "RNGestureHandler.h"

@interface RNGestureHandlerManager () <RNGestureHandlerEventEmitter>

@end

@implementation RNGestureHandlerManager
{
    RNGestureHandlerRegistry *_registry;
    RCTUIManager *_uiManager;
    NSMutableSet<RCTRootView*> *_rootViews;
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
    if (rootView != nil && ![_rootViews containsObject:rootView]) {
        [_rootViews addObject:rootView];
        RNRootViewGestureRecognizer *recognizer = [RNRootViewGestureRecognizer new];
        rootView.userInteractionEnabled = YES;
        [rootView addGestureRecognizer:recognizer];
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
