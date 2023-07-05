#import "RNGestureHandlerManager.h"

#import <React/RCTComponent.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTModalHostViewController.h>
#import <React/RCTRootContentView.h>
#import <React/RCTRootView.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

#import "RNGestureHandler.h"
#import "RNGestureHandlerActionType.h"
#import "RNGestureHandlerRegistry.h"
#import "RNGestureHandlerState.h"
#import "RNRootViewGestureRecognizer.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTFabricModalHostViewController.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTViewComponentView.h>
#else
#import <React/RCTTouchHandler.h>
#endif // RCT_NEW_ARCH_ENABLED

#import "Handlers/RNFlingHandler.h"
#import "Handlers/RNForceTouchHandler.h"
#import "Handlers/RNLongPressHandler.h"
#import "Handlers/RNManualHandler.h"
#import "Handlers/RNNativeViewHandler.h"
#import "Handlers/RNPanHandler.h"
#import "Handlers/RNPinchHandler.h"
#import "Handlers/RNRotationHandler.h"
#import "Handlers/RNTapHandler.h"

// We use the method below instead of RCTLog because we log out messages after the bridge gets
// turned down in some cases. Which normally with RCTLog would cause a crash in DEBUG mode
#define RCTLifecycleLog(...) \
  RCTDefaultLogFunction(     \
      RCTLogLevelInfo, RCTLogSourceNative, @(__FILE__), @(__LINE__), [NSString stringWithFormat:__VA_ARGS__])

constexpr int NEW_ARCH_NUMBER_OF_ATTACH_RETRIES = 25;

@interface RNGestureHandlerManager () <RNGestureHandlerEventEmitter, RNRootViewGestureRecognizerDelegate>

@end

@implementation RNGestureHandlerManager {
  RNGestureHandlerRegistry *_registry;
  RCTUIManager *_uiManager;
  NSHashTable<RNRootViewGestureRecognizer *> *_rootViewGestureRecognizers;
  NSMutableDictionary<NSNumber *, NSNumber *> *_attachRetryCounter;
  RCTEventDispatcher *_eventDispatcher;
  id _reanimatedModule;
}

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager eventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super init])) {
    _uiManager = uiManager;
    _eventDispatcher = eventDispatcher;
    _registry = [RNGestureHandlerRegistry new];
    _rootViewGestureRecognizers = [NSHashTable hashTableWithOptions:NSPointerFunctionsWeakMemory];
    _attachRetryCounter = [[NSMutableDictionary alloc] init];
    _reanimatedModule = nil;
  }
  return self;
}

- (void)createGestureHandler:(NSString *)handlerName tag:(NSNumber *)handlerTag config:(NSDictionary *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{
      @"PanGestureHandler" : [RNPanGestureHandler class],
      @"TapGestureHandler" : [RNTapGestureHandler class],
      @"FlingGestureHandler" : [RNFlingGestureHandler class],
      @"LongPressGestureHandler" : [RNLongPressGestureHandler class],
      @"NativeViewGestureHandler" : [RNNativeViewGestureHandler class],
      @"PinchGestureHandler" : [RNPinchGestureHandler class],
      @"RotationGestureHandler" : [RNRotationGestureHandler class],
      @"ForceTouchGestureHandler" : [RNForceTouchHandler class],
      @"ManualGestureHandler" : [RNManualGestureHandler class],
    };
  });

  Class nodeClass = map[handlerName];
  if (!nodeClass) {
    RCTLogError(@"Gesture handler type %@ is not supported", handlerName);
    return;
  }

  RNGestureHandler *gestureHandler = [[nodeClass alloc] initWithTag:handlerTag];
  [gestureHandler configure:config];
  [_registry registerGestureHandler:gestureHandler];

  __weak id<RNGestureHandlerEventEmitter> emitter = self;
  gestureHandler.emitter = emitter;
}

- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag
              withActionType:(RNGestureHandlerActionType)actionType
{
  UIView *view = [_uiManager viewForReactTag:viewTag];

#ifdef RCT_NEW_ARCH_ENABLED
  if (view == nil || view.superview == nil) {
    // There are a few reasons we could end up here:
    // - the native view corresponding to the viewtag hasn't yet been created
    // - the native view has been created, but it's not attached to window
    // - the native view will not exist because it got flattened
    // In the first two cases we just want to wait until the view gets created or gets attached to its superview
    // In the third case we don't want to do anything but we cannot easily distinguish it here, hece the abomination
    // below
    // TODO: would be great to have a better solution, although it might require migration to the shadow nodes from
    // viewTags

    NSNumber *counter = [_attachRetryCounter objectForKey:viewTag];
    if (counter == nil) {
      counter = @1;
    } else {
      counter = [NSNumber numberWithInt:counter.intValue + 1];
    }

    if (counter.intValue > NEW_ARCH_NUMBER_OF_ATTACH_RETRIES) {
      [_attachRetryCounter removeObjectForKey:viewTag];
    } else {
      [_attachRetryCounter setObject:counter forKey:viewTag];

      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
        [self attachGestureHandler:handlerTag toViewWithTag:viewTag withActionType:actionType];
      });
    }

    return;
  }

  [_attachRetryCounter removeObjectForKey:viewTag];

  // I think it should be moved to RNNativeViewHandler, but that would require
  // additional logic for setting contentView.reactTag, this works for now
  if ([view isKindOfClass:[RCTViewComponentView class]]) {
    RCTViewComponentView *componentView = (RCTViewComponentView *)view;
    if (componentView.contentView != nil) {
      view = componentView.contentView;
    }
  }

  view.reactTag = viewTag; // necessary for RNReanimated eventHash (e.g. "42onGestureHandlerEvent"), also will be
                           // returned as event.target
#endif // RCT_NEW_ARCH_ENABLED

  [_registry attachHandlerWithTag:handlerTag toView:view withActionType:actionType];

  // register view if not already there
  [self registerViewWithGestureRecognizerAttachedIfNeeded:view];
}

- (void)updateGestureHandler:(NSNumber *)handlerTag config:(NSDictionary *)config
{
  RNGestureHandler *handler = [_registry handlerWithTag:handlerTag];
  [handler configure:config];
}

- (void)dropGestureHandler:(NSNumber *)handlerTag
{
  [_registry dropHandlerWithTag:handlerTag];
}

- (void)dropAllGestureHandlers
{
  [_registry dropAllHandlers];
}

- (void)handleSetJSResponder:(NSNumber *)viewTag blockNativeResponder:(NSNumber *)blockNativeResponder
{
  if ([blockNativeResponder boolValue]) {
    for (RNRootViewGestureRecognizer *recognizer in _rootViewGestureRecognizers) {
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
#ifdef RCT_NEW_ARCH_ENABLED
  UIView *touchHandlerView = childView;

  if ([[childView reactViewController] isKindOfClass:[RCTFabricModalHostViewController class]]) {
    touchHandlerView = [childView reactViewController].view;
  } else {
    while (touchHandlerView != nil && ![touchHandlerView isKindOfClass:[RCTSurfaceView class]]) {
      touchHandlerView = touchHandlerView.superview;
    }
  }
#else
  UIView *touchHandlerView = nil;

  if ([[childView reactViewController] isKindOfClass:[RCTModalHostViewController class]]) {
    touchHandlerView = [childView reactViewController].view.subviews[0];
  } else {
    UIView *parent = childView;
    while (parent != nil && ![parent respondsToSelector:@selector(touchHandler)]) {
      parent = parent.superview;
    }

    touchHandlerView = [[parent performSelector:@selector(touchHandler)] view];
  }
#endif // RCT_NEW_ARCH_ENABLED

  if (touchHandlerView == nil) {
    return;
  }

  // Many views can return the same touchHandler so we check if the one we want to register
  // is not already present in the set.
  for (UIGestureRecognizer *recognizer in touchHandlerView.gestureRecognizers) {
    if ([recognizer isKindOfClass:[RNRootViewGestureRecognizer class]]) {
      return;
    }
  }

  RCTLifecycleLog(@"[GESTURE HANDLER] Initialize gesture handler for view %@", touchHandlerView);
  RNRootViewGestureRecognizer *recognizer = [RNRootViewGestureRecognizer new];
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
  if ([gestureRecognizer.view isKindOfClass:[UIScrollView class]])
    return;

  UIGestureRecognizer *touchHandler = nil;

  // this way we can extract the touch handler on both architectures relatively easily
  for (UIGestureRecognizer *recognizer in [viewWithTouchHandler gestureRecognizers]) {
#ifdef RCT_NEW_ARCH_ENABLED
    if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]]) {
#else
    if ([recognizer isKindOfClass:[RCTTouchHandler class]]) {
#endif // RCT_NEW_ARCH_ENABLED
      touchHandler = recognizer;
      break;
    }
  }
  [touchHandler setEnabled:NO];
  [touchHandler setEnabled:YES];
}

