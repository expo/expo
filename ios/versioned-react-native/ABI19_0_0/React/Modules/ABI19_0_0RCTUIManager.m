/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTUIManager.h"

#import <AVFoundation/AVFoundation.h>

#import <YogaABI19_0_0/ABI19_0_0Yoga.h>

#import "ABI19_0_0RCTAccessibilityManager.h"
#import "ABI19_0_0RCTAnimationType.h"
#import "ABI19_0_0RCTAssert.h"
#import "ABI19_0_0RCTBridge+Private.h"
#import "ABI19_0_0RCTBridge.h"
#import "ABI19_0_0RCTComponent.h"
#import "ABI19_0_0RCTComponentData.h"
#import "ABI19_0_0RCTConvert.h"
#import "ABI19_0_0RCTDefines.h"
#import "ABI19_0_0RCTEventDispatcher.h"
#import "ABI19_0_0RCTLog.h"
#import "ABI19_0_0RCTModuleData.h"
#import "ABI19_0_0RCTModuleMethod.h"
#import "ABI19_0_0RCTProfile.h"
#import "ABI19_0_0RCTRootContentView.h"
#import "ABI19_0_0RCTRootShadowView.h"
#import "ABI19_0_0RCTRootViewInternal.h"
#import "ABI19_0_0RCTScrollableProtocol.h"
#import "ABI19_0_0RCTShadowView.h"
#import "ABI19_0_0RCTUIManagerObserverCoordinator.h"
#import "ABI19_0_0RCTUtils.h"
#import "ABI19_0_0RCTView.h"
#import "ABI19_0_0RCTViewManager.h"
#import "UIView+ReactABI19_0_0.h"

static void ABI19_0_0RCTTraverseViewNodes(id<ABI19_0_0RCTComponent> view, void (^block)(id<ABI19_0_0RCTComponent>))
{
  if (view.ReactABI19_0_0Tag) {
    block(view);

    for (id<ABI19_0_0RCTComponent> subview in view.ReactABI19_0_0Subviews) {
      ABI19_0_0RCTTraverseViewNodes(subview, block);
    }
  }
}

char *const ABI19_0_0RCTUIManagerQueueName = "com.facebook.ReactABI19_0_0.ShadowQueue";
NSString *const ABI19_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification = @"ABI19_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification";
NSString *const ABI19_0_0RCTUIManagerDidRegisterRootViewNotification = @"ABI19_0_0RCTUIManagerDidRegisterRootViewNotification";
NSString *const ABI19_0_0RCTUIManagerDidRemoveRootViewNotification = @"ABI19_0_0RCTUIManagerDidRemoveRootViewNotification";
NSString *const ABI19_0_0RCTUIManagerRootViewKey = @"ABI19_0_0RCTUIManagerRootViewKey";

@interface ABI19_0_0RCTAnimation : NSObject

@property (nonatomic, readonly) NSTimeInterval duration;
@property (nonatomic, readonly) NSTimeInterval delay;
@property (nonatomic, readonly, copy) NSString *property;
@property (nonatomic, readonly) CGFloat springDamping;
@property (nonatomic, readonly) CGFloat initialVelocity;
@property (nonatomic, readonly) ABI19_0_0RCTAnimationType animationType;

@end

static UIViewAnimationCurve _currentKeyboardAnimationCurve;

@implementation ABI19_0_0RCTAnimation

static UIViewAnimationOptions UIViewAnimationOptionsFromABI19_0_0RCTAnimationType(ABI19_0_0RCTAnimationType type)
{
  switch (type) {
    case ABI19_0_0RCTAnimationTypeLinear:
      return UIViewAnimationOptionCurveLinear;
    case ABI19_0_0RCTAnimationTypeEaseIn:
      return UIViewAnimationOptionCurveEaseIn;
    case ABI19_0_0RCTAnimationTypeEaseOut:
      return UIViewAnimationOptionCurveEaseOut;
    case ABI19_0_0RCTAnimationTypeEaseInEaseOut:
      return UIViewAnimationOptionCurveEaseInOut;
    case ABI19_0_0RCTAnimationTypeKeyboard:
      // http://stackoverflow.com/questions/18870447/how-to-use-the-default-ios7-uianimation-curve
      return (UIViewAnimationOptions)(_currentKeyboardAnimationCurve << 16);
    default:
      ABI19_0_0RCTLogError(@"Unsupported animation type %zd", type);
      return UIViewAnimationOptionCurveEaseInOut;
  }
}

// Use a custom initialization function rather than implementing `+initialize` so that we can control
// when the initialization code runs. `+initialize` runs immediately before the first message is sent
// to the class which may be too late for us. By this time, we may have missed some
// `UIKeyboardWillChangeFrameNotification`s.
+ (void)initializeStatics
{
#if !TARGET_OS_TV
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(keyboardWillChangeFrame:)
                                                name:UIKeyboardWillChangeFrameNotification
                                               object:nil];
  });
#endif
}

+ (void)keyboardWillChangeFrame:(NSNotification *)notification
{
#if !TARGET_OS_TV
  NSDictionary *userInfo = notification.userInfo;
  _currentKeyboardAnimationCurve = [userInfo[UIKeyboardAnimationCurveUserInfoKey] integerValue];
#endif
}

- (instancetype)initWithDuration:(NSTimeInterval)duration dictionary:(NSDictionary *)config
{
  if (!config) {
    return nil;
  }

  if ((self = [super init])) {
    _property = [ABI19_0_0RCTConvert NSString:config[@"property"]];

    _duration = [ABI19_0_0RCTConvert NSTimeInterval:config[@"duration"]] ?: duration;
    if (_duration > 0.0 && _duration < 0.01) {
      ABI19_0_0RCTLogError(@"ABI19_0_0RCTLayoutAnimation expects timings to be in ms, not seconds.");
      _duration = _duration * 1000.0;
    }

    _delay = [ABI19_0_0RCTConvert NSTimeInterval:config[@"delay"]];
    if (_delay > 0.0 && _delay < 0.01) {
      ABI19_0_0RCTLogError(@"ABI19_0_0RCTLayoutAnimation expects timings to be in ms, not seconds.");
      _delay = _delay * 1000.0;
    }

    _animationType = [ABI19_0_0RCTConvert ABI19_0_0RCTAnimationType:config[@"type"]];
    if (_animationType == ABI19_0_0RCTAnimationTypeSpring) {
      _springDamping = [ABI19_0_0RCTConvert CGFloat:config[@"springDamping"]];
      _initialVelocity = [ABI19_0_0RCTConvert CGFloat:config[@"initialVelocity"]];
    }
  }
  return self;
}

- (void)performAnimations:(void (^)(void))animations
      withCompletionBlock:(void (^)(BOOL completed))completionBlock
{
  if (_animationType == ABI19_0_0RCTAnimationTypeSpring) {

    [UIView animateWithDuration:_duration
                          delay:_delay
         usingSpringWithDamping:_springDamping
          initialSpringVelocity:_initialVelocity
                        options:UIViewAnimationOptionBeginFromCurrentState
                     animations:animations
                     completion:completionBlock];

  } else {

    UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState |
      UIViewAnimationOptionsFromABI19_0_0RCTAnimationType(_animationType);

    [UIView animateWithDuration:_duration
                          delay:_delay
                        options:options
                     animations:animations
                     completion:completionBlock];
  }
}

@end

@interface ABI19_0_0RCTLayoutAnimation : NSObject

@property (nonatomic, copy) NSDictionary *config;
@property (nonatomic, strong) ABI19_0_0RCTAnimation *createAnimation;
@property (nonatomic, strong) ABI19_0_0RCTAnimation *updateAnimation;
@property (nonatomic, strong) ABI19_0_0RCTAnimation *deleteAnimation;
@property (nonatomic, copy) ABI19_0_0RCTResponseSenderBlock callback;

@end

@implementation ABI19_0_0RCTLayoutAnimation

