#import "ABI21_0_0RNGestureHandlerManager.h"

#import <ReactABI21_0_0/ABI21_0_0RCTLog.h>
#import <ReactABI21_0_0/ABI21_0_0RCTViewManager.h>
#import <ReactABI21_0_0/ABI21_0_0RCTComponent.h>
#import <ReactABI21_0_0/ABI21_0_0RCTRootView.h>
#import <ReactABI21_0_0/ABI21_0_0RCTTouchHandler.h>

#import "ABI21_0_0RNGestureHandlerState.h"
#import "ABI21_0_0RNGestureHandler.h"

// We use the method below instead of ABI21_0_0RCTLog because we log out messages after the bridge gets
// turned down in some cases. Which normally with ABI21_0_0RCTLog would cause a crash in DEBUG mode
#define ABI21_0_0RCTLifecycleLog(...) ABI21_0_0RCTDefaultLogFunction(ABI21_0_0RCTLogLevelInfo, ABI21_0_0RCTLogSourceNative, @(__FILE__), @(__LINE__), [NSString stringWithFormat:__VA_ARGS__])

@interface ABI21_0_0RNGestureHandlerManager () <ABI21_0_0RNGestureHandlerEventEmitter, ABI21_0_0RNRootViewGestureRecognizerDelegate>

@end

@implementation ABI21_0_0RNGestureHandlerManager
{
    ABI21_0_0RNGestureHandlerRegistry *_registry;
    ABI21_0_0RCTUIManager *_uiManager;
    NSMutableSet<UIView*> *_rootViews;
    ABI21_0_0RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithUIManager:(ABI21_0_0RCTUIManager *)uiManager
                  eventDispatcher:(ABI21_0_0RCTEventDispatcher *)eventDispatcher
{
    if ((self = [super init])) {
        _uiManager = uiManager;
        _eventDispatcher = eventDispatcher;
        _registry = [ABI21_0_0RNGestureHandlerRegistry new];
        _rootViews = [NSMutableSet new];
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
                @"PanGestureHandler" : [ABI21_0_0RNPanGestureHandler class],
                @"TapGestureHandler" : [ABI21_0_0RNTapGestureHandler class],
                @"LongPressGestureHandler": [ABI21_0_0RNLongPressGestureHandler class],
                @"NativeViewGestureHandler": [ABI21_0_0RNNativeViewGestureHandler class],
                @"PinchGestureHandler": [ABI21_0_0RNPinchGestureHandler class],
                @"RotationGestureHandler": [ABI21_0_0RNRotationGestureHandler class],
                };
    });
    
    Class nodeClass = map[handlerName];
    if (!nodeClass) {
        ABI21_0_0RCTLogError(@"Gesture handler type %@ is not supported", handlerName);
        return;
    }
    
    ABI21_0_0RNGestureHandler *gestureHandler = [[nodeClass alloc] initWithTag:handlerTag];
    [gestureHandler configure:config];
    [_registry registerGestureHandler:gestureHandler];
    
    __weak id<ABI21_0_0RNGestureHandlerEventEmitter> emitter = self;
    gestureHandler.emitter = emitter;
}


- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag
{
    UIView *view = [_uiManager viewForReactABI21_0_0Tag:viewTag];

    [_registry attachHandlerWithTag:handlerTag toView:view];

    // register root view if not already there
    [self registerRootViewIfNeeded:view];
}

- (void)updateGestureHandler:(NSNumber *)handlerTag config:(NSDictionary *)config
{
    ABI21_0_0RNGestureHandler *handler = [_registry handlerWithTag:handlerTag];
    [handler configure:config];
}

- (void)dropGestureHandler:(NSNumber *)handlerTag
{
    [_registry dropHandlerWithTag:handlerTag];
}

- (void)handleSetJSResponder:(NSNumber *)viewTag blockNativeResponder:(NSNumber *)blockNativeResponder
{
    if ([blockNativeResponder boolValue]) {
        for (ABI21_0_0RCTRootView *rootView in _rootViews) {
            for (UIGestureRecognizer *recognizer in rootView.gestureRecognizers) {
                if ([recognizer isKindOfClass:[ABI21_0_0RNRootViewGestureRecognizer class]]) {
                    [(ABI21_0_0RNRootViewGestureRecognizer *)recognizer blockOtherRecognizers];
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
    while (parent != nil && ![parent isKindOfClass:[ABI21_0_0RCTRootView class]]) parent = parent.superview;
    
    ABI21_0_0RCTRootView *rootView = (ABI21_0_0RCTRootView *)parent;
    UIView *rootContentView = rootView.contentView;
    if (rootContentView != nil && ![_rootViews containsObject:rootContentView]) {
        ABI21_0_0RCTLifecycleLog(@"[GESTURE HANDLER] Initialize gesture handler for root view %@", rootContentView);
        [_rootViews addObject:rootContentView];
        ABI21_0_0RNRootViewGestureRecognizer *recognizer = [ABI21_0_0RNRootViewGestureRecognizer new];
        recognizer.delegate = self;
        rootContentView.userInteractionEnabled = YES;
        [rootContentView addGestureRecognizer:recognizer];
    }
}

- (void)gestureHandlerDidActivateInRootView:(UIView*)rootView
{
    // Dispatch touch cancel to JS in order to cancel all in-js recognizers
    ABI21_0_0RCTTouchHandler *touchHandler;
    // Find touch handlers - should be installed as the content view's recognizer
    for (UIGestureRecognizer *recognizer in rootView.gestureRecognizers) {
        if ([recognizer isKindOfClass:[ABI21_0_0RCTTouchHandler class]]) {
            touchHandler = (ABI21_0_0RCTTouchHandler *)recognizer;
            break;
        }
    }

    // We change touch handler to disabled and back to enabled, this will trigger cancel event
    // to be delivered to JS

    // NOTE(brentvatne): this is temporarily disabled due to a bug with react-native touch cancel events!
    // touchHandler.enabled = NO;
    // touchHandler.enabled = YES;
}

- (void)dealloc
{
    if ([_rootViews count] > 0) {
        ABI21_0_0RCTLifecycleLog(@"[GESTURE HANDLER] Tearing down gesture handler registered for views %@", _rootViews);
    }
}

#pragma mark Events

- (void)sendTouchEvent:(ABI21_0_0RNGestureHandlerEvent *)event
{
    [_eventDispatcher sendEvent:event];
}

- (void)sendStateChangeEvent:(ABI21_0_0RNGestureHandlerStateChange *)event
{
    [_eventDispatcher sendEvent:event];
}

@end