#pragma mark Events

- (void)sendEvent:(RNGestureHandlerStateChange *)event withActionType:(RNGestureHandlerActionType)actionType
{
  switch (actionType) {
    case RNGestureHandlerActionTypeReanimatedWorklet:
      [self sendEventForReanimated:event];
      break;

    case RNGestureHandlerActionTypeNativeAnimatedEvent:
      if ([event.eventName isEqualToString:@"onGestureHandlerEvent"]) {
        [self sendEventForNativeAnimatedEvent:event];
      } else {
        // Although onGestureEvent prop is an Animated.event with useNativeDriver: true,
        // onHandlerStateChange prop is still a regular JS function.
        // Also, Animated.event is only supported with old API.
        [self sendEventForJSFunctionOldAPI:event];
      }
      break;

    case RNGestureHandlerActionTypeJSFunctionOldAPI:
      [self sendEventForJSFunctionOldAPI:event];
      break;

    case RNGestureHandlerActionTypeJSFunctionNewAPI:
      [self sendEventForJSFunctionNewAPI:event];
      break;
  }
}

- (void)sendEventForReanimated:(RNGestureHandlerStateChange *)event
{
  // Delivers the event to Reanimated.
#ifdef RCT_NEW_ARCH_ENABLED
  // Send event directly to Reanimated
  if (_reanimatedModule == nil) {
    _reanimatedModule = [_uiManager.bridge moduleForName:@"ReanimatedModule"];
  }

  [_reanimatedModule eventDispatcherWillDispatchEvent:event];
#else
  // In the old architecture, Reanimated overwrites RCTEventDispatcher
  // with REAEventDispatcher and intercepts all direct events.
  [self sendEventForDirectEvent:event];
#endif // RCT_NEW_ARCH_ENABLED
}

- (void)sendEventForNativeAnimatedEvent:(RNGestureHandlerStateChange *)event
{
  // Delivers the event to NativeAnimatedModule.
  // Currently, NativeAnimated[Turbo]Module is RCTEventDispatcherObserver so we can
  // simply send a direct event which is handled by the observer but ignored on JS side.
  // TODO: send event directly to NativeAnimated[Turbo]Module
  [self sendEventForDirectEvent:event];
}

- (void)sendEventForJSFunctionOldAPI:(RNGestureHandlerStateChange *)event
{
  // Delivers the event to JS (old RNGH API).
#ifdef RCT_NEW_ARCH_ENABLED
  [self sendEventForDeviceEvent:event];
#else
  [self sendEventForDirectEvent:event];
#endif // RCT_NEW_ARCH_ENABLED
}

- (void)sendEventForJSFunctionNewAPI:(RNGestureHandlerStateChange *)event
{
  // Delivers the event to JS (new RNGH API).
  [self sendEventForDeviceEvent:event];
}

- (void)sendEventForDirectEvent:(RNGestureHandlerStateChange *)event
{
  // Delivers the event to JS as a direct event.
  [_eventDispatcher sendEvent:event];
}

- (void)sendEventForDeviceEvent:(RNGestureHandlerStateChange *)event
{
  // Delivers the event to JS as a device event.
  NSMutableDictionary *body = [[event arguments] objectAtIndex:2];
  [_eventDispatcher sendDeviceEventWithName:@"onGestureHandlerStateChange" body:body];
}

@end
