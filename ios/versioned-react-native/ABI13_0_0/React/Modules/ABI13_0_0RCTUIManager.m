/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTUIManager.h"

#import <AVFoundation/AVFoundation.h>

#import <ABI13_0_0yoga/ABI13_0_0Yoga.h>

#import "ABI13_0_0RCTAccessibilityManager.h"
#import "ABI13_0_0RCTAnimationType.h"
#import "ABI13_0_0RCTAssert.h"
#import "ABI13_0_0RCTBridge+Private.h"
#import "ABI13_0_0RCTBridge.h"
#import "ABI13_0_0RCTComponent.h"
#import "ABI13_0_0RCTComponentData.h"
#import "ABI13_0_0RCTConvert.h"
#import "ABI13_0_0RCTDefines.h"
#import "ABI13_0_0RCTEventDispatcher.h"
#import "ABI13_0_0RCTLog.h"
#import "ABI13_0_0RCTModuleData.h"
#import "ABI13_0_0RCTModuleMethod.h"
#import "ABI13_0_0RCTProfile.h"
#import "ABI13_0_0RCTRootShadowView.h"
#import "ABI13_0_0RCTRootViewInternal.h"
#import "ABI13_0_0RCTScrollableProtocol.h"
#import "ABI13_0_0RCTShadowView.h"
#import "ABI13_0_0RCTUtils.h"
#import "ABI13_0_0RCTView.h"
#import "ABI13_0_0RCTViewManager.h"
#import "UIView+ReactABI13_0_0.h"

static void ABI13_0_0RCTTraverseViewNodes(id<ABI13_0_0RCTComponent> view, void (^block)(id<ABI13_0_0RCTComponent>))
{
  if (view.ReactABI13_0_0Tag) {
    block(view);

    for (id<ABI13_0_0RCTComponent> subview in view.ReactABI13_0_0Subviews) {
      ABI13_0_0RCTTraverseViewNodes(subview, block);
    }
  }
}

char *const ABI13_0_0RCTUIManagerQueueName = "com.facebook.ReactABI13_0_0.ShadowQueue";
NSString *const ABI13_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification = @"ABI13_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification";
NSString *const ABI13_0_0RCTUIManagerDidRegisterRootViewNotification = @"ABI13_0_0RCTUIManagerDidRegisterRootViewNotification";
NSString *const ABI13_0_0RCTUIManagerDidRemoveRootViewNotification = @"ABI13_0_0RCTUIManagerDidRemoveRootViewNotification";
NSString *const ABI13_0_0RCTUIManagerRootViewKey = @"ABI13_0_0RCTUIManagerRootViewKey";

@interface ABI13_0_0RCTAnimation : NSObject

@property (nonatomic, readonly) NSTimeInterval duration;
@property (nonatomic, readonly) NSTimeInterval delay;
@property (nonatomic, readonly, copy) NSString *property;
@property (nonatomic, readonly) CGFloat springDamping;
@property (nonatomic, readonly) CGFloat initialVelocity;
@property (nonatomic, readonly) ABI13_0_0RCTAnimationType animationType;

@end

static UIViewAnimationCurve _currentKeyboardAnimationCurve;

@implementation ABI13_0_0RCTAnimation

static UIViewAnimationOptions UIViewAnimationOptionsFromABI13_0_0RCTAnimationType(ABI13_0_0RCTAnimationType type)
{
  switch (type) {
    case ABI13_0_0RCTAnimationTypeLinear:
      return UIViewAnimationOptionCurveLinear;
    case ABI13_0_0RCTAnimationTypeEaseIn:
      return UIViewAnimationOptionCurveEaseIn;
    case ABI13_0_0RCTAnimationTypeEaseOut:
      return UIViewAnimationOptionCurveEaseOut;
    case ABI13_0_0RCTAnimationTypeEaseInEaseOut:
      return UIViewAnimationOptionCurveEaseInOut;
    case ABI13_0_0RCTAnimationTypeKeyboard:
      // http://stackoverflow.com/questions/18870447/how-to-use-the-default-ios7-uianimation-curve
      return (UIViewAnimationOptions)(_currentKeyboardAnimationCurve << 16);
    default:
      ABI13_0_0RCTLogError(@"Unsupported animation type %zd", type);
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
    _property = [ABI13_0_0RCTConvert NSString:config[@"property"]];

    _duration = [ABI13_0_0RCTConvert NSTimeInterval:config[@"duration"]] ?: duration;
    if (_duration > 0.0 && _duration < 0.01) {
      ABI13_0_0RCTLogError(@"ABI13_0_0RCTLayoutAnimation expects timings to be in ms, not seconds.");
      _duration = _duration * 1000.0;
    }

    _delay = [ABI13_0_0RCTConvert NSTimeInterval:config[@"delay"]];
    if (_delay > 0.0 && _delay < 0.01) {
      ABI13_0_0RCTLogError(@"ABI13_0_0RCTLayoutAnimation expects timings to be in ms, not seconds.");
      _delay = _delay * 1000.0;
    }

    _animationType = [ABI13_0_0RCTConvert ABI13_0_0RCTAnimationType:config[@"type"]];
    if (_animationType == ABI13_0_0RCTAnimationTypeSpring) {
      _springDamping = [ABI13_0_0RCTConvert CGFloat:config[@"springDamping"]];
      _initialVelocity = [ABI13_0_0RCTConvert CGFloat:config[@"initialVelocity"]];
    }
  }
  return self;
}

- (void)performAnimations:(void (^)(void))animations
      withCompletionBlock:(void (^)(BOOL completed))completionBlock
{
  if (_animationType == ABI13_0_0RCTAnimationTypeSpring) {

    [UIView animateWithDuration:_duration
                          delay:_delay
         usingSpringWithDamping:_springDamping
          initialSpringVelocity:_initialVelocity
                        options:UIViewAnimationOptionBeginFromCurrentState
                     animations:animations
                     completion:completionBlock];

  } else {

    UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState |
      UIViewAnimationOptionsFromABI13_0_0RCTAnimationType(_animationType);

    [UIView animateWithDuration:_duration
                          delay:_delay
                        options:options
                     animations:animations
                     completion:completionBlock];
  }
}

@end

@interface ABI13_0_0RCTLayoutAnimation : NSObject

@property (nonatomic, copy) NSDictionary *config;
@property (nonatomic, strong) ABI13_0_0RCTAnimation *createAnimation;
@property (nonatomic, strong) ABI13_0_0RCTAnimation *updateAnimation;
@property (nonatomic, strong) ABI13_0_0RCTAnimation *deleteAnimation;
@property (nonatomic, copy) ABI13_0_0RCTResponseSenderBlock callback;

@end

@implementation ABI13_0_0RCTLayoutAnimation

