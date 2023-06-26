#import "ABI49_0_0RNGestureHandlerManager.h"

#import <ABI49_0_0React/ABI49_0_0RCTComponent.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import <ABI49_0_0React/ABI49_0_0RCTModalHostViewController.h>
#import <ABI49_0_0React/ABI49_0_0RCTRootContentView.h>
#import <ABI49_0_0React/ABI49_0_0RCTRootView.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

#import "ABI49_0_0RNGestureHandler.h"
#import "ABI49_0_0RNGestureHandlerActionType.h"
#import "ABI49_0_0RNGestureHandlerRegistry.h"
#import "ABI49_0_0RNGestureHandlerState.h"
#import "ABI49_0_0RNRootViewGestureRecognizer.h"

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTFabricModalHostViewController.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceTouchHandler.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceView.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>
#else
#import <ABI49_0_0React/ABI49_0_0RCTTouchHandler.h>
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

#import "Handlers/ABI49_0_0RNFlingHandler.h"
#import "Handlers/ABI49_0_0RNForceTouchHandler.h"
#import "Handlers/ABI49_0_0RNLongPressHandler.h"
#import "Handlers/ABI49_0_0RNManualHandler.h"
#import "Handlers/ABI49_0_0RNNativeViewHandler.h"
#import "Handlers/ABI49_0_0RNPanHandler.h"
#import "Handlers/ABI49_0_0RNPinchHandler.h"
#import "Handlers/ABI49_0_0RNRotationHandler.h"
#import "Handlers/ABI49_0_0RNTapHandler.h"

// We use the method below instead of ABI49_0_0RCTLog because we log out messages after the bridge gets
// turned down in some cases. Which normally with ABI49_0_0RCTLog would cause a crash in DEBUG mode
#define ABI49_0_0RCTLifecycleLog(...) \
  ABI49_0_0RCTDefaultLogFunction(     \
      ABI49_0_0RCTLogLevelInfo, ABI49_0_0RCTLogSourceNative, @(__FILE__), @(__LINE__), [NSString stringWithFormat:__VA_ARGS__])

constexpr int NEW_ARCH_NUMBER_OF_ATTACH_RETRIES = 25;

@interface ABI49_0_0RNGestureHandlerManager () <ABI49_0_0RNGestureHandlerEventEmitter, ABI49_0_0RNRootViewGestureRecognizerDelegate>

@end

@implementation ABI49_0_0RNGestureHandlerManager {
  ABI49_0_0RNGestureHandlerRegistry *_registry;
  ABI49_0_0RCTUIManager *_uiManager;
  NSHashTable<ABI49_0_0RNRootViewGestureRecognizer *> *_rootViewGestureRecognizers;
  NSMutableDictionary<NSNumber *, NSNumber *> *_attachRetryCounter;
  ABI49_0_0RCTEventDispatcher *_eventDispatcher;
  id _reanimatedModule;
}

- (instancetype)initWithUIManager:(ABI49_0_0RCTUIManager *)uiManager eventDispatcher:(ABI49_0_0RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super init])) {
    _uiManager = uiManager;
    _eventDispatcher = eventDispatcher;
    _registry = [ABI49_0_0RNGestureHandlerRegistry new];
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
      @"PanGestureHandler" : [ABI49_0_0RNPanGestureHandler class],
      @"TapGestureHandler" : [ABI49_0_0RNTapGestureHandler class],
      @"FlingGestureHandler" : [ABI49_0_0RNFlingGestureHandler class],
      @"LongPressGestureHandler" : [ABI49_0_0RNLongPressGestureHandler class],
      @"NativeViewGestureHandler" : [ABI49_0_0RNNativeViewGestureHandler class],
      @"PinchGestureHandler" : [ABI49_0_0RNPinchGestureHandler class],
      @"RotationGestureHandler" : [ABI49_0_0RNRotationGestureHandler class],
      @"ForceTouchGestureHandler" : [ABI49_0_0RNForceTouchHandler class],
      @"ManualGestureHandler" : [ABI49_0_0RNManualGestureHandler class],
    };
  });

  Class nodeClass = map[handlerName];
  if (!nodeClass) {
    ABI49_0_0RCTLogError(@"Gesture handler type %@ is not supported", handlerName);
    return;
  }

  ABI49_0_0RNGestureHandler *gestureHandler = [[nodeClass alloc] initWithTag:handlerTag];
  [gestureHandler configure:config];
  [_registry registerGestureHandler:gestureHandler];

  __weak id<ABI49_0_0RNGestureHandlerEventEmitter> emitter = self;
  gestureHandler.emitter = emitter;
}

