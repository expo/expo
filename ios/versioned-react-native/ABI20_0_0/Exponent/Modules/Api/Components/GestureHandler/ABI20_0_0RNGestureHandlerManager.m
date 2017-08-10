#import "ABI20_0_0RNGestureHandlerManager.h"

#import <ReactABI20_0_0/ABI20_0_0RCTLog.h>
#import <ReactABI20_0_0/ABI20_0_0RCTViewManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTComponent.h>
#import <ReactABI20_0_0/ABI20_0_0RCTRootView.h>

#import "ABI20_0_0RNGestureHandlerState.h"
#import "ABI20_0_0RNGestureHandler.h"

@interface ABI20_0_0RNGestureHandlerManager () <ABI20_0_0RNGestureHandlerEventEmitter>

@end

@implementation ABI20_0_0RNGestureHandlerManager
{
    ABI20_0_0RNGestureHandlerRegistry *_registry;
    ABI20_0_0RCTUIManager *_uiManager;
    NSMutableSet<ABI20_0_0RCTRootView*> *_rootViews;
    ABI20_0_0RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithUIManager:(ABI20_0_0RCTUIManager *)uiManager
                  eventDispatcher:(ABI20_0_0RCTEventDispatcher *)eventDispatcher
{
    if ((self = [super init])) {
        _uiManager = uiManager;
        _eventDispatcher = eventDispatcher;
        _registry = [ABI20_0_0RNGestureHandlerRegistry new];
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
                @"PanGestureHandler" : [ABI20_0_0RNPanGestureHandler class],
                @"TapGestureHandler" : [ABI20_0_0RNTapGestureHandler class],
                @"LongPressGestureHandler": [ABI20_0_0RNLongPressGestureHandler class],
                @"NativeViewGestureHandler": [ABI20_0_0RNNativeViewGestureHandler class],
                @"PinchGestureHandler": [ABI20_0_0RNPinchGestureHandler class],
                @"RotationGestureHandler": [ABI20_0_0RNRotationGestureHandler class],
                };
    });
    
    Class nodeClass = map[handlerName];
    if (!nodeClass) {
        ABI20_0_0RCTLogError(@"Gesture handler type %@ is not supported", handlerName);
        return;
    }
    
    ABI20_0_0RNGestureHandler *gestureHandler = [[nodeClass alloc] initWithTag:handlerTag];
    [gestureHandler configure:config];
    [_registry registerGestureHandler:gestureHandler forViewWithTag:viewTag];
    
    __weak id<ABI20_0_0RNGestureHandlerEventEmitter> emitter = self;
    gestureHandler.emitter = emitter;
        
    UIView *view = [_uiManager viewForReactABI20_0_0Tag:viewTag];
    [gestureHandler bindToView:view];
    
    // register root view if not already there
    [self registerRootViewIfNeeded:view];
}

- (void)updateGestureHandler:(NSNumber *)viewTag
                         tag:(NSNumber *)handlerTag
                      config:(NSDictionary *)config
{
    NSArray<ABI20_0_0RNGestureHandler*> *handlers = [_registry
                                            gestureHandlersForViewWithTag:viewTag
                                            andTag:handlerTag];
    for (ABI20_0_0RNGestureHandler *handler in handlers) {
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
        for (ABI20_0_0RCTRootView *rootView in _rootViews) {
            for (UIGestureRecognizer *recognizer in rootView.gestureRecognizers) {
                if ([recognizer isKindOfClass:[ABI20_0_0RNRootViewGestureRecognizer class]]) {
                    [(ABI20_0_0RNRootViewGestureRecognizer *)recognizer blockOtherRecognizers];
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
    while (parent != nil && ![parent isKindOfClass:[ABI20_0_0RCTRootView class]]) parent = parent.superview;
    
    ABI20_0_0RCTRootView *rootView = (ABI20_0_0RCTRootView *)parent;
    if (rootView != nil && ![_rootViews containsObject:rootView]) {
        [_rootViews addObject:rootView];
        ABI20_0_0RNRootViewGestureRecognizer *recognizer = [ABI20_0_0RNRootViewGestureRecognizer new];
        rootView.userInteractionEnabled = YES;
        [rootView addGestureRecognizer:recognizer];
    }
}

#pragma mark Events

- (void)sendTouchEvent:(ABI20_0_0RNGestureHandlerEvent *)event
{
    [_eventDispatcher sendEvent:event];
}

- (void)sendStateChangeEvent:(ABI20_0_0RNGestureHandlerStateChange *)event
{
    [_eventDispatcher sendEvent:event];
}

@end