- (instancetype)initWithDictionary:(NSDictionary *)config callback:(ABI19_0_0RCTResponseSenderBlock)callback
{
  if (!config) {
    return nil;
  }

  if ((self = [super init])) {
    _config = [config copy];
    NSTimeInterval duration = [ABI19_0_0RCTConvert NSTimeInterval:config[@"duration"]];
    if (duration > 0.0 && duration < 0.01) {
      ABI19_0_0RCTLogError(@"ABI19_0_0RCTLayoutAnimation expects timings to be in ms, not seconds.");
      duration = duration * 1000.0;
    }

    _createAnimation = [[ABI19_0_0RCTAnimation alloc] initWithDuration:duration dictionary:config[@"create"]];
    _updateAnimation = [[ABI19_0_0RCTAnimation alloc] initWithDuration:duration dictionary:config[@"update"]];
    _deleteAnimation = [[ABI19_0_0RCTAnimation alloc] initWithDuration:duration dictionary:config[@"delete"]];
    _callback = callback;
  }
  return self;
}

@end

@implementation ABI19_0_0RCTUIManager
{
  // Root views are only mutated on the shadow queue
  NSMutableSet<NSNumber *> *_rootViewTags;
  NSMutableArray<ABI19_0_0RCTViewManagerUIBlock> *_pendingUIBlocks;

  // Animation
  ABI19_0_0RCTLayoutAnimation *_layoutAnimation; // Main thread only
  NSMutableSet<UIView *> *_viewsToBeDeleted; // Main thread only

  NSMutableDictionary<NSNumber *, ABI19_0_0RCTShadowView *> *_shadowViewRegistry; // ABI19_0_0RCT thread only
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry; // Main thread only

  // Keyed by viewName
  NSDictionary *_componentDataByName;

  NSMutableSet<id<ABI19_0_0RCTComponent>> *_bridgeTransactionListeners;
}

@synthesize bridge = _bridge;

ABI19_0_0RCT_EXPORT_MODULE()

- (void)didReceiveNewContentSizeMultiplier
{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateContentSizeMultiplier"
                                              body:@([_bridge.accessibilityManager multiplier])];
#pragma clang diagnostic pop

  dispatch_async(ABI19_0_0RCTGetUIManagerQueue(), ^{
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI19_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
                                                        object:self];
    [self setNeedsLayout];
  });
}

- (void)invalidate
{
  /**
   * Called on the JS Thread since all modules are invalidated on the JS thread
   */

  // This only accessed from the shadow queue
  _pendingUIBlocks = nil;

  dispatch_async(dispatch_get_main_queue(), ^{
    ABI19_0_0RCT_PROFILE_BEGIN_EVENT(ABI19_0_0RCTProfileTagAlways, @"UIManager invalidate", nil);
    for (NSNumber *rootViewTag in self->_rootViewTags) {
      [(id<ABI19_0_0RCTInvalidating>)self->_viewRegistry[rootViewTag] invalidate];
    }

    self->_rootViewTags = nil;
    self->_shadowViewRegistry = nil;
    self->_viewRegistry = nil;
    self->_bridgeTransactionListeners = nil;
    self->_bridge = nil;

    [[NSNotificationCenter defaultCenter] removeObserver:self];
    ABI19_0_0RCT_PROFILE_END_EVENT(ABI19_0_0RCTProfileTagAlways, @"");
  });
}

- (NSMutableDictionary<NSNumber *, ABI19_0_0RCTShadowView *> *)shadowViewRegistry
{
  // NOTE: this method only exists so that it can be accessed by unit tests
  if (!_shadowViewRegistry) {
    _shadowViewRegistry = [NSMutableDictionary new];
  }
  return _shadowViewRegistry;
}

- (NSMutableDictionary<NSNumber *, UIView *> *)viewRegistry
{
  // NOTE: this method only exists so that it can be accessed by unit tests
  if (!_viewRegistry) {
    _viewRegistry = [NSMutableDictionary new];
  }
  return _viewRegistry;
}

- (void)setBridge:(ABI19_0_0RCTBridge *)bridge
{
  ABI19_0_0RCTAssert(_bridge == nil, @"Should not re-use same UIIManager instance");

  _bridge = bridge;

  _shadowViewRegistry = [NSMutableDictionary new];
  _viewRegistry = [NSMutableDictionary new];

  // Internal resources
  _pendingUIBlocks = [NSMutableArray new];
  _rootViewTags = [NSMutableSet new];

  _bridgeTransactionListeners = [NSMutableSet new];
  _observerCoordinator = [ABI19_0_0RCTUIManagerObserverCoordinator new];

  _viewsToBeDeleted = [NSMutableSet new];

  // Get view managers from bridge
  NSMutableDictionary *componentDataByName = [NSMutableDictionary new];
  for (Class moduleClass in _bridge.moduleClasses) {
    if ([moduleClass isSubclassOfClass:[ABI19_0_0RCTViewManager class]]) {
      ABI19_0_0RCTComponentData *componentData = [[ABI19_0_0RCTComponentData alloc] initWithManagerClass:moduleClass
                                                                                bridge:_bridge];
      componentDataByName[componentData.name] = componentData;
    }
  }

  _componentDataByName = [componentDataByName copy];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:ABI19_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
  [ABI19_0_0RCTAnimation initializeStatics];
}

dispatch_queue_t ABI19_0_0RCTGetUIManagerQueue(void)
{
  static dispatch_queue_t shadowQueue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if ([NSOperation instancesRespondToSelector:@selector(qualityOfService)]) {
      dispatch_queue_attr_t attr = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, 0);
      shadowQueue = dispatch_queue_create(ABI19_0_0RCTUIManagerQueueName, attr);
    } else {
      shadowQueue = dispatch_queue_create(ABI19_0_0RCTUIManagerQueueName, DISPATCH_QUEUE_SERIAL);
      dispatch_set_target_queue(shadowQueue, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0));
    }
  });
  return shadowQueue;
}

BOOL ABI19_0_0RCTIsUIManagerQueue()
{
  static void *queueKey = &queueKey;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_set_specific(ABI19_0_0RCTGetUIManagerQueue(), queueKey, queueKey, NULL);
  });
  return dispatch_get_specific(queueKey) == queueKey;
}

- (dispatch_queue_t)methodQueue
{
  return ABI19_0_0RCTGetUIManagerQueue();
}

- (void)registerRootView:(ABI19_0_0RCTRootContentView *)rootView
{
  ABI19_0_0RCTAssertMainQueue();

  NSNumber *ReactABI19_0_0Tag = rootView.ReactABI19_0_0Tag;
  ABI19_0_0RCTAssert(ABI19_0_0RCTIsReactABI19_0_0RootView(ReactABI19_0_0Tag),
            @"View %@ with tag #%@ is not a root view", rootView, ReactABI19_0_0Tag);

  UIView *existingView = _viewRegistry[ReactABI19_0_0Tag];
  ABI19_0_0RCTAssert(existingView == nil || existingView == rootView,
            @"Expect all root views to have unique tag. Added %@ twice", ReactABI19_0_0Tag);

  CGSize availableSize = rootView.availableSize;

  // Register view
  _viewRegistry[ReactABI19_0_0Tag] = rootView;

  // Register shadow view
  dispatch_async(ABI19_0_0RCTGetUIManagerQueue(), ^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI19_0_0RCTRootShadowView *shadowView = [ABI19_0_0RCTRootShadowView new];
    shadowView.availableSize = availableSize;
    shadowView.ReactABI19_0_0Tag = ReactABI19_0_0Tag;
    shadowView.backgroundColor = rootView.backgroundColor;
    shadowView.viewName = NSStringFromClass([rootView class]);
    self->_shadowViewRegistry[shadowView.ReactABI19_0_0Tag] = shadowView;
    [self->_rootViewTags addObject:ReactABI19_0_0Tag];
  });

  [[NSNotificationCenter defaultCenter] postNotificationName:ABI19_0_0RCTUIManagerDidRegisterRootViewNotification
                                                      object:self
                                                    userInfo:@{ABI19_0_0RCTUIManagerRootViewKey: rootView}];
}