- (instancetype)initWithDictionary:(NSDictionary *)config callback:(ABI13_0_0RCTResponseSenderBlock)callback
{
  if (!config) {
    return nil;
  }

  if ((self = [super init])) {
    _config = [config copy];
    NSTimeInterval duration = [ABI13_0_0RCTConvert NSTimeInterval:config[@"duration"]];
    if (duration > 0.0 && duration < 0.01) {
      ABI13_0_0RCTLogError(@"ABI13_0_0RCTLayoutAnimation expects timings to be in ms, not seconds.");
      duration = duration * 1000.0;
    }

    _createAnimation = [[ABI13_0_0RCTAnimation alloc] initWithDuration:duration dictionary:config[@"create"]];
    _updateAnimation = [[ABI13_0_0RCTAnimation alloc] initWithDuration:duration dictionary:config[@"update"]];
    _deleteAnimation = [[ABI13_0_0RCTAnimation alloc] initWithDuration:duration dictionary:config[@"delete"]];
    _callback = callback;
  }
  return self;
}

@end

@implementation ABI13_0_0RCTUIManager
{
  // Root views are only mutated on the shadow queue
  NSMutableSet<NSNumber *> *_rootViewTags;
  NSMutableArray<ABI13_0_0RCTViewManagerUIBlock> *_pendingUIBlocks;

  // Animation
  ABI13_0_0RCTLayoutAnimation *_layoutAnimation; // Main thread only
  NSMutableSet<UIView *> *_viewsToBeDeleted; // Main thread only

  NSMutableDictionary<NSNumber *, ABI13_0_0RCTShadowView *> *_shadowViewRegistry; // ABI13_0_0RCT thread only
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry; // Main thread only

  // Keyed by viewName
  NSDictionary *_componentDataByName;

  NSMutableSet<id<ABI13_0_0RCTComponent>> *_bridgeTransactionListeners;
#if !TARGET_OS_TV
  UIInterfaceOrientation _currentInterfaceOrientation;
#endif
}

@synthesize bridge = _bridge;

ABI13_0_0RCT_EXPORT_MODULE()

- (void)didReceiveNewContentSizeMultiplier
{
  // Report the event across the bridge.
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateContentSizeMultiplier"
                                              body:@([_bridge.accessibilityManager multiplier])];

  dispatch_async(ABI13_0_0RCTGetUIManagerQueue(), ^{
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI13_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
                                                        object:self];
    [self setNeedsLayout];
  });
}

- (void)interfaceOrientationWillChange:(NSNotification *)notification
{
#if !TARGET_OS_TV
  UIInterfaceOrientation nextOrientation =
    [notification.userInfo[UIApplicationStatusBarOrientationUserInfoKey] integerValue];

  // Update when we go from portrait to landscape, or landscape to portrait
  if ((UIInterfaceOrientationIsPortrait(_currentInterfaceOrientation) &&
      !UIInterfaceOrientationIsPortrait(nextOrientation)) ||
      (UIInterfaceOrientationIsLandscape(_currentInterfaceOrientation) &&
      !UIInterfaceOrientationIsLandscape(nextOrientation))) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                                body:ABI13_0_0RCTExportedDimensions(YES)];
#pragma clang diagnostic pop
  }

  _currentInterfaceOrientation = nextOrientation;
#endif
}

- (void)invalidate
{
  /**
   * Called on the JS Thread since all modules are invalidated on the JS thread
   */

  // This only accessed from the shadow queue
  _pendingUIBlocks = nil;

  dispatch_async(dispatch_get_main_queue(), ^{
    ABI13_0_0RCT_PROFILE_BEGIN_EVENT(ABI13_0_0RCTProfileTagAlways, @"UIManager invalidate", nil);
    for (NSNumber *rootViewTag in self->_rootViewTags) {
      [(id<ABI13_0_0RCTInvalidating>)self->_viewRegistry[rootViewTag] invalidate];
    }

    self->_rootViewTags = nil;
    self->_shadowViewRegistry = nil;
    self->_viewRegistry = nil;
    self->_bridgeTransactionListeners = nil;
    self->_bridge = nil;

    [[NSNotificationCenter defaultCenter] removeObserver:self];
    ABI13_0_0RCT_PROFILE_END_EVENT(ABI13_0_0RCTProfileTagAlways, @"");
  });
}

- (NSMutableDictionary<NSNumber *, ABI13_0_0RCTShadowView *> *)shadowViewRegistry
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

- (void)setBridge:(ABI13_0_0RCTBridge *)bridge
{
  ABI13_0_0RCTAssert(_bridge == nil, @"Should not re-use same UIIManager instance");

  _bridge = bridge;

  _shadowViewRegistry = [NSMutableDictionary new];
  _viewRegistry = [NSMutableDictionary new];

  // Internal resources
  _pendingUIBlocks = [NSMutableArray new];
  _rootViewTags = [NSMutableSet new];

  _bridgeTransactionListeners = [NSMutableSet new];

  _viewsToBeDeleted = [NSMutableSet new];

  // Get view managers from bridge
  NSMutableDictionary *componentDataByName = [NSMutableDictionary new];
  for (Class moduleClass in _bridge.moduleClasses) {
    if ([moduleClass isSubclassOfClass:[ABI13_0_0RCTViewManager class]]) {
      ABI13_0_0RCTComponentData *componentData = [[ABI13_0_0RCTComponentData alloc] initWithManagerClass:moduleClass
                                                                                bridge:_bridge];
      componentDataByName[componentData.name] = componentData;
    }
  }

  _componentDataByName = [componentDataByName copy];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:ABI13_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
#if !TARGET_OS_TV
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationWillChange:)
                                               name:UIApplicationWillChangeStatusBarOrientationNotification
                                             object:nil];
#endif

  [ABI13_0_0RCTAnimation initializeStatics];
}

dispatch_queue_t ABI13_0_0RCTGetUIManagerQueue(void)
{
  static dispatch_queue_t shadowQueue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if ([NSOperation instancesRespondToSelector:@selector(qualityOfService)]) {
      dispatch_queue_attr_t attr = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, 0);
      shadowQueue = dispatch_queue_create(ABI13_0_0RCTUIManagerQueueName, attr);
    } else {
      shadowQueue = dispatch_queue_create(ABI13_0_0RCTUIManagerQueueName, DISPATCH_QUEUE_SERIAL);
      dispatch_set_target_queue(shadowQueue, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0));
    }
  });
  return shadowQueue;
}

- (dispatch_queue_t)methodQueue
{
  return ABI13_0_0RCTGetUIManagerQueue();
}

