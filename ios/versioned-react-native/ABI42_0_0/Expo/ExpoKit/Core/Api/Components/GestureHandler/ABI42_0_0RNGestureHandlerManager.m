#import "ABI42_0_0RNGestureHandlerManager.h"

#import <ABI42_0_0React/ABI42_0_0RCTLog.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTComponent.h>
#import <ABI42_0_0React/ABI42_0_0RCTRootView.h>
#import <ABI42_0_0React/ABI42_0_0RCTTouchHandler.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>

#if __has_include(<ABI42_0_0React/ABI42_0_0RCTRootContentView.h>)
#import <ABI42_0_0React/ABI42_0_0RCTRootContentView.h>
#else
#import "ABI42_0_0RCTRootContentView.h"
#endif

#import "ABI42_0_0RNGestureHandlerState.h"
#import "ABI42_0_0RNGestureHandler.h"
#import "ABI42_0_0RNGestureHandlerRegistry.h"
#import "ABI42_0_0RNRootViewGestureRecognizer.h"

#import "Handlers/ABI42_0_0RNPanHandler.h"
#import "Handlers/ABI42_0_0RNTapHandler.h"
#import "Handlers/ABI42_0_0RNFlingHandler.h"
#import "Handlers/ABI42_0_0RNLongPressHandler.h"
#import "Handlers/ABI42_0_0RNNativeViewHandler.h"
#import "Handlers/ABI42_0_0RNPinchHandler.h"
#import "Handlers/ABI42_0_0RNRotationHandler.h"
#import "Handlers/ABI42_0_0RNForceTouchHandler.h"

// We use the method below instead of ABI42_0_0RCTLog because we log out messages after the bridge gets
// turned down in some cases. Which normally with ABI42_0_0RCTLog would cause a crash in DEBUG mode
#define ABI42_0_0RCTLifecycleLog(...) ABI42_0_0RCTDefaultLogFunction(ABI42_0_0RCTLogLevelInfo, ABI42_0_0RCTLogSourceNative, @(__FILE__), @(__LINE__), [NSString stringWithFormat:__VA_ARGS__])

@interface ABI42_0_0RNGestureHandlerManager () <ABI42_0_0RNGestureHandlerEventEmitter, ABI42_0_0RNRootViewGestureRecognizerDelegate>

@end

@implementation ABI42_0_0RNGestureHandlerManager
{
    ABI42_0_0RNGestureHandlerRegistry *_registry;
    ABI42_0_0RCTUIManager *_uiManager;
    NSHashTable<UIView *> *_rootViews;
    ABI42_0_0RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithUIManager:(ABI42_0_0RCTUIManager *)uiManager
                  eventDispatcher:(ABI42_0_0RCTEventDispatcher *)eventDispatcher
{
    if ((self = [super init])) {
        _uiManager = uiManager;
        _eventDispatcher = eventDispatcher;
        _registry = [ABI42_0_0RNGestureHandlerRegistry new];
        _rootViews = [NSHashTable hashTableWithOptions:NSPointerFunctionsWeakMemory];
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
                @"PanGestureHandler" : [ABI42_0_0RNPanGestureHandler class],
                @"TapGestureHandler" : [ABI42_0_0RNTapGestureHandler class],
                @"FlingGestureHandler" : [ABI42_0_0RNFlingGestureHandler class],
                @"LongPressGestureHandler": [ABI42_0_0RNLongPressGestureHandler class],
                @"NativeViewGestureHandler": [ABI42_0_0RNNativeViewGestureHandler class],
                @"PinchGestureHandler": [ABI42_0_0RNPinchGestureHandler class],
                @"RotationGestureHandler": [ABI42_0_0RNRotationGestureHandler class],
                @"ForceTouchGestureHandler": [ABI42_0_0RNForceTouchHandler class],
                };
    });
    
    Class nodeClass = map[handlerName];
    if (!nodeClass) {
        ABI42_0_0RCTLogError(@"Gesture handler type %@ is not supported", handlerName);
        return;
    }
    
    ABI42_0_0RNGestureHandler *gestureHandler = [[nodeClass alloc] initWithTag:handlerTag];
    [gestureHandler configure:config];
    [_registry registerGestureHandler:gestureHandler];
    
    __weak id<ABI42_0_0RNGestureHandlerEventEmitter> emitter = self;
    gestureHandler.emitter = emitter;
}


- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag
{
    UIView *view = [_uiManager viewForABI42_0_0ReactTag:viewTag];

    [_registry attachHandlerWithTag:handlerTag toView:view];

    // register root view if not already there
    [self registerRootViewIfNeeded:view];
}

- (void)updateGestureHandler:(NSNumber *)handlerTag config:(NSDictionary *)config
{
    ABI42_0_0RNGestureHandler *handler = [_registry handlerWithTag:handlerTag];
    [handler configure:config];
}

- (void)dropGestureHandler:(NSNumber *)handlerTag
{
    [_registry dropHandlerWithTag:handlerTag];
}

- (void)handleSetJSResponder:(NSNumber *)viewTag blockNativeResponder:(NSNumber *)blockNativeResponder
{
    if ([blockNativeResponder boolValue]) {
        for (ABI42_0_0RCTRootView *rootView in _rootViews) {
            for (UIGestureRecognizer *recognizer in rootView.gestureRecognizers) {
                if ([recognizer isKindOfClass:[ABI42_0_0RNRootViewGestureRecognizer class]]) {
                    [(ABI42_0_0RNRootViewGestureRecognizer *)recognizer blockOtherRecognizers];
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
    while (parent != nil && ![parent isKindOfClass:[ABI42_0_0RCTRootView class]]) parent = parent.superview;
    
    ABI42_0_0RCTRootView *rootView = (ABI42_0_0RCTRootView *)parent;
    UIView *rootContentView = rootView.contentView;
    if (rootContentView != nil && ![_rootViews containsObject:rootContentView]) {
        ABI42_0_0RCTLifecycleLog(@"[GESTURE HANDLER] Initialize gesture handler for root view %@", rootContentView);
        [_rootViews addObject:rootContentView];
        ABI42_0_0RNRootViewGestureRecognizer *recognizer = [ABI42_0_0RNRootViewGestureRecognizer new];
        recognizer.delegate = self;
        rootContentView.userInteractionEnabled = YES;
        [rootContentView addGestureRecognizer:recognizer];
    }
}

- (void)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    didActivateInRootView:(UIView *)rootContentView
{
    // Cancel touches in ABI42_0_0RN's root view in order to cancel all in-js recognizers

    // As scroll events are special-cased in ABI42_0_0RN responder implementation and sending them would
    // trigger JS responder change, we don't cancel touches if the handler that got activated is
    // a scroll recognizer. This way root view will keep sending touchMove and touchEnd events
    // and therefore allow JS responder to properly release the responder at the end of the touch
    // stream.
    // NOTE: this is not a proper fix and solving this problem requires upstream fixes to ABI42_0_0RN. In
    // particular if we have one PanHandler and ScrollView that can work simultaniously then when
    // the Pan handler activates it would still tigger cancel events.
    // Once the upstream fix lands the line below along with this comment can be removed
    if ([gestureRecognizer.view isKindOfClass:[UIScrollView class]]) return;

    UIView *parent = rootContentView.superview;
    if ([parent isKindOfClass:[ABI42_0_0RCTRootView class]]) {
        [((ABI42_0_0RCTRootContentView*)rootContentView).touchHandler cancel];
    }
}

- (void)dealloc
{
    if ([_rootViews count] > 0) {
        ABI42_0_0RCTLifecycleLog(@"[GESTURE HANDLER] Tearing down gesture handler registered for views %@", _rootViews);
    }
}

#pragma mark Events

- (void)sendTouchEvent:(ABI42_0_0RNGestureHandlerEvent *)event
{
    [_eventDispatcher sendEvent:event];
}

- (void)sendStateChangeEvent:(ABI42_0_0RNGestureHandlerStateChange *)event
{
    [_eventDispatcher sendEvent:event];
}

@end