- (NSString *)viewNameForReactABI19_0_0Tag:(NSNumber *)ReactABI19_0_0Tag
{
  ABI19_0_0RCTAssertThread(ABI19_0_0RCTGetUIManagerQueue(), @"viewNameForReactABI19_0_0Tag can only be called from the shadow queue");
  return _shadowViewRegistry[ReactABI19_0_0Tag].viewName;
}

- (UIView *)viewForReactABI19_0_0Tag:(NSNumber *)ReactABI19_0_0Tag
{
  ABI19_0_0RCTAssertMainQueue();
  return _viewRegistry[ReactABI19_0_0Tag];
}

- (ABI19_0_0RCTShadowView *)shadowViewForReactABI19_0_0Tag:(NSNumber *)ReactABI19_0_0Tag
{
  ABI19_0_0RCTAssertUIManagerQueue();
  return _shadowViewRegistry[ReactABI19_0_0Tag];
}

- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView
{
  ABI19_0_0RCTAssertMainQueue();
  NSNumber *ReactABI19_0_0Tag = rootView.ReactABI19_0_0Tag;
  dispatch_async(ABI19_0_0RCTGetUIManagerQueue(), ^{
    ABI19_0_0RCTRootShadowView *shadowView = (ABI19_0_0RCTRootShadowView *)self->_shadowViewRegistry[ReactABI19_0_0Tag];
    ABI19_0_0RCTAssert(shadowView != nil, @"Could not locate shadow view with tag #%@", ReactABI19_0_0Tag);
    ABI19_0_0RCTAssert([shadowView isKindOfClass:[ABI19_0_0RCTRootShadowView class]], @"Located shadow view (with tag #%@) is actually not root view.", ReactABI19_0_0Tag);

    if (CGSizeEqualToSize(availableSize, shadowView.availableSize)) {
      return;
    }

    shadowView.availableSize = availableSize;
    [self setNeedsLayout];
  });
}

- (void)setSize:(CGSize)size forView:(UIView *)view
{
  ABI19_0_0RCTAssertMainQueue();

  NSNumber *ReactABI19_0_0Tag = view.ReactABI19_0_0Tag;
  dispatch_async(ABI19_0_0RCTGetUIManagerQueue(), ^{
    ABI19_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI19_0_0Tag];
    ABI19_0_0RCTAssert(shadowView != nil, @"Could not locate shadow view with tag #%@", ReactABI19_0_0Tag);

    if (CGSizeEqualToSize(size, shadowView.size)) {
      return;
    }

    shadowView.size = size;
    [self setNeedsLayout];
  });
}

- (void)setIntrinsicContentSize:(CGSize)size forView:(UIView *)view
{
  ABI19_0_0RCTAssertMainQueue();

  NSNumber *ReactABI19_0_0Tag = view.ReactABI19_0_0Tag;
  dispatch_async(ABI19_0_0RCTGetUIManagerQueue(), ^{
    ABI19_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI19_0_0Tag];
    ABI19_0_0RCTAssert(shadowView != nil, @"Could not locate view with tag #%@", ReactABI19_0_0Tag);

    if (!CGSizeEqualToSize(shadowView.intrinsicContentSize, size)) {
      shadowView.intrinsicContentSize = size;
      [self setNeedsLayout];
    }
  });
}

- (void)setBackgroundColor:(UIColor *)color forView:(UIView *)view
{
  ABI19_0_0RCTAssertMainQueue();

  NSNumber *ReactABI19_0_0Tag = view.ReactABI19_0_0Tag;
  dispatch_async(ABI19_0_0RCTGetUIManagerQueue(), ^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI19_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI19_0_0Tag];
    ABI19_0_0RCTAssert(shadowView != nil, @"Could not locate root view with tag #%@", ReactABI19_0_0Tag);
    shadowView.backgroundColor = color;
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:shadowView];
    [self flushUIBlocks];
  });
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray<id<ABI19_0_0RCTComponent>> *)children
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *)registry
{
  for (id<ABI19_0_0RCTComponent> child in children) {
    ABI19_0_0RCTTraverseViewNodes(registry[child.ReactABI19_0_0Tag], ^(id<ABI19_0_0RCTComponent> subview) {
      ABI19_0_0RCTAssert(![subview isReactABI19_0_0RootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(ABI19_0_0RCTInvalidating)]) {
        [(id<ABI19_0_0RCTInvalidating>)subview invalidate];
      }
      [registry removeObjectForKey:subview.ReactABI19_0_0Tag];

      if (registry == (NSMutableDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *)self->_viewRegistry) {
        [self->_bridgeTransactionListeners removeObject:subview];
      }
    });
  }
}

- (void)addUIBlock:(ABI19_0_0RCTViewManagerUIBlock)block
{
  ABI19_0_0RCTAssertThread(ABI19_0_0RCTGetUIManagerQueue(),
                  @"-[ABI19_0_0RCTUIManager addUIBlock:] should only be called from the "
                  "UIManager's queue (get this using `ABI19_0_0RCTGetUIManagerQueue()`)");

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks addObject:block];
}

- (void)prependUIBlock:(ABI19_0_0RCTViewManagerUIBlock)block
{
  ABI19_0_0RCTAssertThread(ABI19_0_0RCTGetUIManagerQueue(),
                  @"-[ABI19_0_0RCTUIManager prependUIBlock:] should only be called from the "
                  "UIManager's queue (get this using `ABI19_0_0RCTGetUIManagerQueue()`)");

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks insertObject:block atIndex:0];
}