- (void)registerRootView:(UIView *)rootView withSizeFlexibility:(ABI13_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  ABI13_0_0RCTAssertMainQueue();

  NSNumber *ReactABI13_0_0Tag = rootView.ReactABI13_0_0Tag;
  ABI13_0_0RCTAssert(ABI13_0_0RCTIsReactABI13_0_0RootView(ReactABI13_0_0Tag),
            @"View %@ with tag #%@ is not a root view", rootView, ReactABI13_0_0Tag);

  UIView *existingView = _viewRegistry[ReactABI13_0_0Tag];
  ABI13_0_0RCTAssert(existingView == nil || existingView == rootView,
            @"Expect all root views to have unique tag. Added %@ twice", ReactABI13_0_0Tag);

  // Register view
  _viewRegistry[ReactABI13_0_0Tag] = rootView;
  CGRect frame = rootView.frame;

  // Register shadow view
  dispatch_async(ABI13_0_0RCTGetUIManagerQueue(), ^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI13_0_0RCTRootShadowView *shadowView = [ABI13_0_0RCTRootShadowView new];
    shadowView.ReactABI13_0_0Tag = ReactABI13_0_0Tag;
    shadowView.frame = frame;
    shadowView.backgroundColor = rootView.backgroundColor;
    shadowView.viewName = NSStringFromClass([rootView class]);
    shadowView.sizeFlexibility = sizeFlexibility;
    self->_shadowViewRegistry[shadowView.ReactABI13_0_0Tag] = shadowView;
    [self->_rootViewTags addObject:ReactABI13_0_0Tag];
  });

  [[NSNotificationCenter defaultCenter] postNotificationName:ABI13_0_0RCTUIManagerDidRegisterRootViewNotification
                                                      object:self
                                                    userInfo:@{ABI13_0_0RCTUIManagerRootViewKey: rootView}];
}

- (UIView *)viewForReactABI13_0_0Tag:(NSNumber *)ReactABI13_0_0Tag
{
  ABI13_0_0RCTAssertMainQueue();
  return _viewRegistry[ReactABI13_0_0Tag];
}

- (void)setFrame:(CGRect)frame forView:(UIView *)view
{
  ABI13_0_0RCTAssertMainQueue();

  // The following variable has no meaning if the view is not a ReactABI13_0_0 root view
  ABI13_0_0RCTRootViewSizeFlexibility sizeFlexibility = ABI13_0_0RCTRootViewSizeFlexibilityNone;

  if (ABI13_0_0RCTIsReactABI13_0_0RootView(view.ReactABI13_0_0Tag)) {
    ABI13_0_0RCTRootView *rootView = (ABI13_0_0RCTRootView *)[view superview];
    if (rootView != nil) {
      sizeFlexibility = rootView.sizeFlexibility;
    }
  }

  NSNumber *ReactABI13_0_0Tag = view.ReactABI13_0_0Tag;
  dispatch_async(ABI13_0_0RCTGetUIManagerQueue(), ^{
    ABI13_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI13_0_0Tag];
    ABI13_0_0RCTAssert(shadowView != nil, @"Could not locate shadow view with tag #%@", ReactABI13_0_0Tag);

    BOOL needsLayout = NO;
    if (!CGRectEqualToRect(frame, shadowView.frame)) {
      shadowView.frame = frame;
      needsLayout = YES;
    }

    // Trigger re-layout when size flexibility changes, as the root view might grow or
    // shrink in the flexible dimensions.
    if (ABI13_0_0RCTIsReactABI13_0_0RootView(ReactABI13_0_0Tag)) {
      ABI13_0_0RCTRootShadowView *rootShadowView = (ABI13_0_0RCTRootShadowView *)shadowView;
      if (rootShadowView.sizeFlexibility != sizeFlexibility) {
        rootShadowView.sizeFlexibility = sizeFlexibility;
        needsLayout = YES;
      }
    }

    if (needsLayout) {
      [self setNeedsLayout];
    }
  });
}

- (void)setIntrinsicContentSize:(CGSize)size forView:(UIView *)view
{
  ABI13_0_0RCTAssertMainQueue();

  NSNumber *ReactABI13_0_0Tag = view.ReactABI13_0_0Tag;
  dispatch_async(ABI13_0_0RCTGetUIManagerQueue(), ^{
    ABI13_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI13_0_0Tag];
    ABI13_0_0RCTAssert(shadowView != nil, @"Could not locate root view with tag #%@", ReactABI13_0_0Tag);

    shadowView.intrinsicContentSize = size;

    [self setNeedsLayout];
  });
}

- (void)setBackgroundColor:(UIColor *)color forView:(UIView *)view
{
  ABI13_0_0RCTAssertMainQueue();

  NSNumber *ReactABI13_0_0Tag = view.ReactABI13_0_0Tag;
  dispatch_async(ABI13_0_0RCTGetUIManagerQueue(), ^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI13_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI13_0_0Tag];
    ABI13_0_0RCTAssert(shadowView != nil, @"Could not locate root view with tag #%@", ReactABI13_0_0Tag);
    shadowView.backgroundColor = color;
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:shadowView];
    [self flushUIBlocks];
  });
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray<id<ABI13_0_0RCTComponent>> *)children
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *)registry
{
  for (id<ABI13_0_0RCTComponent> child in children) {
    ABI13_0_0RCTTraverseViewNodes(registry[child.ReactABI13_0_0Tag], ^(id<ABI13_0_0RCTComponent> subview) {
      ABI13_0_0RCTAssert(![subview isReactABI13_0_0RootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(ABI13_0_0RCTInvalidating)]) {
        [(id<ABI13_0_0RCTInvalidating>)subview invalidate];
      }
      [registry removeObjectForKey:subview.ReactABI13_0_0Tag];

      if (registry == (NSMutableDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *)self->_viewRegistry) {
        [self->_bridgeTransactionListeners removeObject:subview];
      }
    });
  }
}

- (void)addUIBlock:(ABI13_0_0RCTViewManagerUIBlock)block
{
  ABI13_0_0RCTAssertThread(ABI13_0_0RCTGetUIManagerQueue(),
                  @"-[ABI13_0_0RCTUIManager addUIBlock:] should only be called from the "
                  "UIManager's queue (get this using `ABI13_0_0RCTGetUIManagerQueue()`)");

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks addObject:block];
}