- (void)attachGestureHandler:(nonnull NSNumber *)handlerTag
               toViewWithTag:(nonnull NSNumber *)viewTag
              withActionType:(ABI49_0_0RNGestureHandlerActionType)actionType
{
  UIView *view = [_uiManager viewForABI49_0_0ReactTag:viewTag];

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
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

  // I think it should be moved to ABI49_0_0RNNativeViewHandler, but that would require
  // additional logic for setting contentView.ABI49_0_0ReactTag, this works for now
  if ([view isKindOfClass:[ABI49_0_0RCTViewComponentView class]]) {
    ABI49_0_0RCTViewComponentView *componentView = (ABI49_0_0RCTViewComponentView *)view;
    if (componentView.contentView != nil) {
      view = componentView.contentView;
    }
  }

  view.ABI49_0_0ReactTag = viewTag; // necessary for ABI49_0_0RNReanimated eventHash (e.g. "42onGestureHandlerEvent"), also will be
                           // returned as event.target
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

  [_registry attachHandlerWithTag:handlerTag toView:view withActionType:actionType];

  // register view if not already there
  [self registerViewWithGestureRecognizerAttachedIfNeeded:view];
}

- (void)updateGestureHandler:(NSNumber *)handlerTag config:(NSDictionary *)config
{
  ABI49_0_0RNGestureHandler *handler = [_registry handlerWithTag:handlerTag];
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
    for (ABI49_0_0RNRootViewGestureRecognizer *recognizer in _rootViewGestureRecognizers) {
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
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  UIView *touchHandlerView = childView;

  if ([[childView ABI49_0_0ReactViewController] isKindOfClass:[ABI49_0_0RCTFabricModalHostViewController class]]) {
    touchHandlerView = [childView ABI49_0_0ReactViewController].view;
  } else {
    while (touchHandlerView != nil && ![touchHandlerView isKindOfClass:[ABI49_0_0RCTSurfaceView class]]) {
      touchHandlerView = touchHandlerView.superview;
    }
  }
#else
  UIView *touchHandlerView = nil;

  if ([[childView ABI49_0_0ReactViewController] isKindOfClass:[ABI49_0_0RCTModalHostViewController class]]) {
    touchHandlerView = [childView ABI49_0_0ReactViewController].view.subviews[0];
  } else {
    UIView *parent = childView;
    while (parent != nil && ![parent respondsToSelector:@selector(touchHandler)]) {
      parent = parent.superview;
    }

    touchHandlerView = [[parent performSelector:@selector(touchHandler)] view];
  }
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

  if (touchHandlerView == nil) {
    return;
  }

  // Many views can return the same touchHandler so we check if the one we want to register
  // is not already present in the set.
  for (UIGestureRecognizer *recognizer in touchHandlerView.gestureRecognizers) {
    if ([recognizer isKindOfClass:[ABI49_0_0RNRootViewGestureRecognizer class]]) {
      return;
    }
  }

  ABI49_0_0RCTLifecycleLog(@"[GESTURE HANDLER] Initialize gesture handler for view %@", touchHandlerView);
  ABI49_0_0RNRootViewGestureRecognizer *recognizer = [ABI49_0_0RNRootViewGestureRecognizer new];
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
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    if ([recognizer isKindOfClass:[ABI49_0_0RCTSurfaceTouchHandler class]]) {
#else
    if ([recognizer isKindOfClass:[ABI49_0_0RCTTouchHandler class]]) {
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
      touchHandler = recognizer;
      break;
    }
  }
  [touchHandler setEnabled:NO];
  [touchHandler setEnabled:YES];
}

#pragma mark Events

- (void)sendEvent:(ABI49_0_0RNGestureHandlerStateChange *)event withActionType:(ABI49_0_0RNGestureHandlerActionType)actionType
{
  switch (actionType) {
    case ABI49_0_0RNGestureHandlerActionTypeReanimatedWorklet:
      [self sendEventForReanimated:event];
      break;

    case ABI49_0_0RNGestureHandlerActionTypeNativeAnimatedEvent:
      if ([event.eventName isEqualToString:@"onGestureHandlerEvent"]) {
        [self sendEventForNativeAnimatedEvent:event];
      } else {
        // Although onGestureEvent prop is an Animated.event with useNativeDriver: true,
        // onHandlerStateChange prop is still a regular JS function.
        // Also, Animated.event is only supported with old API.
        [self sendEventForJSFunctionOldAPI:event];
      }
      break;

    case ABI49_0_0RNGestureHandlerActionTypeJSFunctionOldAPI:
      [self sendEventForJSFunctionOldAPI:event];
      break;

    case ABI49_0_0RNGestureHandlerActionTypeJSFunctionNewAPI:
      [self sendEventForJSFunctionNewAPI:event];
      break;
  }
}

- (void)sendEventForReanimated:(ABI49_0_0RNGestureHandlerStateChange *)event
{
  // Delivers the event to Reanimated.
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  // Send event directly to Reanimated
  if (_reanimatedModule == nil) {
    _reanimatedModule = [_uiManager.bridge moduleForName:@"ReanimatedModule"];
  }

  [_reanimatedModule eventDispatcherWillDispatchEvent:event];
#else
  // In the old architecture, Reanimated overwrites ABI49_0_0RCTEventDispatcher
  // with ABI49_0_0REAEventDispatcher and intercepts all direct events.
  [self sendEventForDirectEvent:event];
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
}

- (void)sendEventForNativeAnimatedEvent:(ABI49_0_0RNGestureHandlerStateChange *)event
{
  // Delivers the event to NativeAnimatedModule.
  // Currently, NativeAnimated[Turbo]Module is ABI49_0_0RCTEventDispatcherObserver so we can
  // simply send a direct event which is handled by the observer but ignored on JS side.
  // TODO: send event directly to NativeAnimated[Turbo]Module
  [self sendEventForDirectEvent:event];
}

- (void)sendEventForJSFunctionOldAPI:(ABI49_0_0RNGestureHandlerStateChange *)event
{
  // Delivers the event to JS (old ABI49_0_0RNGH API).
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  [self sendEventForDeviceEvent:event];
#else
  [self sendEventForDirectEvent:event];
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
}

- (void)sendEventForJSFunctionNewAPI:(ABI49_0_0RNGestureHandlerStateChange *)event
{
  // Delivers the event to JS (new ABI49_0_0RNGH API).
  [self sendEventForDeviceEvent:event];
}

- (void)sendEventForDirectEvent:(ABI49_0_0RNGestureHandlerStateChange *)event
{
  // Delivers the event to JS as a direct event.
  [_eventDispatcher sendEvent:event];
}

- (void)sendEventForDeviceEvent:(ABI49_0_0RNGestureHandlerStateChange *)event
{
  // Delivers the event to JS as a device event.
  NSMutableDictionary *body = [[event arguments] objectAtIndex:2];
  [_eventDispatcher sendDeviceEventWithName:@"onGestureHandlerStateChange" body:body];
}

@end