- (ABI19_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI19_0_0RCTRootShadowView *)rootShadowView
{
  ABI19_0_0RCTAssert(!ABI19_0_0RCTIsMainQueue(), @"Should be called on shadow queue");

  // This is nuanced. In the JS thread, we create a new update buffer
  // `frameTags`/`frames` that is created/mutated in the JS thread. We access
  // these structures in the UI-thread block. `NSMutableArray` is not thread
  // safe so we rely on the fact that we never mutate it after it's passed to
  // the main thread.
  NSSet<ABI19_0_0RCTShadowView *> *viewsWithNewFrames = [rootShadowView collectViewsWithUpdatedFrames];

  if (!viewsWithNewFrames.count) {
    // no frame change results in no UI update block
    return nil;
  }

  typedef struct {
    CGRect frame;
    UIUserInterfaceLayoutDirection layoutDirection;
    BOOL isNew;
    BOOL parentIsNew;
    BOOL isHidden;
  } ABI19_0_0RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = viewsWithNewFrames.count;
  NSMutableArray *ReactABI19_0_0Tags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(ABI19_0_0RCTFrameData) * count];
  {
    NSUInteger index = 0;
    ABI19_0_0RCTFrameData *frameDataArray = (ABI19_0_0RCTFrameData *)framesData.mutableBytes;
    for (ABI19_0_0RCTShadowView *shadowView in viewsWithNewFrames) {
      ReactABI19_0_0Tags[index] = shadowView.ReactABI19_0_0Tag;
      frameDataArray[index++] = (ABI19_0_0RCTFrameData){
        shadowView.frame,
        shadowView.effectiveLayoutDirection,
        shadowView.isNewView,
        shadowView.superview.isNewView,
        shadowView.isHidden,
      };
    }
  }

  // These are blocks to be executed on each view, immediately after
  // ReactABI19_0_0SetFrame: has been called. Note that if ReactABI19_0_0SetFrame: is not called,
  // these won't be called either, so this is not a suitable place to update
  // properties that aren't related to layout.
  NSMutableDictionary<NSNumber *, ABI19_0_0RCTViewManagerUIBlock> *updateBlocks =
  [NSMutableDictionary new];
  for (ABI19_0_0RCTShadowView *shadowView in viewsWithNewFrames) {

    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *ReactABI19_0_0Tag = shadowView.ReactABI19_0_0Tag;
    ABI19_0_0RCTViewManager *manager = [_componentDataByName[shadowView.viewName] manager];
    ABI19_0_0RCTViewManagerUIBlock block = [manager uiBlockToAmendWithShadowView:shadowView];
    if (block) {
      updateBlocks[ReactABI19_0_0Tag] = block;
    }

    if (shadowView.onLayout) {
      CGRect frame = shadowView.frame;
      shadowView.onLayout(@{
        @"layout": @{
          @"x": @(frame.origin.x),
          @"y": @(frame.origin.y),
          @"width": @(frame.size.width),
          @"height": @(frame.size.height),
        },
      });
    }

    if (ABI19_0_0RCTIsReactABI19_0_0RootView(ReactABI19_0_0Tag)) {
      CGSize contentSize = shadowView.frame.size;

      dispatch_async(dispatch_get_main_queue(), ^{
        UIView *view = self->_viewRegistry[ReactABI19_0_0Tag];
        ABI19_0_0RCTAssert(view != nil, @"view (for ID %@) not found", ReactABI19_0_0Tag);

        ABI19_0_0RCTRootView *rootView = (ABI19_0_0RCTRootView *)[view superview];
        rootView.intrinsicContentSize = contentSize;
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    const ABI19_0_0RCTFrameData *frameDataArray = (const ABI19_0_0RCTFrameData *)framesData.bytes;
    ABI19_0_0RCTLayoutAnimation *layoutAnimation = uiManager->_layoutAnimation;

    __block NSUInteger completionsCalled = 0;

    NSInteger index = 0;
    for (NSNumber *ReactABI19_0_0Tag in ReactABI19_0_0Tags) {
      ABI19_0_0RCTFrameData frameData = frameDataArray[index++];

      UIView *view = viewRegistry[ReactABI19_0_0Tag];
      CGRect frame = frameData.frame;

      BOOL isHidden = frameData.isHidden;
      UIUserInterfaceLayoutDirection layoutDirection = frameData.layoutDirection;
      BOOL isNew = frameData.isNew;
      ABI19_0_0RCTAnimation *updateAnimation = isNew ? nil : layoutAnimation.updateAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      ABI19_0_0RCTAnimation *createAnimation = shouldAnimateCreation ? layoutAnimation.createAnimation : nil;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (layoutAnimation.callback && completionsCalled == count) {
          layoutAnimation.callback(@[@(finished)]);

          // It's unsafe to call this callback more than once, so we nil it out here
          // to make sure that doesn't happen.
          layoutAnimation.callback = nil;
        }
      };

      if (view.isHidden != isHidden) {
        view.hidden = isHidden;
      }

      if (view.ReactABI19_0_0LayoutDirection != layoutDirection) {
        view.ReactABI19_0_0LayoutDirection = layoutDirection;
      }

      ABI19_0_0RCTViewManagerUIBlock updateBlock = updateBlocks[ReactABI19_0_0Tag];
      if (createAnimation) {

        // Animate view creation
        [view ReactABI19_0_0SetFrame:frame];

        CATransform3D finalTransform = view.layer.transform;
        CGFloat finalOpacity = view.layer.opacity;

        NSString *property = createAnimation.property;
        if ([property isEqualToString:@"scaleXY"]) {
          view.layer.transform = CATransform3DMakeScale(0, 0, 0);
        } else if ([property isEqualToString:@"opacity"]) {
          view.layer.opacity = 0.0;
        } else {
          ABI19_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
                      createAnimation.property);
        }

        [createAnimation performAnimations:^{
          if ([property isEqualToString:@"scaleXY"]) {
            view.layer.transform = finalTransform;
          } else if ([property isEqualToString:@"opacity"]) {
            view.layer.opacity = finalOpacity;
          }
          if (updateBlock) {
            updateBlock(self, viewRegistry);
          }
        } withCompletionBlock:completion];

      } else if (updateAnimation) {

        // Animate view update
        [updateAnimation performAnimations:^{
          [view ReactABI19_0_0SetFrame:frame];
          if (updateBlock) {
            updateBlock(self, viewRegistry);
          }
        } withCompletionBlock:completion];

      } else {

        // Update without animation
        [view ReactABI19_0_0SetFrame:frame];
        if (updateBlock) {
          updateBlock(self, viewRegistry);
        }
        completion(YES);
      }
    }

    // Clean up
    uiManager->_layoutAnimation = nil;
  };
}

- (void)_amendPendingUIBlocksWithStylePropagationUpdateForShadowView:(ABI19_0_0RCTShadowView *)topView
{
  NSMutableSet<ABI19_0_0RCTApplierBlock> *applierBlocks = [NSMutableSet setWithCapacity:1];
  [topView collectUpdatedProperties:applierBlocks parentProperties:@{}];

  if (applierBlocks.count) {
    [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      for (ABI19_0_0RCTApplierBlock block in applierBlocks) {
        block(viewRegistry);
      }
    }];
  }
}

/**
 * A method to be called from JS, which takes a container ID and then releases
 * all subviews for that container upon receipt.
 */
ABI19_0_0RCT_EXPORT_METHOD(removeSubviewsFromContainerWithID:(nonnull NSNumber *)containerID)
{
  id<ABI19_0_0RCTComponent> container = _shadowViewRegistry[containerID];
  ABI19_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", containerID);

  NSUInteger subviewsCount = [container ReactABI19_0_0Subviews].count;
  NSMutableArray<NSNumber *> *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
  for (NSUInteger childIndex = 0; childIndex < subviewsCount; childIndex++) {
    [indices addObject:@(childIndex)];
  }

  [self manageChildren:containerID
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI19_0_0Tags:nil
          addAtIndices:nil
       removeAtIndices:indices];
}

/**
 * Disassociates children from container. Doesn't remove from registries.
 * TODO: use [NSArray getObjects:buffer] to reuse same fast buffer each time.
 *
 * @returns Array of removed items.
 */