- (ABI13_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI13_0_0RCTRootShadowView *)rootShadowView
{
  ABI13_0_0RCTAssert(!ABI13_0_0RCTIsMainQueue(), @"Should be called on shadow queue");

  // This is nuanced. In the JS thread, we create a new update buffer
  // `frameTags`/`frames` that is created/mutated in the JS thread. We access
  // these structures in the UI-thread block. `NSMutableArray` is not thread
  // safe so we rely on the fact that we never mutate it after it's passed to
  // the main thread.
  NSSet<ABI13_0_0RCTShadowView *> *viewsWithNewFrames = [rootShadowView collectViewsWithUpdatedFrames];

  if (!viewsWithNewFrames.count) {
    // no frame change results in no UI update block
    return nil;
  }

  typedef struct {
    CGRect frame;
    BOOL isNew;
    BOOL parentIsNew;
    BOOL isHidden;
  } ABI13_0_0RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = viewsWithNewFrames.count;
  NSMutableArray *ReactABI13_0_0Tags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(ABI13_0_0RCTFrameData) * count];
  {
    NSUInteger index = 0;
    ABI13_0_0RCTFrameData *frameDataArray = (ABI13_0_0RCTFrameData *)framesData.mutableBytes;
    for (ABI13_0_0RCTShadowView *shadowView in viewsWithNewFrames) {
      ReactABI13_0_0Tags[index] = shadowView.ReactABI13_0_0Tag;
      frameDataArray[index++] = (ABI13_0_0RCTFrameData){
        shadowView.frame,
        shadowView.isNewView,
        shadowView.superview.isNewView,
        shadowView.isHidden,
      };
    }
  }

  // These are blocks to be executed on each view, immediately after
  // ReactABI13_0_0SetFrame: has been called. Note that if ReactABI13_0_0SetFrame: is not called,
  // these won't be called either, so this is not a suitable place to update
  // properties that aren't related to layout.
  NSMutableDictionary<NSNumber *, ABI13_0_0RCTViewManagerUIBlock> *updateBlocks =
  [NSMutableDictionary new];
  for (ABI13_0_0RCTShadowView *shadowView in viewsWithNewFrames) {

    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *ReactABI13_0_0Tag = shadowView.ReactABI13_0_0Tag;
    ABI13_0_0RCTViewManager *manager = [_componentDataByName[shadowView.viewName] manager];
    ABI13_0_0RCTViewManagerUIBlock block = [manager uiBlockToAmendWithShadowView:shadowView];
    if (block) {
      updateBlocks[ReactABI13_0_0Tag] = block;
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

    if (ABI13_0_0RCTIsReactABI13_0_0RootView(ReactABI13_0_0Tag)) {
      CGSize contentSize = shadowView.frame.size;

      dispatch_async(dispatch_get_main_queue(), ^{
        UIView *view = self->_viewRegistry[ReactABI13_0_0Tag];
        ABI13_0_0RCTAssert(view != nil, @"view (for ID %@) not found", ReactABI13_0_0Tag);

        ABI13_0_0RCTRootView *rootView = (ABI13_0_0RCTRootView *)[view superview];
        rootView.intrinsicSize = contentSize;
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    const ABI13_0_0RCTFrameData *frameDataArray = (const ABI13_0_0RCTFrameData *)framesData.bytes;
    ABI13_0_0RCTLayoutAnimation *layoutAnimation = uiManager->_layoutAnimation;

    __block NSUInteger completionsCalled = 0;

    NSInteger index = 0;
    for (NSNumber *ReactABI13_0_0Tag in ReactABI13_0_0Tags) {
      ABI13_0_0RCTFrameData frameData = frameDataArray[index++];

      UIView *view = viewRegistry[ReactABI13_0_0Tag];
      CGRect frame = frameData.frame;

      BOOL isHidden = frameData.isHidden;
      BOOL isNew = frameData.isNew;
      ABI13_0_0RCTAnimation *updateAnimation = isNew ? nil : layoutAnimation.updateAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      ABI13_0_0RCTAnimation *createAnimation = shouldAnimateCreation ? layoutAnimation.createAnimation : nil;

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

      ABI13_0_0RCTViewManagerUIBlock updateBlock = updateBlocks[ReactABI13_0_0Tag];
      if (createAnimation) {

        // Animate view creation
        [view ReactABI13_0_0SetFrame:frame];

        CATransform3D finalTransform = view.layer.transform;
        CGFloat finalOpacity = view.layer.opacity;

        NSString *property = createAnimation.property;
        if ([property isEqualToString:@"scaleXY"]) {
          view.layer.transform = CATransform3DMakeScale(0, 0, 0);
        } else if ([property isEqualToString:@"opacity"]) {
          view.layer.opacity = 0.0;
        } else {
          ABI13_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
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
          [view ReactABI13_0_0SetFrame:frame];
          if (updateBlock) {
            updateBlock(self, viewRegistry);
          }
        } withCompletionBlock:completion];

      } else {

        // Update without animation
        [view ReactABI13_0_0SetFrame:frame];
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

- (void)_amendPendingUIBlocksWithStylePropagationUpdateForShadowView:(ABI13_0_0RCTShadowView *)topView
{
  NSMutableSet<ABI13_0_0RCTApplierBlock> *applierBlocks = [NSMutableSet setWithCapacity:1];
  [topView collectUpdatedProperties:applierBlocks parentProperties:@{}];

  if (applierBlocks.count) {
    [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      for (ABI13_0_0RCTApplierBlock block in applierBlocks) {
        block(viewRegistry);
      }
    }];
  }
}

/**
 * A method to be called from JS, which takes a container ID and then releases
 * all subviews for that container upon receipt.
 */
ABI13_0_0RCT_EXPORT_METHOD(removeSubviewsFromContainerWithID:(nonnull NSNumber *)containerID)
{
  id<ABI13_0_0RCTComponent> container = _shadowViewRegistry[containerID];
  ABI13_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", containerID);

  NSUInteger subviewsCount = [container ReactABI13_0_0Subviews].count;
  NSMutableArray<NSNumber *> *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
  for (NSUInteger childIndex = 0; childIndex < subviewsCount; childIndex++) {
    [indices addObject:@(childIndex)];
  }

  [self manageChildren:containerID
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI13_0_0Tags:nil
          addAtIndices:nil
       removeAtIndices:indices];
}

/**
 * Disassociates children from container. Doesn't remove from registries.
 * TODO: use [NSArray getObjects:buffer] to reuse same fast buffer each time.
 *
 * @returns Array of removed items.
 */
- (NSArray<id<ABI13_0_0RCTComponent>> *)_childrenToRemoveFromContainer:(id<ABI13_0_0RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if (atIndices.count == 0 || [container ReactABI13_0_0Subviews].count == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray<id<ABI13_0_0RCTComponent>> *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  ABI13_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSNumber *indexNumber in atIndices) {
    NSUInteger index = indexNumber.unsignedIntegerValue;
    if (index < [container ReactABI13_0_0Subviews].count) {
      [removedChildren addObject:[container ReactABI13_0_0Subviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    NSString *message = [NSString stringWithFormat:@"removedChildren count (%tu) was not what we expected (%tu)",
                         removedChildren.count, atIndices.count];
    ABI13_0_0RCTFatal(ABI13_0_0RCTErrorWithMessage(message));
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray<id<ABI13_0_0RCTComponent>> *)children
          fromContainer:(id<ABI13_0_0RCTComponent>)container
{
  for (id<ABI13_0_0RCTComponent> removedChild in children) {
    [container removeReactABI13_0_0Subview:removedChild];
  }
}

/**
 * Remove subviews from their parent with an animation.
 */
- (void)_removeChildren:(NSArray<UIView *> *)children
          fromContainer:(UIView *)container
          withAnimation:(ABI13_0_0RCTLayoutAnimation *)animation
{
  ABI13_0_0RCTAssertMainQueue();
  ABI13_0_0RCTAnimation *deleteAnimation = animation.deleteAnimation;

  __block NSUInteger completionsCalled = 0;
  for (UIView *removedChild in children) {

    void (^completion)(BOOL) = ^(BOOL finished) {
      completionsCalled++;

      [self->_viewsToBeDeleted removeObject:removedChild];
      [container removeReactABI13_0_0Subview:removedChild];

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
        ABI13_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
                    deleteAnimation.property);
      }
    } withCompletionBlock:completion];
  }
}


ABI13_0_0RCT_EXPORT_METHOD(removeRootView:(nonnull NSNumber *)rootReactABI13_0_0Tag)
{
  ABI13_0_0RCTShadowView *rootShadowView = _shadowViewRegistry[rootReactABI13_0_0Tag];
  ABI13_0_0RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootReactABI13_0_0Tag);
  [self _purgeChildren:(NSArray<id<ABI13_0_0RCTComponent>> *)rootShadowView.ReactABI13_0_0Subviews
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *)_shadowViewRegistry];
  [_shadowViewRegistry removeObjectForKey:rootReactABI13_0_0Tag];
  [_rootViewTags removeObject:rootReactABI13_0_0Tag];

  [self addUIBlock:^(ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    ABI13_0_0RCTAssertMainQueue();
    UIView *rootView = viewRegistry[rootReactABI13_0_0Tag];
    [uiManager _purgeChildren:(NSArray<id<ABI13_0_0RCTComponent>> *)rootView.ReactABI13_0_0Subviews
                 fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *)viewRegistry];
    [(NSMutableDictionary *)viewRegistry removeObjectForKey:rootReactABI13_0_0Tag];

    [[NSNotificationCenter defaultCenter] postNotificationName:ABI13_0_0RCTUIManagerDidRemoveRootViewNotification
                                                        object:uiManager
                                                      userInfo:@{ABI13_0_0RCTUIManagerRootViewKey: rootView}];
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(replaceExistingNonRootView:(nonnull NSNumber *)ReactABI13_0_0Tag
                  withView:(nonnull NSNumber *)newReactABI13_0_0Tag)
{
  ABI13_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI13_0_0Tag];
  ABI13_0_0RCTAssert(shadowView != nil, @"shadowView (for ID %@) not found", ReactABI13_0_0Tag);

  ABI13_0_0RCTShadowView *superShadowView = shadowView.superview;
  if (!superShadowView) {
    ABI13_0_0RCTAssert(NO, @"shadowView super (of ID %@) not found", ReactABI13_0_0Tag);
    return;
  }

  NSUInteger indexOfView = [superShadowView.ReactABI13_0_0Subviews indexOfObject:shadowView];
  ABI13_0_0RCTAssert(indexOfView != NSNotFound, @"View's superview doesn't claim it as subview (id %@)", ReactABI13_0_0Tag);
  NSArray<NSNumber *> *removeAtIndices = @[@(indexOfView)];
  NSArray<NSNumber *> *addTags = @[newReactABI13_0_0Tag];
  [self manageChildren:superShadowView.ReactABI13_0_0Tag
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI13_0_0Tags:addTags
          addAtIndices:removeAtIndices
       removeAtIndices:removeAtIndices];
}

ABI13_0_0RCT_EXPORT_METHOD(setChildren:(nonnull NSNumber *)containerTag
                  ReactABI13_0_0Tags:(NSArray<NSNumber *> *)ReactABI13_0_0Tags)
{
  ABI13_0_0RCTSetChildren(containerTag, ReactABI13_0_0Tags,
                 (NSDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *)_shadowViewRegistry);

  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){

    ABI13_0_0RCTSetChildren(containerTag, ReactABI13_0_0Tags,
                   (NSDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *)viewRegistry);
  }];
}

static void ABI13_0_0RCTSetChildren(NSNumber *containerTag,
                           NSArray<NSNumber *> *ReactABI13_0_0Tags,
                           NSDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *registry)
{
  id<ABI13_0_0RCTComponent> container = registry[containerTag];
  NSInteger index = 0;
  for (NSNumber *ReactABI13_0_0Tag in ReactABI13_0_0Tags) {
    id<ABI13_0_0RCTComponent> view = registry[ReactABI13_0_0Tag];
    if (view) {
      [container insertReactABI13_0_0Subview:view atIndex:index++];
    }
  }
}

ABI13_0_0RCT_EXPORT_METHOD(manageChildren:(nonnull NSNumber *)containerTag
                  moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
                  moveToIndices:(NSArray<NSNumber *> *)moveToIndices
                  addChildReactABI13_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI13_0_0Tags
                  addAtIndices:(NSArray<NSNumber *> *)addAtIndices
                  removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices)
{
  [self _manageChildren:containerTag
        moveFromIndices:moveFromIndices
          moveToIndices:moveToIndices
      addChildReactABI13_0_0Tags:addChildReactABI13_0_0Tags
           addAtIndices:addAtIndices
        removeAtIndices:removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *)_shadowViewRegistry];

  [self addUIBlock:^(ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    [uiManager _manageChildren:containerTag
               moveFromIndices:moveFromIndices
                 moveToIndices:moveToIndices
             addChildReactABI13_0_0Tags:addChildReactABI13_0_0Tags
                  addAtIndices:addAtIndices
               removeAtIndices:removeAtIndices
                      registry:(NSMutableDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *)viewRegistry];
  }];
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildReactABI13_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI13_0_0Tags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI13_0_0RCTComponent>> *)registry
{
  id<ABI13_0_0RCTComponent> container = registry[containerTag];
  ABI13_0_0RCTAssert(moveFromIndices.count == moveToIndices.count, @"moveFromIndices had size %tu, moveToIndices had size %tu", moveFromIndices.count, moveToIndices.count);
  ABI13_0_0RCTAssert(addChildReactABI13_0_0Tags.count == addAtIndices.count, @"there should be at least one ReactABI13_0_0 child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray<id<ABI13_0_0RCTComponent>> *permanentlyRemovedChildren =
    [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
  NSArray<id<ABI13_0_0RCTComponent>> *temporarilyRemovedChildren =
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
    id<ABI13_0_0RCTComponent> view = registry[addChildReactABI13_0_0Tags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray<NSNumber *> *sortedIndices =
    [destinationsToChildrenToAdd.allKeys sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *ReactABI13_0_0Index in sortedIndices) {
    NSInteger insertAtIndex = ReactABI13_0_0Index.integerValue;

    // When performing a delete animation, views are not removed immediately
    // from their container so we need to offset the insertion index if a view
    // that will be removed appears earlier than the view we are inserting.
    if (isUIViewRegistry && _viewsToBeDeleted.count > 0) {
      for (NSInteger index = 0; index < insertAtIndex; index++) {
        UIView *subview = ((UIView *)container).ReactABI13_0_0Subviews[index];
        if ([_viewsToBeDeleted containsObject:subview]) {
          insertAtIndex++;
        }
      }
    }

    [container insertReactABI13_0_0Subview:destinationsToChildrenToAdd[ReactABI13_0_0Index]
                          atIndex:insertAtIndex];
  }
}

ABI13_0_0RCT_EXPORT_METHOD(createView:(nonnull NSNumber *)ReactABI13_0_0Tag
                  viewName:(NSString *)viewName
                  rootTag:(__unused NSNumber *)rootTag
                  props:(NSDictionary *)props)
{
  ABI13_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  if (componentData == nil) {
    ABI13_0_0RCTLogError(@"No component found for view with name \"%@\"", viewName);
  }

  // Register shadow view
  ABI13_0_0RCTShadowView *shadowView = [componentData createShadowViewWithTag:ReactABI13_0_0Tag];
  if (shadowView) {
    [componentData setProps:props forShadowView:shadowView];
    _shadowViewRegistry[ReactABI13_0_0Tag] = shadowView;
  }

  // Shadow view is the source of truth for background color this is a little
  // bit counter-intuitive if people try to set background color when setting up
  // the view, but it's the only way that makes sense given our threading model
  UIColor *backgroundColor = shadowView.backgroundColor;

  // Dispatch view creation directly to the main thread instead of adding to
  // UIBlocks array. This way, it doesn't get deferred until after layout.
  __weak ABI13_0_0RCTUIManager *weakManager = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI13_0_0RCTUIManager *uiManager = weakManager;
    if (!uiManager) {
      return;
    }
    UIView *view = [componentData createViewWithTag:ReactABI13_0_0Tag];
    if (view) {
      [componentData setProps:props forView:view]; // Must be done before bgColor to prevent wrong default
      if ([view respondsToSelector:@selector(setBackgroundColor:)]) {
        ((UIView *)view).backgroundColor = backgroundColor;
      }
      if ([view respondsToSelector:@selector(ReactABI13_0_0BridgeDidFinishTransaction)]) {
        [uiManager->_bridgeTransactionListeners addObject:view];
      }
      uiManager->_viewRegistry[ReactABI13_0_0Tag] = view;

#if ABI13_0_0RCT_DEV
      [view _DEBUG_setReactABI13_0_0ShadowView:shadowView];
#endif
    }
  });
}

ABI13_0_0RCT_EXPORT_METHOD(updateView:(nonnull NSNumber *)ReactABI13_0_0Tag
                  viewName:(NSString *)viewName // not always reliable, use shadowView.viewName if available
                  props:(NSDictionary *)props)
{
  ABI13_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI13_0_0Tag];
  ABI13_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName ?: viewName];
  [componentData setProps:props forShadowView:shadowView];

  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI13_0_0Tag];
    [componentData setProps:props forView:view];
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(focus:(nonnull NSNumber *)ReactABI13_0_0Tag)
{
  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *newResponder = viewRegistry[ReactABI13_0_0Tag];
    [newResponder ReactABI13_0_0WillMakeFirstResponder];
    if ([newResponder becomeFirstResponder]) {
      [newResponder ReactABI13_0_0DidMakeFirstResponder];
    }
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(blur:(nonnull NSNumber *)ReactABI13_0_0Tag)
{
  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *currentResponder = viewRegistry[ReactABI13_0_0Tag];
    [currentResponder resignFirstResponder];
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(findSubviewIn:(nonnull NSNumber *)ReactABI13_0_0Tag atPoint:(CGPoint)point callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI13_0_0Tag];
    UIView *target = [view hitTest:point withEvent:nil];
    CGRect frame = [target convertRect:target.bounds toView:view];

    while (target.ReactABI13_0_0Tag == nil && target.superview != nil) {
      target = target.superview;
    }

    callback(@[
      ABI13_0_0RCTNullIfNil(target.ReactABI13_0_0Tag),
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
    ]);
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(dispatchViewManagerCommand:(nonnull NSNumber *)ReactABI13_0_0Tag
                  commandID:(NSInteger)commandID
                  commandArgs:(NSArray<id> *)commandArgs)
{
  ABI13_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI13_0_0Tag];
  ABI13_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName];
  Class managerClass = componentData.managerClass;
  ABI13_0_0RCTModuleData *moduleData = [_bridge moduleDataForName:ABI13_0_0RCTBridgeModuleNameForClass(managerClass)];
  id<ABI13_0_0RCTBridgeMethod> method = moduleData.methods[commandID];

  NSArray *args = [@[ReactABI13_0_0Tag] arrayByAddingObjectsFromArray:commandArgs];
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
  for (ABI13_0_0RCTComponentData *componentData in _componentDataByName.allValues) {
    ABI13_0_0RCTViewManagerUIBlock uiBlock = [componentData uiBlockToAmendWithShadowViewRegistry:_shadowViewRegistry];
    [self addUIBlock:uiBlock];
  }

  // Perform layout
  for (NSNumber *ReactABI13_0_0Tag in _rootViewTags) {
    ABI13_0_0RCTRootShadowView *rootView = (ABI13_0_0RCTRootShadowView *)_shadowViewRegistry[ReactABI13_0_0Tag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:rootView];
  }

  [self addUIBlock:^(ABI13_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    /**
     * TODO(tadeu): Remove it once and for all
     */
    for (id<ABI13_0_0RCTComponent> node in uiManager->_bridgeTransactionListeners) {
      [node ReactABI13_0_0BridgeDidFinishTransaction];
    }
  }];

  [self flushUIBlocks];
}

- (void)flushUIBlocks
{
  ABI13_0_0RCTAssertThread(ABI13_0_0RCTGetUIManagerQueue(),
                  @"flushUIBlocks can only be called from the shadow queue");

  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  NSArray<ABI13_0_0RCTViewManagerUIBlock> *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [NSMutableArray new];

  if (previousPendingUIBlocks.count) {
    // Execute the previously queued UI blocks
    ABI13_0_0RCTProfileBeginFlowEvent();
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI13_0_0RCTProfileEndFlowEvent();
      ABI13_0_0RCT_PROFILE_BEGIN_EVENT(ABI13_0_0RCTProfileTagAlways, @"-[UIManager flushUIBlocks]", (@{
        @"count": @(previousPendingUIBlocks.count),
      }));
      @try {
        for (ABI13_0_0RCTViewManagerUIBlock block in previousPendingUIBlocks) {
          block(self, self->_viewRegistry);
        }
      }
      @catch (NSException *exception) {
        ABI13_0_0RCTLogError(@"Exception thrown while executing UI block: %@", exception);
      }
    });
  }
}