- (NSArray<id<ABI19_0_0RCTComponent>> *)_childrenToRemoveFromContainer:(id<ABI19_0_0RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if (atIndices.count == 0 || [container ReactABI19_0_0Subviews].count == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray<id<ABI19_0_0RCTComponent>> *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  ABI19_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSNumber *indexNumber in atIndices) {
    NSUInteger index = indexNumber.unsignedIntegerValue;
    if (index < [container ReactABI19_0_0Subviews].count) {
      [removedChildren addObject:[container ReactABI19_0_0Subviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    NSString *message = [NSString stringWithFormat:@"removedChildren count (%tu) was not what we expected (%tu)",
                         removedChildren.count, atIndices.count];
    ABI19_0_0RCTFatal(ABI19_0_0RCTErrorWithMessage(message));
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray<id<ABI19_0_0RCTComponent>> *)children
          fromContainer:(id<ABI19_0_0RCTComponent>)container
{
  for (id<ABI19_0_0RCTComponent> removedChild in children) {
    [container removeReactABI19_0_0Subview:removedChild];
  }
}

/**
 * Remove subviews from their parent with an animation.
 */
- (void)_removeChildren:(NSArray<UIView *> *)children
          fromContainer:(UIView *)container
          withAnimation:(ABI19_0_0RCTLayoutAnimation *)animation
{
  ABI19_0_0RCTAssertMainQueue();
  ABI19_0_0RCTAnimation *deleteAnimation = animation.deleteAnimation;

  __block NSUInteger completionsCalled = 0;
  for (UIView *removedChild in children) {

    void (^completion)(BOOL) = ^(BOOL finished) {
      completionsCalled++;

      [self->_viewsToBeDeleted removeObject:removedChild];
      [container removeReactABI19_0_0Subview:removedChild];

      if (animation.callback && completionsCalled == children.count) {
        animation.callback(@[@(finished)]);

        // It's unsafe to call this callback more than once, so we nil it out here
        // to make sure that doesn't happen.
        animation.callback = nil;
      }
    };

    [_viewsToBeDeleted addObject:removedChild];

    // Disable user interaction while the view is animating since JS won't receive
    // the view events anyway.
    removedChild.userInteractionEnabled = NO;

    NSString *property = deleteAnimation.property;
    [deleteAnimation performAnimations:^{
      if ([property isEqualToString:@"scaleXY"]) {
        removedChild.layer.transform = CATransform3DMakeScale(0.001, 0.001, 0.001);
      } else if ([property isEqualToString:@"opacity"]) {
        removedChild.layer.opacity = 0.0;
      } else {
        ABI19_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
                    deleteAnimation.property);
      }
    } withCompletionBlock:completion];
  }
}


ABI19_0_0RCT_EXPORT_METHOD(removeRootView:(nonnull NSNumber *)rootReactABI19_0_0Tag)
{
  ABI19_0_0RCTShadowView *rootShadowView = _shadowViewRegistry[rootReactABI19_0_0Tag];
  ABI19_0_0RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootReactABI19_0_0Tag);
  [self _purgeChildren:(NSArray<id<ABI19_0_0RCTComponent>> *)rootShadowView.ReactABI19_0_0Subviews
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *)_shadowViewRegistry];
  [_shadowViewRegistry removeObjectForKey:rootReactABI19_0_0Tag];
  [_rootViewTags removeObject:rootReactABI19_0_0Tag];

  [self addUIBlock:^(ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    ABI19_0_0RCTAssertMainQueue();
    UIView *rootView = viewRegistry[rootReactABI19_0_0Tag];
    [uiManager _purgeChildren:(NSArray<id<ABI19_0_0RCTComponent>> *)rootView.ReactABI19_0_0Subviews
                 fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *)viewRegistry];
    [(NSMutableDictionary *)viewRegistry removeObjectForKey:rootReactABI19_0_0Tag];

    [[NSNotificationCenter defaultCenter] postNotificationName:ABI19_0_0RCTUIManagerDidRemoveRootViewNotification
                                                        object:uiManager
                                                      userInfo:@{ABI19_0_0RCTUIManagerRootViewKey: rootView}];
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(replaceExistingNonRootView:(nonnull NSNumber *)ReactABI19_0_0Tag
                  withView:(nonnull NSNumber *)newReactABI19_0_0Tag)
{
  ABI19_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI19_0_0Tag];
  ABI19_0_0RCTAssert(shadowView != nil, @"shadowView (for ID %@) not found", ReactABI19_0_0Tag);

  ABI19_0_0RCTShadowView *superShadowView = shadowView.superview;
  if (!superShadowView) {
    ABI19_0_0RCTAssert(NO, @"shadowView super (of ID %@) not found", ReactABI19_0_0Tag);
    return;
  }

  NSUInteger indexOfView = [superShadowView.ReactABI19_0_0Subviews indexOfObject:shadowView];
  ABI19_0_0RCTAssert(indexOfView != NSNotFound, @"View's superview doesn't claim it as subview (id %@)", ReactABI19_0_0Tag);
  NSArray<NSNumber *> *removeAtIndices = @[@(indexOfView)];
  NSArray<NSNumber *> *addTags = @[newReactABI19_0_0Tag];
  [self manageChildren:superShadowView.ReactABI19_0_0Tag
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI19_0_0Tags:addTags
          addAtIndices:removeAtIndices
       removeAtIndices:removeAtIndices];
}

ABI19_0_0RCT_EXPORT_METHOD(setChildren:(nonnull NSNumber *)containerTag
                  ReactABI19_0_0Tags:(NSArray<NSNumber *> *)ReactABI19_0_0Tags)
{
  ABI19_0_0RCTSetChildren(containerTag, ReactABI19_0_0Tags,
                 (NSDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *)_shadowViewRegistry);

  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){

    ABI19_0_0RCTSetChildren(containerTag, ReactABI19_0_0Tags,
                   (NSDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *)viewRegistry);
  }];
}

static void ABI19_0_0RCTSetChildren(NSNumber *containerTag,
                           NSArray<NSNumber *> *ReactABI19_0_0Tags,
                           NSDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *registry)
{
  id<ABI19_0_0RCTComponent> container = registry[containerTag];
  NSInteger index = 0;
  for (NSNumber *ReactABI19_0_0Tag in ReactABI19_0_0Tags) {
    id<ABI19_0_0RCTComponent> view = registry[ReactABI19_0_0Tag];
    if (view) {
      [container insertReactABI19_0_0Subview:view atIndex:index++];
    }
  }
}

ABI19_0_0RCT_EXPORT_METHOD(manageChildren:(nonnull NSNumber *)containerTag
                  moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
                  moveToIndices:(NSArray<NSNumber *> *)moveToIndices
                  addChildReactABI19_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI19_0_0Tags
                  addAtIndices:(NSArray<NSNumber *> *)addAtIndices
                  removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices)
{
  [self _manageChildren:containerTag
        moveFromIndices:moveFromIndices
          moveToIndices:moveToIndices
      addChildReactABI19_0_0Tags:addChildReactABI19_0_0Tags
           addAtIndices:addAtIndices
        removeAtIndices:removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *)_shadowViewRegistry];

  [self addUIBlock:^(ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    [uiManager _manageChildren:containerTag
               moveFromIndices:moveFromIndices
                 moveToIndices:moveToIndices
             addChildReactABI19_0_0Tags:addChildReactABI19_0_0Tags
                  addAtIndices:addAtIndices
               removeAtIndices:removeAtIndices
                      registry:(NSMutableDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *)viewRegistry];
  }];
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildReactABI19_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI19_0_0Tags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI19_0_0RCTComponent>> *)registry
{
  id<ABI19_0_0RCTComponent> container = registry[containerTag];
  ABI19_0_0RCTAssert(moveFromIndices.count == moveToIndices.count, @"moveFromIndices had size %tu, moveToIndices had size %tu", moveFromIndices.count, moveToIndices.count);
  ABI19_0_0RCTAssert(addChildReactABI19_0_0Tags.count == addAtIndices.count, @"there should be at least one ReactABI19_0_0 child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray<id<ABI19_0_0RCTComponent>> *permanentlyRemovedChildren =
    [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
  NSArray<id<ABI19_0_0RCTComponent>> *temporarilyRemovedChildren =
    [self _childrenToRemoveFromContainer:container atIndices:moveFromIndices];

  BOOL isUIViewRegistry = ((id)registry == (id)_viewRegistry);
  if (isUIViewRegistry && _layoutAnimation.deleteAnimation) {
    [self _removeChildren:(NSArray<UIView *> *)permanentlyRemovedChildren
            fromContainer:(UIView *)container
            withAnimation:_layoutAnimation];
  } else {
    [self _removeChildren:permanentlyRemovedChildren fromContainer:container];
  }

  [self _removeChildren:temporarilyRemovedChildren fromContainer:container];
  [self _purgeChildren:permanentlyRemovedChildren fromRegistry:registry];

  // Figure out what to insert - merge temporary inserts and adds
  NSMutableDictionary *destinationsToChildrenToAdd = [NSMutableDictionary dictionary];
  for (NSInteger index = 0, length = temporarilyRemovedChildren.count; index < length; index++) {
    destinationsToChildrenToAdd[moveToIndices[index]] = temporarilyRemovedChildren[index];
  }
  for (NSInteger index = 0, length = addAtIndices.count; index < length; index++) {
    id<ABI19_0_0RCTComponent> view = registry[addChildReactABI19_0_0Tags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray<NSNumber *> *sortedIndices =
    [destinationsToChildrenToAdd.allKeys sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *ReactABI19_0_0Index in sortedIndices) {
    NSInteger insertAtIndex = ReactABI19_0_0Index.integerValue;

    // When performing a delete animation, views are not removed immediately
    // from their container so we need to offset the insertion index if a view
    // that will be removed appears earlier than the view we are inserting.
    if (isUIViewRegistry && _viewsToBeDeleted.count > 0) {
      for (NSInteger index = 0; index < insertAtIndex; index++) {
        UIView *subview = ((UIView *)container).ReactABI19_0_0Subviews[index];
        if ([_viewsToBeDeleted containsObject:subview]) {
          insertAtIndex++;
        }
      }
    }

    [container insertReactABI19_0_0Subview:destinationsToChildrenToAdd[ReactABI19_0_0Index]
                          atIndex:insertAtIndex];
  }
}

ABI19_0_0RCT_EXPORT_METHOD(createView:(nonnull NSNumber *)ReactABI19_0_0Tag
                  viewName:(NSString *)viewName
                  rootTag:(__unused NSNumber *)rootTag
                  props:(NSDictionary *)props)
{
  ABI19_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  if (componentData == nil) {
    ABI19_0_0RCTLogError(@"No component found for view with name \"%@\"", viewName);
  }

  // Register shadow view
  ABI19_0_0RCTShadowView *shadowView = [componentData createShadowViewWithTag:ReactABI19_0_0Tag];
  if (shadowView) {
    [componentData setProps:props forShadowView:shadowView];
    _shadowViewRegistry[ReactABI19_0_0Tag] = shadowView;
  }

  // Shadow view is the source of truth for background color this is a little
  // bit counter-intuitive if people try to set background color when setting up
  // the view, but it's the only way that makes sense given our threading model
  UIColor *backgroundColor = shadowView.backgroundColor;

  // Dispatch view creation directly to the main thread instead of adding to
  // UIBlocks array. This way, it doesn't get deferred until after layout.
  __weak ABI19_0_0RCTUIManager *weakManager = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI19_0_0RCTUIManager *uiManager = weakManager;
    if (!uiManager) {
      return;
    }
    UIView *view = [componentData createViewWithTag:ReactABI19_0_0Tag];
    if (view) {
      [componentData setProps:props forView:view]; // Must be done before bgColor to prevent wrong default
      if ([view respondsToSelector:@selector(setBackgroundColor:)]) {
        ((UIView *)view).backgroundColor = backgroundColor;
      }
      if ([view respondsToSelector:@selector(ReactABI19_0_0BridgeDidFinishTransaction)]) {
        [uiManager->_bridgeTransactionListeners addObject:view];
      }
      uiManager->_viewRegistry[ReactABI19_0_0Tag] = view;

#if ABI19_0_0RCT_DEV
      [view _DEBUG_setReactABI19_0_0ShadowView:shadowView];
#endif
    }
  });
}

ABI19_0_0RCT_EXPORT_METHOD(updateView:(nonnull NSNumber *)ReactABI19_0_0Tag
                  viewName:(NSString *)viewName // not always reliable, use shadowView.viewName if available
                  props:(NSDictionary *)props)
{
  ABI19_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI19_0_0Tag];
  ABI19_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName ?: viewName];
  [componentData setProps:props forShadowView:shadowView];

  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI19_0_0Tag];
    [componentData setProps:props forView:view];
  }];
}

- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)ReactABI19_0_0Tag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props
{
  ABI19_0_0RCTAssertMainQueue();
  ABI19_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  UIView *view = _viewRegistry[ReactABI19_0_0Tag];
  [componentData setProps:props forView:view];
}

ABI19_0_0RCT_EXPORT_METHOD(focus:(nonnull NSNumber *)ReactABI19_0_0Tag)
{
  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *newResponder = viewRegistry[ReactABI19_0_0Tag];
    [newResponder ReactABI19_0_0Focus];
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(blur:(nonnull NSNumber *)ReactABI19_0_0Tag)
{
  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *currentResponder = viewRegistry[ReactABI19_0_0Tag];
    [currentResponder ReactABI19_0_0Blur];
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(findSubviewIn:(nonnull NSNumber *)ReactABI19_0_0Tag atPoint:(CGPoint)point callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI19_0_0Tag];
    UIView *target = [view hitTest:point withEvent:nil];
    CGRect frame = [target convertRect:target.bounds toView:view];

    while (target.ReactABI19_0_0Tag == nil && target.superview != nil) {
      target = target.superview;
    }

    callback(@[
      ABI19_0_0RCTNullIfNil(target.ReactABI19_0_0Tag),
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
    ]);
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(dispatchViewManagerCommand:(nonnull NSNumber *)ReactABI19_0_0Tag
                  commandID:(NSInteger)commandID
                  commandArgs:(NSArray<id> *)commandArgs)
{
  ABI19_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI19_0_0Tag];
  ABI19_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName];
  Class managerClass = componentData.managerClass;
  ABI19_0_0RCTModuleData *moduleData = [_bridge moduleDataForName:ABI19_0_0RCTBridgeModuleNameForClass(managerClass)];
  id<ABI19_0_0RCTBridgeMethod> method = moduleData.methods[commandID];

  NSArray *args = [@[ReactABI19_0_0Tag] arrayByAddingObjectsFromArray:commandArgs];
  [method invokeWithBridge:_bridge module:componentData.manager arguments:args];
}

- (void)partialBatchDidFlush
{
  if (self.unsafeFlushUIChangesBeforeBatchEnds) {
    [self flushUIBlocks];
  }
}

- (void)batchDidComplete
{
  [self _layoutAndMount];
}

/**
 * Sets up animations, computes layout, creates UI mounting blocks for computed layout,
 * runs these blocks and all other already existing blocks.
 */
- (void)_layoutAndMount
{
  // Gather blocks to be executed now that all view hierarchy manipulations have
  // been completed (note that these may still take place before layout has finished)
  for (ABI19_0_0RCTComponentData *componentData in _componentDataByName.allValues) {
    ABI19_0_0RCTViewManagerUIBlock uiBlock = [componentData uiBlockToAmendWithShadowViewRegistry:_shadowViewRegistry];
    [self addUIBlock:uiBlock];
  }

  [_observerCoordinator uiManagerWillPerformLayout:self];

  // Perform layout
  for (NSNumber *ReactABI19_0_0Tag in _rootViewTags) {
    ABI19_0_0RCTRootShadowView *rootView = (ABI19_0_0RCTRootShadowView *)_shadowViewRegistry[ReactABI19_0_0Tag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
  }

  [_observerCoordinator uiManagerDidPerformLayout:self];

  // Properies propagation
  for (NSNumber *ReactABI19_0_0Tag in _rootViewTags) {
    ABI19_0_0RCTRootShadowView *rootView = (ABI19_0_0RCTRootShadowView *)_shadowViewRegistry[ReactABI19_0_0Tag];
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:rootView];
  }

  [self addUIBlock:^(ABI19_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    /**
     * TODO(tadeu): Remove it once and for all
     */
    for (id<ABI19_0_0RCTComponent> node in uiManager->_bridgeTransactionListeners) {
      [node ReactABI19_0_0BridgeDidFinishTransaction];
    }
  }];

  [_observerCoordinator uiManagerWillFlushUIBlocks:self];

  [self flushUIBlocks];
}

- (void)flushUIBlocks
{
  ABI19_0_0RCTAssertThread(ABI19_0_0RCTGetUIManagerQueue(),
                  @"flushUIBlocks can only be called from the shadow queue");

  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  NSArray<ABI19_0_0RCTViewManagerUIBlock> *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [NSMutableArray new];

  if (previousPendingUIBlocks.count) {
    // Execute the previously queued UI blocks
    ABI19_0_0RCTProfileBeginFlowEvent();
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI19_0_0RCTProfileEndFlowEvent();
      ABI19_0_0RCT_PROFILE_BEGIN_EVENT(ABI19_0_0RCTProfileTagAlways, @"-[UIManager flushUIBlocks]", (@{
        @"count": [@(previousPendingUIBlocks.count) stringValue],
      }));
      @try {
        for (ABI19_0_0RCTViewManagerUIBlock block in previousPendingUIBlocks) {
          block(self, self->_viewRegistry);
        }
      }
      @catch (NSException *exception) {
        ABI19_0_0RCTLogError(@"Exception thrown while executing UI block: %@", exception);
      }
      ABI19_0_0RCT_PROFILE_END_EVENT(ABI19_0_0RCTProfileTagAlways, @"");
    });
  }
}

- (void)setNeedsLayout
{
  // If there is an active batch layout will happen when batch finished, so we will wait for that.
  // Otherwise we immidiately trigger layout.
  if (![_bridge isBatchActive] && ![_bridge isLoading]) {
    [self _layoutAndMount];
  }
}

ABI19_0_0RCT_EXPORT_METHOD(measure:(nonnull NSNumber *)ReactABI19_0_0Tag
                  callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI19_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI19_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI19_0_0Tag);
      callback(@[]);
      return;
    }

    // If in a <Modal>, rootView will be the root of the modal container.
    UIView *rootView = view;
    while (rootView.superview && ![rootView isReactABI19_0_0RootView]) {
      rootView = rootView.superview;
    }

    // By convention, all coordinates, whether they be touch coordinates, or
    // measurement coordinates are with respect to the root view.
    CGRect frame = view.frame;
    CGRect globalBounds = [view convertRect:view.bounds toView:rootView];

    callback(@[
      @(frame.origin.x),
      @(frame.origin.y),
      @(globalBounds.size.width),
      @(globalBounds.size.height),
      @(globalBounds.origin.x),
      @(globalBounds.origin.y),
    ]);
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(measureInWindow:(nonnull NSNumber *)ReactABI19_0_0Tag
                  callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI19_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI19_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI19_0_0Tag);
      callback(@[]);
      return;
    }

    // Return frame coordinates in window
    CGRect windowFrame = [view.window convertRect:view.frame fromView:view.superview];
    callback(@[
      @(windowFrame.origin.x),
      @(windowFrame.origin.y),
      @(windowFrame.size.width),
      @(windowFrame.size.height),
    ]);
  }];
}

/**
 * Returs if the shadow view provided has the `ancestor` shadow view as
 * an actual ancestor.
 */
ABI19_0_0RCT_EXPORT_METHOD(viewIsDescendantOf:(nonnull NSNumber *)ReactABI19_0_0Tag
                  ancestor:(nonnull NSNumber *)ancestorReactABI19_0_0Tag
                  callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
  ABI19_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI19_0_0Tag];
  ABI19_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI19_0_0Tag];
  if (!shadowView) {
    return;
  }
  if (!ancestorShadowView) {
    return;
  }
  BOOL viewIsAncestor = [shadowView viewIsDescendantOf:ancestorShadowView];
  callback(@[@(viewIsAncestor)]);
}