- (void)setNeedsLayout
{
  // If there is an active batch layout will happen when batch finished, so we will wait for that.
  // Otherwise we immidiately trigger layout.
  if (![_bridge isBatchActive]) {
    [self _layoutAndMount];
  }
}

ABI13_0_0RCT_EXPORT_METHOD(measure:(nonnull NSNumber *)ReactABI13_0_0Tag
                  callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI13_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI13_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI13_0_0Tag);
      callback(@[]);
      return;
    }

    // If in a <Modal>, rootView will be the root of the modal container.
    UIView *rootView = view;
    while (rootView.superview && ![rootView isReactABI13_0_0RootView]) {
      rootView = rootView.superview;
    }

    // By convention, all coordinates, whether they be touch coordinates, or
    // measurement coordinates are with respect to the root view.
    CGRect frame = view.frame;
    CGPoint pagePoint = [view.superview convertPoint:frame.origin toView:rootView];

    callback(@[
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
      @(pagePoint.x),
      @(pagePoint.y)
    ]);
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(measureInWindow:(nonnull NSNumber *)ReactABI13_0_0Tag
                  callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI13_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI13_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI13_0_0Tag);
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
ABI13_0_0RCT_EXPORT_METHOD(viewIsDescendantOf:(nonnull NSNumber *)ReactABI13_0_0Tag
                  ancestor:(nonnull NSNumber *)ancestorReactABI13_0_0Tag
                  callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
  ABI13_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI13_0_0Tag];
  ABI13_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI13_0_0Tag];
  if (!shadowView) {
    return;
  }
  if (!ancestorShadowView) {
    return;
  }
  BOOL viewIsAncestor = [shadowView viewIsDescendantOf:ancestorShadowView];
  callback(@[@(viewIsAncestor)]);
}

static void ABI13_0_0RCTMeasureLayout(ABI13_0_0RCTShadowView *view,
                             ABI13_0_0RCTShadowView *ancestor,
                             ABI13_0_0RCTResponseSenderBlock callback)
{
  if (!view) {
    return;
  }
  if (!ancestor) {
    return;
  }
  CGRect result = [view measureLayoutRelativeToAncestor:ancestor];
  if (CGRectIsNull(result)) {
    ABI13_0_0RCTLogError(@"view %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                view, view.ReactABI13_0_0Tag, ancestor, ancestor.ReactABI13_0_0Tag);
    return;
  }
  CGFloat leftOffset = result.origin.x;
  CGFloat topOffset = result.origin.y;
  CGFloat width = result.size.width;
  CGFloat height = result.size.height;
  if (isnan(leftOffset) || isnan(topOffset) || isnan(width) || isnan(height)) {
    ABI13_0_0RCTLogError(@"Attempted to measure layout but offset or dimensions were NaN");
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
ABI13_0_0RCT_EXPORT_METHOD(measureLayout:(nonnull NSNumber *)ReactABI13_0_0Tag
                  relativeTo:(nonnull NSNumber *)ancestorReactABI13_0_0Tag
                  errorCallback:(__unused ABI13_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
  ABI13_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI13_0_0Tag];
  ABI13_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI13_0_0Tag];
  ABI13_0_0RCTMeasureLayout(shadowView, ancestorShadowView, callback);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
ABI13_0_0RCT_EXPORT_METHOD(measureLayoutRelativeToParent:(nonnull NSNumber *)ReactABI13_0_0Tag
                  errorCallback:(__unused ABI13_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
  ABI13_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI13_0_0Tag];
  ABI13_0_0RCTMeasureLayout(shadowView, shadowView.ReactABI13_0_0Superview, callback);
}

/**
 * Returns an array of computed offset layouts in a dictionary form. The layouts are of any ReactABI13_0_0 subviews
 * that are immediate descendants to the parent view found within a specified rect. The dictionary result
 * contains left, top, width, height and an index. The index specifies the position among the other subviews.
 * Only layouts for views that are within the rect passed in are returned. Invokes the error callback if the
 * passed in parent view does not exist. Invokes the supplied callback with the array of computed layouts.
 */
ABI13_0_0RCT_EXPORT_METHOD(measureViewsInRect:(CGRect)rect
                  parentView:(nonnull NSNumber *)ReactABI13_0_0Tag
                  errorCallback:(__unused ABI13_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
  ABI13_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI13_0_0Tag];
  if (!shadowView) {
    ABI13_0_0RCTLogError(@"Attempting to measure view that does not exist (tag #%@)", ReactABI13_0_0Tag);
    return;
  }
  NSArray<ABI13_0_0RCTShadowView *> *childShadowViews = [shadowView ReactABI13_0_0Subviews];
  NSMutableArray<NSDictionary *> *results =
    [[NSMutableArray alloc] initWithCapacity:childShadowViews.count];

  [childShadowViews enumerateObjectsUsingBlock:
   ^(ABI13_0_0RCTShadowView *childShadowView, NSUInteger idx, __unused BOOL *stop) {
    CGRect childLayout = [childShadowView measureLayoutRelativeToAncestor:shadowView];
    if (CGRectIsNull(childLayout)) {
      ABI13_0_0RCTLogError(@"View %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                  childShadowView, childShadowView.ReactABI13_0_0Tag, shadowView, shadowView.ReactABI13_0_0Tag);
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

ABI13_0_0RCT_EXPORT_METHOD(takeSnapshot:(id /* NSString or NSNumber */)target
                  withOptions:(NSDictionary *)options
                  resolve:(ABI13_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI13_0_0RCTPromiseRejectBlock)reject)
{
  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    // Get view
    UIView *view;
    if (target == nil || [target isEqual:@"window"]) {
      view = ABI13_0_0RCTKeyWindow();
    } else if ([target isKindOfClass:[NSNumber class]]) {
      view = viewRegistry[target];
      if (!view) {
        ABI13_0_0RCTLogError(@"No view found with ReactABI13_0_0Tag: %@", target);
        return;
      }
    }

    // Get options
    CGSize size = [ABI13_0_0RCTConvert CGSize:options];
    NSString *format = [ABI13_0_0RCTConvert NSString:options[@"format"] ?: @"png"];

    // Capture image
    if (size.width < 0.1 || size.height < 0.1) {
      size = view.bounds.size;
    }
    UIGraphicsBeginImageContextWithOptions(size, NO, 0);
    BOOL success = [view drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    if (!success || !image) {
      reject(ABI13_0_0RCTErrorUnspecified, @"Failed to capture view snapshot.", nil);
      return;
    }

    // Convert image to data (on a background thread)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

      NSData *data;
      if ([format isEqualToString:@"png"]) {
        data = UIImagePNGRepresentation(image);
      } else if ([format isEqualToString:@"jpeg"]) {
        CGFloat quality = [ABI13_0_0RCTConvert CGFloat:options[@"quality"] ?: @1];
        data = UIImageJPEGRepresentation(image, quality);
      } else {
        ABI13_0_0RCTLogError(@"Unsupported image format: %@", format);
        return;
      }

      // Save to a temp file
      NSError *error = nil;
      NSString *tempFilePath = ABI13_0_0RCTTempFilePath(format, &error);
      if (tempFilePath) {
        if ([data writeToFile:tempFilePath options:(NSDataWritingOptions)0 error:&error]) {
          resolve(tempFilePath);
          return;
        }
      }

      // If we reached here, something went wrong
      reject(ABI13_0_0RCTErrorUnspecified, error.localizedDescription, error);
    });
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
ABI13_0_0RCT_EXPORT_METHOD(setJSResponder:(nonnull NSNumber *)ReactABI13_0_0Tag
                  blockNativeResponder:(__unused BOOL)blockNativeResponder)
{
  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = viewRegistry[ReactABI13_0_0Tag];
    if (!_jsResponder) {
      ABI13_0_0RCTLogError(@"Invalid view set to be the JS responder - tag %zd", ReactABI13_0_0Tag);
    }
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(clearJSResponder)
{
  [self addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = nil;
  }];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSMutableDictionary<NSString *, NSDictionary *> *constants = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *directEvents = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *bubblingEvents = [NSMutableDictionary new];

  [_componentDataByName enumerateKeysAndObjectsUsingBlock:^(NSString *name, ABI13_0_0RCTComponentData *componentData, __unused BOOL *stop) {
     NSMutableDictionary<NSString *, id> *moduleConstants = [NSMutableDictionary new];

     // Add manager class
     moduleConstants[@"Manager"] = ABI13_0_0RCTBridgeModuleNameForClass(componentData.managerClass);

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
       if (ABI13_0_0RCT_DEBUG && bubblingEvents[eventName]) {
         ABI13_0_0RCTLogError(@"Component '%@' re-registered bubbling event '%@' as a "
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
       if (ABI13_0_0RCT_DEBUG && directEvents[eventName]) {
         ABI13_0_0RCTLogError(@"Component '%@' re-registered direct event '%@' as a "
                     "bubbling event", componentData.name, eventName);
       }
     }

     ABI13_0_0RCTAssert(!constants[name], @"UIManager already has constants for %@", componentData.name);
     constants[name] = moduleConstants;
  }];

#if !TARGET_OS_TV
  _currentInterfaceOrientation = [ABI13_0_0RCTSharedApplication() statusBarOrientation];
#endif

  constants[@"customBubblingEventTypes"] = bubblingEvents;
  constants[@"customDirectEventTypes"] = directEvents;
  constants[@"Dimensions"] = ABI13_0_0RCTExportedDimensions(NO);

  return constants;
}

static NSDictionary *ABI13_0_0RCTExportedDimensions(BOOL rotateBounds)
{
  ABI13_0_0RCTAssertMainQueue();

  // Don't use ABI13_0_0RCTScreenSize since it the interface orientation doesn't apply to it
  CGRect screenSize = [[UIScreen mainScreen] bounds];
  return @{
    @"window": @{
        @"width": @(rotateBounds ? screenSize.size.height : screenSize.size.width),
        @"height": @(rotateBounds ? screenSize.size.width : screenSize.size.height),
        @"scale": @(ABI13_0_0RCTScreenScale()),
    },
  };
}

ABI13_0_0RCT_EXPORT_METHOD(configureNextLayoutAnimation:(NSDictionary *)config
                  withCallback:(ABI13_0_0RCTResponseSenderBlock)callback
                  errorCallback:(__unused ABI13_0_0RCTResponseSenderBlock)errorCallback)
{
  ABI13_0_0RCTLayoutAnimation *currentAnimation = _layoutAnimation;

  if (currentAnimation && ![config isEqualToDictionary:currentAnimation.config]) {
    ABI13_0_0RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.", currentAnimation.config, config);
  }

  ABI13_0_0RCTLayoutAnimation *nextLayoutAnimation = [[ABI13_0_0RCTLayoutAnimation alloc] initWithDictionary:config
                                                               callback:callback];

  // Set up next layout animation
  [self addUIBlock:^(ABI13_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    uiManager->_layoutAnimation = nextLayoutAnimation;
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(getContentSizeMultiplier:(nonnull ABI13_0_0RCTResponseSenderBlock)callback)
{
  callback(@[@(_bridge.accessibilityManager.multiplier)]);
}

- (void)rootViewForReactABI13_0_0Tag:(NSNumber *)ReactABI13_0_0Tag withCompletion:(void (^)(UIView *view))completion
{
  ABI13_0_0RCTAssertMainQueue();
  ABI13_0_0RCTAssert(completion != nil, @"Attempted to resolve rootView for tag %@ without a completion block", ReactABI13_0_0Tag);

  if (ReactABI13_0_0Tag == nil) {
    completion(nil);
    return;
  }

  dispatch_async(ABI13_0_0RCTGetUIManagerQueue(), ^{
    NSNumber *rootTag = [self _rootTagForReactABI13_0_0Tag:ReactABI13_0_0Tag];
    dispatch_async(dispatch_get_main_queue(), ^{
      UIView *rootView = nil;
      if (rootTag != nil) {
        rootView = [self viewForReactABI13_0_0Tag:rootTag];
      }
      completion(rootView);
    });
  });
}

- (NSNumber *)_rootTagForReactABI13_0_0Tag:(NSNumber *)ReactABI13_0_0Tag
{
  ABI13_0_0RCTAssert(!ABI13_0_0RCTIsMainQueue(), @"Should be called on shadow queue");

  if (ReactABI13_0_0Tag == nil) {
    return nil;
  }

  if (ABI13_0_0RCTIsReactABI13_0_0RootView(ReactABI13_0_0Tag)) {
    return ReactABI13_0_0Tag;
  }

  NSNumber *rootTag = nil;
  ABI13_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI13_0_0Tag];
  while (shadowView) {
    ABI13_0_0RCTShadowView *parent = [shadowView ReactABI13_0_0Superview];
    if (!parent && ABI13_0_0RCTIsReactABI13_0_0RootView(shadowView.ReactABI13_0_0Tag)) {
      rootTag = shadowView.ReactABI13_0_0Tag;
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

@implementation ABI13_0_0RCTBridge (ABI13_0_0RCTUIManager)

- (ABI13_0_0RCTUIManager *)uiManager
{
  return [self moduleForClass:[ABI13_0_0RCTUIManager class]];
}

@end