static void ABI19_0_0RCTMeasureLayout(ABI19_0_0RCTShadowView *view,
                             ABI19_0_0RCTShadowView *ancestor,
                             ABI19_0_0RCTResponseSenderBlock callback)
{
  if (!view) {
    return;
  }
  if (!ancestor) {
    return;
  }
  CGRect result = [view measureLayoutRelativeToAncestor:ancestor];
  if (CGRectIsNull(result)) {
    ABI19_0_0RCTLogError(@"view %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                view, view.ReactABI19_0_0Tag, ancestor, ancestor.ReactABI19_0_0Tag);
    return;
  }
  CGFloat leftOffset = result.origin.x;
  CGFloat topOffset = result.origin.y;
  CGFloat width = result.size.width;
  CGFloat height = result.size.height;
  if (isnan(leftOffset) || isnan(topOffset) || isnan(width) || isnan(height)) {
    ABI19_0_0RCTLogError(@"Attempted to measure layout but offset or dimensions were NaN");
    return;
  }
  callback(@[@(leftOffset), @(topOffset), @(width), @(height)]);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
ABI19_0_0RCT_EXPORT_METHOD(measureLayout:(nonnull NSNumber *)ReactABI19_0_0Tag
                  relativeTo:(nonnull NSNumber *)ancestorReactABI19_0_0Tag
                  errorCallback:(__unused ABI19_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
  ABI19_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI19_0_0Tag];
  ABI19_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI19_0_0Tag];
  ABI19_0_0RCTMeasureLayout(shadowView, ancestorShadowView, callback);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
ABI19_0_0RCT_EXPORT_METHOD(measureLayoutRelativeToParent:(nonnull NSNumber *)ReactABI19_0_0Tag
                  errorCallback:(__unused ABI19_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
  ABI19_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI19_0_0Tag];
  ABI19_0_0RCTMeasureLayout(shadowView, shadowView.ReactABI19_0_0Superview, callback);
}

/**
 * Returns an array of computed offset layouts in a dictionary form. The layouts are of any ReactABI19_0_0 subviews
 * that are immediate descendants to the parent view found within a specified rect. The dictionary result
 * contains left, top, width, height and an index. The index specifies the position among the other subviews.
 * Only layouts for views that are within the rect passed in are returned. Invokes the error callback if the
 * passed in parent view does not exist. Invokes the supplied callback with the array of computed layouts.
 */
ABI19_0_0RCT_EXPORT_METHOD(measureViewsInRect:(CGRect)rect
                  parentView:(nonnull NSNumber *)ReactABI19_0_0Tag
                  errorCallback:(__unused ABI19_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
  ABI19_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI19_0_0Tag];
  if (!shadowView) {
    ABI19_0_0RCTLogError(@"Attempting to measure view that does not exist (tag #%@)", ReactABI19_0_0Tag);
    return;
  }
  NSArray<ABI19_0_0RCTShadowView *> *childShadowViews = [shadowView ReactABI19_0_0Subviews];
  NSMutableArray<NSDictionary *> *results =
    [[NSMutableArray alloc] initWithCapacity:childShadowViews.count];

  [childShadowViews enumerateObjectsUsingBlock:
   ^(ABI19_0_0RCTShadowView *childShadowView, NSUInteger idx, __unused BOOL *stop) {
    CGRect childLayout = [childShadowView measureLayoutRelativeToAncestor:shadowView];
    if (CGRectIsNull(childLayout)) {
      ABI19_0_0RCTLogError(@"View %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                  childShadowView, childShadowView.ReactABI19_0_0Tag, shadowView, shadowView.ReactABI19_0_0Tag);
      return;
    }

    CGFloat leftOffset = childLayout.origin.x;
    CGFloat topOffset = childLayout.origin.y;
    CGFloat width = childLayout.size.width;
    CGFloat height = childLayout.size.height;

    if (leftOffset <= rect.origin.x + rect.size.width &&
        leftOffset + width >= rect.origin.x &&
        topOffset <= rect.origin.y + rect.size.height &&
        topOffset + height >= rect.origin.y) {

      // This view is within the layout rect
      NSDictionary *result = @{@"index": @(idx),
                               @"left": @(leftOffset),
                               @"top": @(topOffset),
                               @"width": @(width),
                               @"height": @(height)};

      [results addObject:result];
    }
  }];
  callback(@[results]);
}

ABI19_0_0RCT_EXPORT_METHOD(takeSnapshot:(id /* NSString or NSNumber */)target
                  withOptions:(NSDictionary *)options
                  resolve:(ABI19_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI19_0_0RCTPromiseRejectBlock)reject)
{
  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    // Get view
    UIView *view;
    if (target == nil || [target isEqual:@"window"]) {
      view = ABI19_0_0RCTKeyWindow();
    } else if ([target isKindOfClass:[NSNumber class]]) {
      view = viewRegistry[target];
      if (!view) {
        ABI19_0_0RCTLogError(@"No view found with ReactABI19_0_0Tag: %@", target);
        return;
      }
    }

    // Get options
    CGSize size = [ABI19_0_0RCTConvert CGSize:options];
    NSString *format = [ABI19_0_0RCTConvert NSString:options[@"format"] ?: @"png"];

    // Capture image
    if (size.width < 0.1 || size.height < 0.1) {
      size = view.bounds.size;
    }
    UIGraphicsBeginImageContextWithOptions(size, NO, 0);
    BOOL success = [view drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    if (!success || !image) {
      reject(ABI19_0_0RCTErrorUnspecified, @"Failed to capture view snapshot.", nil);
      return;
    }

    // Convert image to data (on a background thread)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

      NSData *data;
      if ([format isEqualToString:@"png"]) {
        data = UIImagePNGRepresentation(image);
      } else if ([format isEqualToString:@"jpeg"]) {
        CGFloat quality = [ABI19_0_0RCTConvert CGFloat:options[@"quality"] ?: @1];
        data = UIImageJPEGRepresentation(image, quality);
      } else {
        ABI19_0_0RCTLogError(@"Unsupported image format: %@", format);
        return;
      }

      // Save to a temp file
      NSError *error = nil;
      NSString *tempFilePath = ABI19_0_0RCTTempFilePath(format, &error);
      if (tempFilePath) {
        if ([data writeToFile:tempFilePath options:(NSDataWritingOptions)0 error:&error]) {
          resolve(tempFilePath);
          return;
        }
      }

      // If we reached here, something went wrong
      reject(ABI19_0_0RCTErrorUnspecified, error.localizedDescription, error);
    });
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
ABI19_0_0RCT_EXPORT_METHOD(setJSResponder:(nonnull NSNumber *)ReactABI19_0_0Tag
                  blockNativeResponder:(__unused BOOL)blockNativeResponder)
{
  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = viewRegistry[ReactABI19_0_0Tag];
    if (!_jsResponder) {
      ABI19_0_0RCTLogError(@"Invalid view set to be the JS responder - tag %zd", ReactABI19_0_0Tag);
    }
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(clearJSResponder)
{
  [self addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = nil;
  }];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSMutableDictionary<NSString *, NSDictionary *> *constants = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *directEvents = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *bubblingEvents = [NSMutableDictionary new];

  [_componentDataByName enumerateKeysAndObjectsUsingBlock:^(NSString *name, ABI19_0_0RCTComponentData *componentData, __unused BOOL *stop) {
     NSMutableDictionary<NSString *, id> *moduleConstants = [NSMutableDictionary new];

     // Add manager class
     moduleConstants[@"Manager"] = ABI19_0_0RCTBridgeModuleNameForClass(componentData.managerClass);

     // Add native props
     NSDictionary<NSString *, id> *viewConfig = [componentData viewConfig];
     moduleConstants[@"NativeProps"] = viewConfig[@"propTypes"];

     // Add direct events
     for (NSString *eventName in viewConfig[@"directEvents"]) {
       if (!directEvents[eventName]) {
         directEvents[eventName] = @{
           @"registrationName": [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"],
         };
       }
       if (ABI19_0_0RCT_DEBUG && bubblingEvents[eventName]) {
         ABI19_0_0RCTLogError(@"Component '%@' re-registered bubbling event '%@' as a "
                     "direct event", componentData.name, eventName);
       }
     }

     // Add bubbling events
     for (NSString *eventName in viewConfig[@"bubblingEvents"]) {
       if (!bubblingEvents[eventName]) {
         NSString *bubbleName = [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"];
         bubblingEvents[eventName] = @{
           @"phasedRegistrationNames": @{
             @"bubbled": bubbleName,
             @"captured": [bubbleName stringByAppendingString:@"Capture"],
           }
         };
       }
       if (ABI19_0_0RCT_DEBUG && directEvents[eventName]) {
         ABI19_0_0RCTLogError(@"Component '%@' re-registered direct event '%@' as a "
                     "bubbling event", componentData.name, eventName);
       }
     }

     ABI19_0_0RCTAssert(!constants[name], @"UIManager already has constants for %@", componentData.name);
     constants[name] = moduleConstants;
  }];

  constants[@"customBubblingEventTypes"] = bubblingEvents;
  constants[@"customDirectEventTypes"] = directEvents;

  return constants;
}

ABI19_0_0RCT_EXPORT_METHOD(configureNextLayoutAnimation:(NSDictionary *)config
                  withCallback:(ABI19_0_0RCTResponseSenderBlock)callback
                  errorCallback:(__unused ABI19_0_0RCTResponseSenderBlock)errorCallback)
{
  ABI19_0_0RCTLayoutAnimation *currentAnimation = _layoutAnimation;

  if (currentAnimation && ![config isEqualToDictionary:currentAnimation.config]) {
    ABI19_0_0RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.", currentAnimation.config, config);
  }

  ABI19_0_0RCTLayoutAnimation *nextLayoutAnimation = [[ABI19_0_0RCTLayoutAnimation alloc] initWithDictionary:config
                                                               callback:callback];

  // Set up next layout animation
  [self addUIBlock:^(ABI19_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    uiManager->_layoutAnimation = nextLayoutAnimation;
  }];
}

- (void)rootViewForReactABI19_0_0Tag:(NSNumber *)ReactABI19_0_0Tag withCompletion:(void (^)(UIView *view))completion
{
  ABI19_0_0RCTAssertMainQueue();
  ABI19_0_0RCTAssert(completion != nil, @"Attempted to resolve rootView for tag %@ without a completion block", ReactABI19_0_0Tag);

  if (ReactABI19_0_0Tag == nil) {
    completion(nil);
    return;
  }

  dispatch_async(ABI19_0_0RCTGetUIManagerQueue(), ^{
    NSNumber *rootTag = [self _rootTagForReactABI19_0_0Tag:ReactABI19_0_0Tag];
    dispatch_async(dispatch_get_main_queue(), ^{
      UIView *rootView = nil;
      if (rootTag != nil) {
        rootView = [self viewForReactABI19_0_0Tag:rootTag];
      }
      completion(rootView);
    });
  });
}

- (NSNumber *)_rootTagForReactABI19_0_0Tag:(NSNumber *)ReactABI19_0_0Tag
{
  ABI19_0_0RCTAssert(!ABI19_0_0RCTIsMainQueue(), @"Should be called on shadow queue");

  if (ReactABI19_0_0Tag == nil) {
    return nil;
  }

  if (ABI19_0_0RCTIsReactABI19_0_0RootView(ReactABI19_0_0Tag)) {
    return ReactABI19_0_0Tag;
  }

  NSNumber *rootTag = nil;
  ABI19_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI19_0_0Tag];
  while (shadowView) {
    ABI19_0_0RCTShadowView *parent = [shadowView ReactABI19_0_0Superview];
    if (!parent && ABI19_0_0RCTIsReactABI19_0_0RootView(shadowView.ReactABI19_0_0Tag)) {
      rootTag = shadowView.ReactABI19_0_0Tag;
      break;
    }
    shadowView = parent;
  }

  return rootTag;
}

static UIView *_jsResponder;

+ (UIView *)JSResponder
{
  return _jsResponder;
}

@end

@implementation ABI19_0_0RCTUIManager (Deprecated)

- (void)registerRootView:(UIView *)rootView withSizeFlexibility:(__unused ABI19_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  ABI19_0_0RCTLogWarn(@"Calling of `[-ABI19_0_0RCTUIManager registerRootView:withSizeFlexibility:]` which is deprecated.");
  [self registerRootView:rootView];
}

- (void)setFrame:(CGRect)frame forView:(UIView *)view
{
  ABI19_0_0RCTLogWarn(@"Calling of `[-ABI19_0_0RCTUIManager setFrame:forView:]` which is deprecated.");
  [self setSize:frame.size forView:view];
}

ABI19_0_0RCT_EXPORT_METHOD(getContentSizeMultiplier:(nonnull ABI19_0_0RCTResponseSenderBlock)callback)
{
  ABI19_0_0RCTLogWarn(@"`getContentSizeMultiplier` is deprecated. Instead, use `PixelRatio.getFontScale()` and listen to the `didUpdateDimensions` event.");
  callback(@[@(_bridge.accessibilityManager.multiplier)]);
}

@end

@implementation ABI19_0_0RCTBridge (ABI19_0_0RCTUIManager)

- (ABI19_0_0RCTUIManager *)uiManager
{
  return [self moduleForClass:[ABI19_0_0RCTUIManager class]];
}

@end
