/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTUIManager.h"

#import <AVFoundation/AVFoundation.h>

#import <YogaABI20_0_0/ABI20_0_0Yoga.h>

#import "ABI20_0_0RCTAccessibilityManager.h"
#import "ABI20_0_0RCTAnimationType.h"
#import "ABI20_0_0RCTAssert.h"
#import "ABI20_0_0RCTBridge+Private.h"
#import "ABI20_0_0RCTBridge.h"
#import "ABI20_0_0RCTComponent.h"
#import "ABI20_0_0RCTComponentData.h"
#import "ABI20_0_0RCTConvert.h"
#import "ABI20_0_0RCTDefines.h"
#import "ABI20_0_0RCTEventDispatcher.h"
#import "ABI20_0_0RCTLayoutAnimation.h"
#import "ABI20_0_0RCTLayoutAnimationGroup.h"
#import "ABI20_0_0RCTLog.h"
#import "ABI20_0_0RCTModuleData.h"
#import "ABI20_0_0RCTModuleMethod.h"
#import "ABI20_0_0RCTProfile.h"
#import "ABI20_0_0RCTRootContentView.h"
#import "ABI20_0_0RCTRootShadowView.h"
#import "ABI20_0_0RCTRootViewInternal.h"
#import "ABI20_0_0RCTScrollableProtocol.h"
#import "ABI20_0_0RCTShadowView.h"
#import "ABI20_0_0RCTUIManagerObserverCoordinator.h"
#import "ABI20_0_0RCTUtils.h"
#import "ABI20_0_0RCTView.h"
#import "ABI20_0_0RCTViewManager.h"
#import "UIView+ReactABI20_0_0.h"

static void ABI20_0_0RCTTraverseViewNodes(id<ABI20_0_0RCTComponent> view, void (^block)(id<ABI20_0_0RCTComponent>))
{
  if (view.ReactABI20_0_0Tag) {
    block(view);

    for (id<ABI20_0_0RCTComponent> subview in view.ReactABI20_0_0Subviews) {
      ABI20_0_0RCTTraverseViewNodes(subview, block);
    }
  }
}

char *const ABI20_0_0RCTUIManagerQueueName = "com.facebook.ReactABI20_0_0.ShadowQueue";
NSString *const ABI20_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification = @"ABI20_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification";
NSString *const ABI20_0_0RCTUIManagerDidRegisterRootViewNotification = @"ABI20_0_0RCTUIManagerDidRegisterRootViewNotification";
NSString *const ABI20_0_0RCTUIManagerDidRemoveRootViewNotification = @"ABI20_0_0RCTUIManagerDidRemoveRootViewNotification";
NSString *const ABI20_0_0RCTUIManagerRootViewKey = @"ABI20_0_0RCTUIManagerRootViewKey";

@implementation ABI20_0_0RCTUIManager
{
  // Root views are only mutated on the shadow queue
  NSMutableSet<NSNumber *> *_rootViewTags;
  NSMutableArray<ABI20_0_0RCTViewManagerUIBlock> *_pendingUIBlocks;

  // Animation
  ABI20_0_0RCTLayoutAnimationGroup *_layoutAnimationGroup; // Main thread only
  NSMutableSet<UIView *> *_viewsToBeDeleted; // Main thread only

  NSMutableDictionary<NSNumber *, ABI20_0_0RCTShadowView *> *_shadowViewRegistry; // ABI20_0_0RCT thread only
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry; // Main thread only

  // Keyed by viewName
  NSDictionary *_componentDataByName;

  NSMutableSet<id<ABI20_0_0RCTComponent>> *_bridgeTransactionListeners;
}

@synthesize bridge = _bridge;

ABI20_0_0RCT_EXPORT_MODULE()

- (void)didReceiveNewContentSizeMultiplier
{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateContentSizeMultiplier"
                                              body:@([_bridge.accessibilityManager multiplier])];
#pragma clang diagnostic pop

  dispatch_async(ABI20_0_0RCTGetUIManagerQueue(), ^{
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI20_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
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
    ABI20_0_0RCT_PROFILE_BEGIN_EVENT(ABI20_0_0RCTProfileTagAlways, @"UIManager invalidate", nil);
    for (NSNumber *rootViewTag in self->_rootViewTags) {
      [(id<ABI20_0_0RCTInvalidating>)self->_viewRegistry[rootViewTag] invalidate];
    }

    self->_rootViewTags = nil;
    self->_shadowViewRegistry = nil;
    self->_viewRegistry = nil;
    self->_bridgeTransactionListeners = nil;
    self->_bridge = nil;

    [[NSNotificationCenter defaultCenter] removeObserver:self];
    ABI20_0_0RCT_PROFILE_END_EVENT(ABI20_0_0RCTProfileTagAlways, @"");
  });
}

- (NSMutableDictionary<NSNumber *, ABI20_0_0RCTShadowView *> *)shadowViewRegistry
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

- (void)setBridge:(ABI20_0_0RCTBridge *)bridge
{
  ABI20_0_0RCTAssert(_bridge == nil, @"Should not re-use same UIIManager instance");

  _bridge = bridge;

  _shadowViewRegistry = [NSMutableDictionary new];
  _viewRegistry = [NSMutableDictionary new];

  // Internal resources
  _pendingUIBlocks = [NSMutableArray new];
  _rootViewTags = [NSMutableSet new];

  _bridgeTransactionListeners = [NSMutableSet new];
  _observerCoordinator = [ABI20_0_0RCTUIManagerObserverCoordinator new];

  _viewsToBeDeleted = [NSMutableSet new];

  // Get view managers from bridge
  NSMutableDictionary *componentDataByName = [NSMutableDictionary new];
  for (Class moduleClass in _bridge.moduleClasses) {
    if ([moduleClass isSubclassOfClass:[ABI20_0_0RCTViewManager class]]) {
      ABI20_0_0RCTComponentData *componentData = [[ABI20_0_0RCTComponentData alloc] initWithManagerClass:moduleClass
                                                                                bridge:_bridge];
      componentDataByName[componentData.name] = componentData;
    }
  }

  _componentDataByName = [componentDataByName copy];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:ABI20_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
  [ABI20_0_0RCTLayoutAnimation initializeStatics];
}

dispatch_queue_t ABI20_0_0RCTGetUIManagerQueue(void)
{
  static dispatch_queue_t shadowQueue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if ([NSOperation instancesRespondToSelector:@selector(qualityOfService)]) {
      dispatch_queue_attr_t attr = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, 0);
      shadowQueue = dispatch_queue_create(ABI20_0_0RCTUIManagerQueueName, attr);
    } else {
      shadowQueue = dispatch_queue_create(ABI20_0_0RCTUIManagerQueueName, DISPATCH_QUEUE_SERIAL);
      dispatch_set_target_queue(shadowQueue, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0));
    }
  });
  return shadowQueue;
}

BOOL ABI20_0_0RCTIsUIManagerQueue()
{
  static void *queueKey = &queueKey;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_set_specific(ABI20_0_0RCTGetUIManagerQueue(), queueKey, queueKey, NULL);
  });
  return dispatch_get_specific(queueKey) == queueKey;
}

- (dispatch_queue_t)methodQueue
{
  return ABI20_0_0RCTGetUIManagerQueue();
}

- (void)registerRootView:(ABI20_0_0RCTRootContentView *)rootView
{
  ABI20_0_0RCTAssertMainQueue();

  NSNumber *ReactABI20_0_0Tag = rootView.ReactABI20_0_0Tag;
  ABI20_0_0RCTAssert(ABI20_0_0RCTIsReactABI20_0_0RootView(ReactABI20_0_0Tag),
            @"View %@ with tag #%@ is not a root view", rootView, ReactABI20_0_0Tag);

  UIView *existingView = _viewRegistry[ReactABI20_0_0Tag];
  ABI20_0_0RCTAssert(existingView == nil || existingView == rootView,
            @"Expect all root views to have unique tag. Added %@ twice", ReactABI20_0_0Tag);

  CGSize availableSize = rootView.availableSize;

  // Register view
  _viewRegistry[ReactABI20_0_0Tag] = rootView;

  // Register shadow view
  dispatch_async(ABI20_0_0RCTGetUIManagerQueue(), ^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI20_0_0RCTRootShadowView *shadowView = [ABI20_0_0RCTRootShadowView new];
    shadowView.availableSize = availableSize;
    shadowView.ReactABI20_0_0Tag = ReactABI20_0_0Tag;
    shadowView.backgroundColor = rootView.backgroundColor;
    shadowView.viewName = NSStringFromClass([rootView class]);
    self->_shadowViewRegistry[shadowView.ReactABI20_0_0Tag] = shadowView;
    [self->_rootViewTags addObject:ReactABI20_0_0Tag];
  });

  [[NSNotificationCenter defaultCenter] postNotificationName:ABI20_0_0RCTUIManagerDidRegisterRootViewNotification
                                                      object:self
                                                    userInfo:@{ABI20_0_0RCTUIManagerRootViewKey: rootView}];
}

- (NSString *)viewNameForReactABI20_0_0Tag:(NSNumber *)ReactABI20_0_0Tag
{
  ABI20_0_0RCTAssertThread(ABI20_0_0RCTGetUIManagerQueue(), @"viewNameForReactABI20_0_0Tag can only be called from the shadow queue");
  return _shadowViewRegistry[ReactABI20_0_0Tag].viewName;
}

- (UIView *)viewForReactABI20_0_0Tag:(NSNumber *)ReactABI20_0_0Tag
{
  ABI20_0_0RCTAssertMainQueue();
  return _viewRegistry[ReactABI20_0_0Tag];
}

- (ABI20_0_0RCTShadowView *)shadowViewForReactABI20_0_0Tag:(NSNumber *)ReactABI20_0_0Tag
{
  ABI20_0_0RCTAssertUIManagerQueue();
  return _shadowViewRegistry[ReactABI20_0_0Tag];
}

- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView
{
  ABI20_0_0RCTAssertMainQueue();
  NSNumber *ReactABI20_0_0Tag = rootView.ReactABI20_0_0Tag;
  dispatch_async(ABI20_0_0RCTGetUIManagerQueue(), ^{
    ABI20_0_0RCTRootShadowView *shadowView = (ABI20_0_0RCTRootShadowView *)self->_shadowViewRegistry[ReactABI20_0_0Tag];
    ABI20_0_0RCTAssert(shadowView != nil, @"Could not locate shadow view with tag #%@", ReactABI20_0_0Tag);
    ABI20_0_0RCTAssert([shadowView isKindOfClass:[ABI20_0_0RCTRootShadowView class]], @"Located shadow view (with tag #%@) is actually not root view.", ReactABI20_0_0Tag);

    if (CGSizeEqualToSize(availableSize, shadowView.availableSize)) {
      return;
    }

    shadowView.availableSize = availableSize;
    [self setNeedsLayout];
  });
}

/**
 * TODO(yuwang): implement the nativeID functionality in a more efficient way
 *               instead of searching the whole view tree
 */
- (UIView *)viewForNativeID:(NSString *)nativeID withRootTag:(NSNumber *)rootTag
{
  ABI20_0_0RCTAssertMainQueue();
  UIView *view = [self viewForReactABI20_0_0Tag:rootTag];
  return [self _lookupViewForNativeID:nativeID inView:view];
}

- (UIView *)_lookupViewForNativeID:(NSString *)nativeID inView:(UIView *)view
{
  ABI20_0_0RCTAssertMainQueue();
  if (view != nil && [nativeID isEqualToString:view.nativeID]) {
    return view;
  }

  for (UIView *subview in view.subviews) {
    UIView *targetView = [self _lookupViewForNativeID:nativeID inView:subview];
    if (targetView != nil) {
      return targetView;
    }
  }
  return nil;
}

- (void)setSize:(CGSize)size forView:(UIView *)view
{
  ABI20_0_0RCTAssertMainQueue();

  NSNumber *ReactABI20_0_0Tag = view.ReactABI20_0_0Tag;
  dispatch_async(ABI20_0_0RCTGetUIManagerQueue(), ^{
    ABI20_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI20_0_0Tag];
    ABI20_0_0RCTAssert(shadowView != nil, @"Could not locate shadow view with tag #%@", ReactABI20_0_0Tag);

    if (CGSizeEqualToSize(size, shadowView.size)) {
      return;
    }

    shadowView.size = size;
    [self setNeedsLayout];
  });
}

- (void)setIntrinsicContentSize:(CGSize)size forView:(UIView *)view
{
  ABI20_0_0RCTAssertMainQueue();

  NSNumber *ReactABI20_0_0Tag = view.ReactABI20_0_0Tag;
  dispatch_async(ABI20_0_0RCTGetUIManagerQueue(), ^{
    ABI20_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI20_0_0Tag];
    ABI20_0_0RCTAssert(shadowView != nil, @"Could not locate view with tag #%@", ReactABI20_0_0Tag);

    if (!CGSizeEqualToSize(shadowView.intrinsicContentSize, size)) {
      shadowView.intrinsicContentSize = size;
      [self setNeedsLayout];
    }
  });
}

- (void)setBackgroundColor:(UIColor *)color forView:(UIView *)view
{
  ABI20_0_0RCTAssertMainQueue();

  NSNumber *ReactABI20_0_0Tag = view.ReactABI20_0_0Tag;
  dispatch_async(ABI20_0_0RCTGetUIManagerQueue(), ^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI20_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI20_0_0Tag];
    ABI20_0_0RCTAssert(shadowView != nil, @"Could not locate root view with tag #%@", ReactABI20_0_0Tag);
    shadowView.backgroundColor = color;
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:shadowView];
    [self flushUIBlocks];
  });
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray<id<ABI20_0_0RCTComponent>> *)children
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *)registry
{
  for (id<ABI20_0_0RCTComponent> child in children) {
    ABI20_0_0RCTTraverseViewNodes(registry[child.ReactABI20_0_0Tag], ^(id<ABI20_0_0RCTComponent> subview) {
      ABI20_0_0RCTAssert(![subview isReactABI20_0_0RootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(ABI20_0_0RCTInvalidating)]) {
        [(id<ABI20_0_0RCTInvalidating>)subview invalidate];
      }
      [registry removeObjectForKey:subview.ReactABI20_0_0Tag];

      if (registry == (NSMutableDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *)self->_viewRegistry) {
        [self->_bridgeTransactionListeners removeObject:subview];
      }
    });
  }
}

- (void)addUIBlock:(ABI20_0_0RCTViewManagerUIBlock)block
{
  ABI20_0_0RCTAssertThread(ABI20_0_0RCTGetUIManagerQueue(),
                  @"-[ABI20_0_0RCTUIManager addUIBlock:] should only be called from the "
                  "UIManager's queue (get this using `ABI20_0_0RCTGetUIManagerQueue()`)");

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks addObject:block];
}

- (void)prependUIBlock:(ABI20_0_0RCTViewManagerUIBlock)block
{
  ABI20_0_0RCTAssertThread(ABI20_0_0RCTGetUIManagerQueue(),
                  @"-[ABI20_0_0RCTUIManager prependUIBlock:] should only be called from the "
                  "UIManager's queue (get this using `ABI20_0_0RCTGetUIManagerQueue()`)");

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks insertObject:block atIndex:0];
}

- (void)setNextLayoutAnimationGroup:(ABI20_0_0RCTLayoutAnimationGroup *)layoutAnimationGroup
{
  ABI20_0_0RCTAssertMainQueue();

  if (_layoutAnimationGroup && ![_layoutAnimationGroup isEqual:layoutAnimationGroup]) {
    ABI20_0_0RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.",
      [_layoutAnimationGroup description],
      [layoutAnimationGroup description]);
  }

  _layoutAnimationGroup = layoutAnimationGroup;
}

- (ABI20_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI20_0_0RCTRootShadowView *)rootShadowView
{
  ABI20_0_0RCTAssert(!ABI20_0_0RCTIsMainQueue(), @"Should be called on shadow queue");

  // This is nuanced. In the JS thread, we create a new update buffer
  // `frameTags`/`frames` that is created/mutated in the JS thread. We access
  // these structures in the UI-thread block. `NSMutableArray` is not thread
  // safe so we rely on the fact that we never mutate it after it's passed to
  // the main thread.
  NSSet<ABI20_0_0RCTShadowView *> *viewsWithNewFrames = [rootShadowView collectViewsWithUpdatedFrames];

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
  } ABI20_0_0RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = viewsWithNewFrames.count;
  NSMutableArray *ReactABI20_0_0Tags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(ABI20_0_0RCTFrameData) * count];
  {
    NSUInteger index = 0;
    ABI20_0_0RCTFrameData *frameDataArray = (ABI20_0_0RCTFrameData *)framesData.mutableBytes;
    for (ABI20_0_0RCTShadowView *shadowView in viewsWithNewFrames) {
      ReactABI20_0_0Tags[index] = shadowView.ReactABI20_0_0Tag;
      frameDataArray[index++] = (ABI20_0_0RCTFrameData){
        shadowView.frame,
        shadowView.effectiveLayoutDirection,
        shadowView.isNewView,
        shadowView.superview.isNewView,
        shadowView.isHidden,
      };
    }
  }

  // These are blocks to be executed on each view, immediately after
  // ReactABI20_0_0SetFrame: has been called. Note that if ReactABI20_0_0SetFrame: is not called,
  // these won't be called either, so this is not a suitable place to update
  // properties that aren't related to layout.
  NSMutableDictionary<NSNumber *, ABI20_0_0RCTViewManagerUIBlock> *updateBlocks =
  [NSMutableDictionary new];
  for (ABI20_0_0RCTShadowView *shadowView in viewsWithNewFrames) {

    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *ReactABI20_0_0Tag = shadowView.ReactABI20_0_0Tag;
    ABI20_0_0RCTViewManager *manager = [_componentDataByName[shadowView.viewName] manager];
    ABI20_0_0RCTViewManagerUIBlock block = [manager uiBlockToAmendWithShadowView:shadowView];
    if (block) {
      updateBlocks[ReactABI20_0_0Tag] = block;
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

    if (ABI20_0_0RCTIsReactABI20_0_0RootView(ReactABI20_0_0Tag)) {
      CGSize contentSize = shadowView.frame.size;

      dispatch_async(dispatch_get_main_queue(), ^{
        UIView *view = self->_viewRegistry[ReactABI20_0_0Tag];
        ABI20_0_0RCTAssert(view != nil, @"view (for ID %@) not found", ReactABI20_0_0Tag);

        ABI20_0_0RCTRootView *rootView = (ABI20_0_0RCTRootView *)[view superview];
        rootView.intrinsicContentSize = contentSize;
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    const ABI20_0_0RCTFrameData *frameDataArray = (const ABI20_0_0RCTFrameData *)framesData.bytes;
    ABI20_0_0RCTLayoutAnimationGroup *layoutAnimationGroup = uiManager->_layoutAnimationGroup;

    __block NSUInteger completionsCalled = 0;

    NSInteger index = 0;
    for (NSNumber *ReactABI20_0_0Tag in ReactABI20_0_0Tags) {
      ABI20_0_0RCTFrameData frameData = frameDataArray[index++];

      UIView *view = viewRegistry[ReactABI20_0_0Tag];
      CGRect frame = frameData.frame;

      BOOL isHidden = frameData.isHidden;
      UIUserInterfaceLayoutDirection layoutDirection = frameData.layoutDirection;
      BOOL isNew = frameData.isNew;
      ABI20_0_0RCTLayoutAnimation *updatingLayoutAnimation = isNew ? nil : layoutAnimationGroup.updatingLayoutAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      ABI20_0_0RCTLayoutAnimation *creatingLayoutAnimation = shouldAnimateCreation ? layoutAnimationGroup.creatingLayoutAnimation : nil;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (layoutAnimationGroup.callback && completionsCalled == count) {
          layoutAnimationGroup.callback(@[@(finished)]);

          // It's unsafe to call this callback more than once, so we nil it out here
          // to make sure that doesn't happen.
          layoutAnimationGroup.callback = nil;
        }
      };

      if (view.isHidden != isHidden) {
        view.hidden = isHidden;
      }

      if (view.ReactABI20_0_0LayoutDirection != layoutDirection) {
        view.ReactABI20_0_0LayoutDirection = layoutDirection;
      }

      ABI20_0_0RCTViewManagerUIBlock updateBlock = updateBlocks[ReactABI20_0_0Tag];
      if (creatingLayoutAnimation) {

        // Animate view creation
        [view ReactABI20_0_0SetFrame:frame];

        CATransform3D finalTransform = view.layer.transform;
        CGFloat finalOpacity = view.layer.opacity;

        NSString *property = creatingLayoutAnimation.property;
        if ([property isEqualToString:@"scaleXY"]) {
          view.layer.transform = CATransform3DMakeScale(0, 0, 0);
        } else if ([property isEqualToString:@"opacity"]) {
          view.layer.opacity = 0.0;
        } else {
          ABI20_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
                      creatingLayoutAnimation.property);
        }

        [creatingLayoutAnimation performAnimations:^{
          if ([property isEqualToString:@"scaleXY"]) {
            view.layer.transform = finalTransform;
          } else if ([property isEqualToString:@"opacity"]) {
            view.layer.opacity = finalOpacity;
          }
          if (updateBlock) {
            updateBlock(self, viewRegistry);
          }
        } withCompletionBlock:completion];

      } else if (updatingLayoutAnimation) {

        // Animate view update
        [updatingLayoutAnimation performAnimations:^{
          [view ReactABI20_0_0SetFrame:frame];
          if (updateBlock) {
            updateBlock(self, viewRegistry);
          }
        } withCompletionBlock:completion];

      } else {

        // Update without animation
        [view ReactABI20_0_0SetFrame:frame];
        if (updateBlock) {
          updateBlock(self, viewRegistry);
        }
        completion(YES);
      }
    }

    // Clean up
    uiManager->_layoutAnimationGroup = nil;
  };
}

- (void)_amendPendingUIBlocksWithStylePropagationUpdateForShadowView:(ABI20_0_0RCTShadowView *)topView
{
  NSMutableSet<ABI20_0_0RCTApplierBlock> *applierBlocks = [NSMutableSet setWithCapacity:1];
  [topView collectUpdatedProperties:applierBlocks parentProperties:@{}];

  if (applierBlocks.count) {
    [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      for (ABI20_0_0RCTApplierBlock block in applierBlocks) {
        block(viewRegistry);
      }
    }];
  }
}

/**
 * A method to be called from JS, which takes a container ID and then releases
 * all subviews for that container upon receipt.
 */
ABI20_0_0RCT_EXPORT_METHOD(removeSubviewsFromContainerWithID:(nonnull NSNumber *)containerID)
{
  id<ABI20_0_0RCTComponent> container = _shadowViewRegistry[containerID];
  ABI20_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", containerID);

  NSUInteger subviewsCount = [container ReactABI20_0_0Subviews].count;
  NSMutableArray<NSNumber *> *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
  for (NSUInteger childIndex = 0; childIndex < subviewsCount; childIndex++) {
    [indices addObject:@(childIndex)];
  }

  [self manageChildren:containerID
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI20_0_0Tags:nil
          addAtIndices:nil
       removeAtIndices:indices];
}

/**
 * Disassociates children from container. Doesn't remove from registries.
 * TODO: use [NSArray getObjects:buffer] to reuse same fast buffer each time.
 *
 * @returns Array of removed items.
 */
- (NSArray<id<ABI20_0_0RCTComponent>> *)_childrenToRemoveFromContainer:(id<ABI20_0_0RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if (atIndices.count == 0 || [container ReactABI20_0_0Subviews].count == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray<id<ABI20_0_0RCTComponent>> *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  ABI20_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSNumber *indexNumber in atIndices) {
    NSUInteger index = indexNumber.unsignedIntegerValue;
    if (index < [container ReactABI20_0_0Subviews].count) {
      [removedChildren addObject:[container ReactABI20_0_0Subviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    NSString *message = [NSString stringWithFormat:@"removedChildren count (%tu) was not what we expected (%tu)",
                         removedChildren.count, atIndices.count];
    ABI20_0_0RCTFatal(ABI20_0_0RCTErrorWithMessage(message));
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray<id<ABI20_0_0RCTComponent>> *)children
          fromContainer:(id<ABI20_0_0RCTComponent>)container
{
  for (id<ABI20_0_0RCTComponent> removedChild in children) {
    [container removeReactABI20_0_0Subview:removedChild];
  }
}

/**
 * Remove subviews from their parent with an animation.
 */
- (void)_removeChildren:(NSArray<UIView *> *)children
          fromContainer:(UIView *)container
          withAnimation:(ABI20_0_0RCTLayoutAnimationGroup *)animation
{
  ABI20_0_0RCTAssertMainQueue();
  ABI20_0_0RCTLayoutAnimation *deletingLayoutAnimation = animation.deletingLayoutAnimation;

  __block NSUInteger completionsCalled = 0;
  for (UIView *removedChild in children) {

    void (^completion)(BOOL) = ^(BOOL finished) {
      completionsCalled++;

      [self->_viewsToBeDeleted removeObject:removedChild];
      [container removeReactABI20_0_0Subview:removedChild];

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

    NSString *property = deletingLayoutAnimation.property;
    [deletingLayoutAnimation performAnimations:^{
      if ([property isEqualToString:@"scaleXY"]) {
        removedChild.layer.transform = CATransform3DMakeScale(0.001, 0.001, 0.001);
      } else if ([property isEqualToString:@"opacity"]) {
        removedChild.layer.opacity = 0.0;
      } else {
        ABI20_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
                    deletingLayoutAnimation.property);
      }
    } withCompletionBlock:completion];
  }
}


ABI20_0_0RCT_EXPORT_METHOD(removeRootView:(nonnull NSNumber *)rootReactABI20_0_0Tag)
{
  ABI20_0_0RCTShadowView *rootShadowView = _shadowViewRegistry[rootReactABI20_0_0Tag];
  ABI20_0_0RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootReactABI20_0_0Tag);
  [self _purgeChildren:(NSArray<id<ABI20_0_0RCTComponent>> *)rootShadowView.ReactABI20_0_0Subviews
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *)_shadowViewRegistry];
  [_shadowViewRegistry removeObjectForKey:rootReactABI20_0_0Tag];
  [_rootViewTags removeObject:rootReactABI20_0_0Tag];

  [self addUIBlock:^(ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    ABI20_0_0RCTAssertMainQueue();
    UIView *rootView = viewRegistry[rootReactABI20_0_0Tag];
    [uiManager _purgeChildren:(NSArray<id<ABI20_0_0RCTComponent>> *)rootView.ReactABI20_0_0Subviews
                 fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *)viewRegistry];
    [(NSMutableDictionary *)viewRegistry removeObjectForKey:rootReactABI20_0_0Tag];

    [[NSNotificationCenter defaultCenter] postNotificationName:ABI20_0_0RCTUIManagerDidRemoveRootViewNotification
                                                        object:uiManager
                                                      userInfo:@{ABI20_0_0RCTUIManagerRootViewKey: rootView}];
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(replaceExistingNonRootView:(nonnull NSNumber *)ReactABI20_0_0Tag
                  withView:(nonnull NSNumber *)newReactABI20_0_0Tag)
{
  ABI20_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI20_0_0Tag];
  ABI20_0_0RCTAssert(shadowView != nil, @"shadowView (for ID %@) not found", ReactABI20_0_0Tag);

  ABI20_0_0RCTShadowView *superShadowView = shadowView.superview;
  if (!superShadowView) {
    ABI20_0_0RCTAssert(NO, @"shadowView super (of ID %@) not found", ReactABI20_0_0Tag);
    return;
  }

  NSUInteger indexOfView = [superShadowView.ReactABI20_0_0Subviews indexOfObject:shadowView];
  ABI20_0_0RCTAssert(indexOfView != NSNotFound, @"View's superview doesn't claim it as subview (id %@)", ReactABI20_0_0Tag);
  NSArray<NSNumber *> *removeAtIndices = @[@(indexOfView)];
  NSArray<NSNumber *> *addTags = @[newReactABI20_0_0Tag];
  [self manageChildren:superShadowView.ReactABI20_0_0Tag
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI20_0_0Tags:addTags
          addAtIndices:removeAtIndices
       removeAtIndices:removeAtIndices];
}

ABI20_0_0RCT_EXPORT_METHOD(setChildren:(nonnull NSNumber *)containerTag
                  ReactABI20_0_0Tags:(NSArray<NSNumber *> *)ReactABI20_0_0Tags)
{
  ABI20_0_0RCTSetChildren(containerTag, ReactABI20_0_0Tags,
                 (NSDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *)_shadowViewRegistry);

  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){

    ABI20_0_0RCTSetChildren(containerTag, ReactABI20_0_0Tags,
                   (NSDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *)viewRegistry);
  }];
}

static void ABI20_0_0RCTSetChildren(NSNumber *containerTag,
                           NSArray<NSNumber *> *ReactABI20_0_0Tags,
                           NSDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *registry)
{
  id<ABI20_0_0RCTComponent> container = registry[containerTag];
  NSInteger index = 0;
  for (NSNumber *ReactABI20_0_0Tag in ReactABI20_0_0Tags) {
    id<ABI20_0_0RCTComponent> view = registry[ReactABI20_0_0Tag];
    if (view) {
      [container insertReactABI20_0_0Subview:view atIndex:index++];
    }
  }
}

ABI20_0_0RCT_EXPORT_METHOD(manageChildren:(nonnull NSNumber *)containerTag
                  moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
                  moveToIndices:(NSArray<NSNumber *> *)moveToIndices
                  addChildReactABI20_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI20_0_0Tags
                  addAtIndices:(NSArray<NSNumber *> *)addAtIndices
                  removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices)
{
  [self _manageChildren:containerTag
        moveFromIndices:moveFromIndices
          moveToIndices:moveToIndices
      addChildReactABI20_0_0Tags:addChildReactABI20_0_0Tags
           addAtIndices:addAtIndices
        removeAtIndices:removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *)_shadowViewRegistry];

  [self addUIBlock:^(ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    [uiManager _manageChildren:containerTag
               moveFromIndices:moveFromIndices
                 moveToIndices:moveToIndices
             addChildReactABI20_0_0Tags:addChildReactABI20_0_0Tags
                  addAtIndices:addAtIndices
               removeAtIndices:removeAtIndices
                      registry:(NSMutableDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *)viewRegistry];
  }];
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildReactABI20_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI20_0_0Tags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI20_0_0RCTComponent>> *)registry
{
  id<ABI20_0_0RCTComponent> container = registry[containerTag];
  ABI20_0_0RCTAssert(moveFromIndices.count == moveToIndices.count, @"moveFromIndices had size %tu, moveToIndices had size %tu", moveFromIndices.count, moveToIndices.count);
  ABI20_0_0RCTAssert(addChildReactABI20_0_0Tags.count == addAtIndices.count, @"there should be at least one ReactABI20_0_0 child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray<id<ABI20_0_0RCTComponent>> *permanentlyRemovedChildren =
    [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
  NSArray<id<ABI20_0_0RCTComponent>> *temporarilyRemovedChildren =
    [self _childrenToRemoveFromContainer:container atIndices:moveFromIndices];

  BOOL isUIViewRegistry = ((id)registry == (id)_viewRegistry);
  if (isUIViewRegistry && _layoutAnimationGroup.deletingLayoutAnimation) {
    [self _removeChildren:(NSArray<UIView *> *)permanentlyRemovedChildren
            fromContainer:(UIView *)container
            withAnimation:_layoutAnimationGroup];
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
    id<ABI20_0_0RCTComponent> view = registry[addChildReactABI20_0_0Tags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray<NSNumber *> *sortedIndices =
    [destinationsToChildrenToAdd.allKeys sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *ReactABI20_0_0Index in sortedIndices) {
    NSInteger insertAtIndex = ReactABI20_0_0Index.integerValue;

    // When performing a delete animation, views are not removed immediately
    // from their container so we need to offset the insertion index if a view
    // that will be removed appears earlier than the view we are inserting.
    if (isUIViewRegistry && _viewsToBeDeleted.count > 0) {
      for (NSInteger index = 0; index < insertAtIndex; index++) {
        UIView *subview = ((UIView *)container).ReactABI20_0_0Subviews[index];
        if ([_viewsToBeDeleted containsObject:subview]) {
          insertAtIndex++;
        }
      }
    }

    [container insertReactABI20_0_0Subview:destinationsToChildrenToAdd[ReactABI20_0_0Index]
                          atIndex:insertAtIndex];
  }
}

ABI20_0_0RCT_EXPORT_METHOD(createView:(nonnull NSNumber *)ReactABI20_0_0Tag
                  viewName:(NSString *)viewName
                  rootTag:(__unused NSNumber *)rootTag
                  props:(NSDictionary *)props)
{
  ABI20_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  if (componentData == nil) {
    ABI20_0_0RCTLogError(@"No component found for view with name \"%@\"", viewName);
  }

  // Register shadow view
  ABI20_0_0RCTShadowView *shadowView = [componentData createShadowViewWithTag:ReactABI20_0_0Tag];
  if (shadowView) {
    [componentData setProps:props forShadowView:shadowView];
    _shadowViewRegistry[ReactABI20_0_0Tag] = shadowView;
  }

  // Shadow view is the source of truth for background color this is a little
  // bit counter-intuitive if people try to set background color when setting up
  // the view, but it's the only way that makes sense given our threading model
  UIColor *backgroundColor = shadowView.backgroundColor;

  // Dispatch view creation directly to the main thread instead of adding to
  // UIBlocks array. This way, it doesn't get deferred until after layout.
  __weak ABI20_0_0RCTUIManager *weakManager = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI20_0_0RCTUIManager *uiManager = weakManager;
    if (!uiManager) {
      return;
    }
    UIView *view = [componentData createViewWithTag:ReactABI20_0_0Tag];
    if (view) {
      [componentData setProps:props forView:view]; // Must be done before bgColor to prevent wrong default
      if ([view respondsToSelector:@selector(setBackgroundColor:)]) {
        ((UIView *)view).backgroundColor = backgroundColor;
      }
      if ([view respondsToSelector:@selector(ReactABI20_0_0BridgeDidFinishTransaction)]) {
        [uiManager->_bridgeTransactionListeners addObject:view];
      }
      uiManager->_viewRegistry[ReactABI20_0_0Tag] = view;

#if ABI20_0_0RCT_DEV
      [view _DEBUG_setReactABI20_0_0ShadowView:shadowView];
#endif
    }
  });
}

ABI20_0_0RCT_EXPORT_METHOD(updateView:(nonnull NSNumber *)ReactABI20_0_0Tag
                  viewName:(NSString *)viewName // not always reliable, use shadowView.viewName if available
                  props:(NSDictionary *)props)
{
  ABI20_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI20_0_0Tag];
  ABI20_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName ?: viewName];
  [componentData setProps:props forShadowView:shadowView];

  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI20_0_0Tag];
    [componentData setProps:props forView:view];
  }];
}

- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)ReactABI20_0_0Tag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props
{
  ABI20_0_0RCTAssertMainQueue();
  ABI20_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  UIView *view = _viewRegistry[ReactABI20_0_0Tag];
  [componentData setProps:props forView:view];
}

ABI20_0_0RCT_EXPORT_METHOD(focus:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *newResponder = viewRegistry[ReactABI20_0_0Tag];
    [newResponder ReactABI20_0_0Focus];
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(blur:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *currentResponder = viewRegistry[ReactABI20_0_0Tag];
    [currentResponder ReactABI20_0_0Blur];
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(findSubviewIn:(nonnull NSNumber *)ReactABI20_0_0Tag atPoint:(CGPoint)point callback:(ABI20_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI20_0_0Tag];
    UIView *target = [view hitTest:point withEvent:nil];
    CGRect frame = [target convertRect:target.bounds toView:view];

    while (target.ReactABI20_0_0Tag == nil && target.superview != nil) {
      target = target.superview;
    }

    callback(@[
      ABI20_0_0RCTNullIfNil(target.ReactABI20_0_0Tag),
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
    ]);
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(dispatchViewManagerCommand:(nonnull NSNumber *)ReactABI20_0_0Tag
                  commandID:(NSInteger)commandID
                  commandArgs:(NSArray<id> *)commandArgs)
{
  ABI20_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI20_0_0Tag];
  ABI20_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName];
  Class managerClass = componentData.managerClass;
  ABI20_0_0RCTModuleData *moduleData = [_bridge moduleDataForName:ABI20_0_0RCTBridgeModuleNameForClass(managerClass)];
  id<ABI20_0_0RCTBridgeMethod> method = moduleData.methods[commandID];

  NSArray *args = [@[ReactABI20_0_0Tag] arrayByAddingObjectsFromArray:commandArgs];
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
  for (ABI20_0_0RCTComponentData *componentData in _componentDataByName.allValues) {
    ABI20_0_0RCTViewManagerUIBlock uiBlock = [componentData uiBlockToAmendWithShadowViewRegistry:_shadowViewRegistry];
    [self addUIBlock:uiBlock];
  }

  [_observerCoordinator uiManagerWillPerformLayout:self];

  // Perform layout
  for (NSNumber *ReactABI20_0_0Tag in _rootViewTags) {
    ABI20_0_0RCTRootShadowView *rootView = (ABI20_0_0RCTRootShadowView *)_shadowViewRegistry[ReactABI20_0_0Tag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
  }

  [_observerCoordinator uiManagerDidPerformLayout:self];

  // Properies propagation
  for (NSNumber *ReactABI20_0_0Tag in _rootViewTags) {
    ABI20_0_0RCTRootShadowView *rootView = (ABI20_0_0RCTRootShadowView *)_shadowViewRegistry[ReactABI20_0_0Tag];
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:rootView];
  }

  [self addUIBlock:^(ABI20_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    /**
     * TODO(tadeu): Remove it once and for all
     */
    for (id<ABI20_0_0RCTComponent> node in uiManager->_bridgeTransactionListeners) {
      [node ReactABI20_0_0BridgeDidFinishTransaction];
    }
  }];

  [_observerCoordinator uiManagerWillFlushUIBlocks:self];

  [self flushUIBlocks];
}

- (void)flushUIBlocks
{
  ABI20_0_0RCTAssertThread(ABI20_0_0RCTGetUIManagerQueue(),
                  @"flushUIBlocks can only be called from the shadow queue");

  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  NSArray<ABI20_0_0RCTViewManagerUIBlock> *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [NSMutableArray new];

  if (previousPendingUIBlocks.count) {
    // Execute the previously queued UI blocks
    ABI20_0_0RCTProfileBeginFlowEvent();
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI20_0_0RCTProfileEndFlowEvent();
      ABI20_0_0RCT_PROFILE_BEGIN_EVENT(ABI20_0_0RCTProfileTagAlways, @"-[UIManager flushUIBlocks]", (@{
        @"count": [@(previousPendingUIBlocks.count) stringValue],
      }));
      @try {
        for (ABI20_0_0RCTViewManagerUIBlock block in previousPendingUIBlocks) {
          block(self, self->_viewRegistry);
        }
      }
      @catch (NSException *exception) {
        ABI20_0_0RCTLogError(@"Exception thrown while executing UI block: %@", exception);
      }
      ABI20_0_0RCT_PROFILE_END_EVENT(ABI20_0_0RCTProfileTagAlways, @"");
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

ABI20_0_0RCT_EXPORT_METHOD(measure:(nonnull NSNumber *)ReactABI20_0_0Tag
                  callback:(ABI20_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI20_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI20_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI20_0_0Tag);
      callback(@[]);
      return;
    }

    // If in a <Modal>, rootView will be the root of the modal container.
    UIView *rootView = view;
    while (rootView.superview && ![rootView isReactABI20_0_0RootView]) {
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

ABI20_0_0RCT_EXPORT_METHOD(measureInWindow:(nonnull NSNumber *)ReactABI20_0_0Tag
                  callback:(ABI20_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI20_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI20_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI20_0_0Tag);
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
ABI20_0_0RCT_EXPORT_METHOD(viewIsDescendantOf:(nonnull NSNumber *)ReactABI20_0_0Tag
                  ancestor:(nonnull NSNumber *)ancestorReactABI20_0_0Tag
                  callback:(ABI20_0_0RCTResponseSenderBlock)callback)
{
  ABI20_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI20_0_0Tag];
  ABI20_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI20_0_0Tag];
  if (!shadowView) {
    return;
  }
  if (!ancestorShadowView) {
    return;
  }
  BOOL viewIsAncestor = [shadowView viewIsDescendantOf:ancestorShadowView];
  callback(@[@(viewIsAncestor)]);
}

static void ABI20_0_0RCTMeasureLayout(ABI20_0_0RCTShadowView *view,
                             ABI20_0_0RCTShadowView *ancestor,
                             ABI20_0_0RCTResponseSenderBlock callback)
{
  if (!view) {
    return;
  }
  if (!ancestor) {
    return;
  }
  CGRect result = [view measureLayoutRelativeToAncestor:ancestor];
  if (CGRectIsNull(result)) {
    ABI20_0_0RCTLogError(@"view %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                view, view.ReactABI20_0_0Tag, ancestor, ancestor.ReactABI20_0_0Tag);
    return;
  }
  CGFloat leftOffset = result.origin.x;
  CGFloat topOffset = result.origin.y;
  CGFloat width = result.size.width;
  CGFloat height = result.size.height;
  if (isnan(leftOffset) || isnan(topOffset) || isnan(width) || isnan(height)) {
    ABI20_0_0RCTLogError(@"Attempted to measure layout but offset or dimensions were NaN");
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
ABI20_0_0RCT_EXPORT_METHOD(measureLayout:(nonnull NSNumber *)ReactABI20_0_0Tag
                  relativeTo:(nonnull NSNumber *)ancestorReactABI20_0_0Tag
                  errorCallback:(__unused ABI20_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI20_0_0RCTResponseSenderBlock)callback)
{
  ABI20_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI20_0_0Tag];
  ABI20_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI20_0_0Tag];
  ABI20_0_0RCTMeasureLayout(shadowView, ancestorShadowView, callback);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
ABI20_0_0RCT_EXPORT_METHOD(measureLayoutRelativeToParent:(nonnull NSNumber *)ReactABI20_0_0Tag
                  errorCallback:(__unused ABI20_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI20_0_0RCTResponseSenderBlock)callback)
{
  ABI20_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI20_0_0Tag];
  ABI20_0_0RCTMeasureLayout(shadowView, shadowView.ReactABI20_0_0Superview, callback);
}

/**
 * Returns an array of computed offset layouts in a dictionary form. The layouts are of any ReactABI20_0_0 subviews
 * that are immediate descendants to the parent view found within a specified rect. The dictionary result
 * contains left, top, width, height and an index. The index specifies the position among the other subviews.
 * Only layouts for views that are within the rect passed in are returned. Invokes the error callback if the
 * passed in parent view does not exist. Invokes the supplied callback with the array of computed layouts.
 */
ABI20_0_0RCT_EXPORT_METHOD(measureViewsInRect:(CGRect)rect
                  parentView:(nonnull NSNumber *)ReactABI20_0_0Tag
                  errorCallback:(__unused ABI20_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI20_0_0RCTResponseSenderBlock)callback)
{
  ABI20_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI20_0_0Tag];
  if (!shadowView) {
    ABI20_0_0RCTLogError(@"Attempting to measure view that does not exist (tag #%@)", ReactABI20_0_0Tag);
    return;
  }
  NSArray<ABI20_0_0RCTShadowView *> *childShadowViews = [shadowView ReactABI20_0_0Subviews];
  NSMutableArray<NSDictionary *> *results =
    [[NSMutableArray alloc] initWithCapacity:childShadowViews.count];

  [childShadowViews enumerateObjectsUsingBlock:
   ^(ABI20_0_0RCTShadowView *childShadowView, NSUInteger idx, __unused BOOL *stop) {
    CGRect childLayout = [childShadowView measureLayoutRelativeToAncestor:shadowView];
    if (CGRectIsNull(childLayout)) {
      ABI20_0_0RCTLogError(@"View %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                  childShadowView, childShadowView.ReactABI20_0_0Tag, shadowView, shadowView.ReactABI20_0_0Tag);
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

ABI20_0_0RCT_EXPORT_METHOD(takeSnapshot:(id /* NSString or NSNumber */)target
                  withOptions:(NSDictionary *)options
                  resolve:(ABI20_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    // Get view
    UIView *view;
    if (target == nil || [target isEqual:@"window"]) {
      view = ABI20_0_0RCTKeyWindow();
    } else if ([target isKindOfClass:[NSNumber class]]) {
      view = viewRegistry[target];
      if (!view) {
        ABI20_0_0RCTLogError(@"No view found with ReactABI20_0_0Tag: %@", target);
        return;
      }
    }

    // Get options
    CGSize size = [ABI20_0_0RCTConvert CGSize:options];
    NSString *format = [ABI20_0_0RCTConvert NSString:options[@"format"] ?: @"png"];

    // Capture image
    if (size.width < 0.1 || size.height < 0.1) {
      size = view.bounds.size;
    }
    UIGraphicsBeginImageContextWithOptions(size, NO, 0);
    BOOL success = [view drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    if (!success || !image) {
      reject(ABI20_0_0RCTErrorUnspecified, @"Failed to capture view snapshot.", nil);
      return;
    }

    // Convert image to data (on a background thread)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

      NSData *data;
      if ([format isEqualToString:@"png"]) {
        data = UIImagePNGRepresentation(image);
      } else if ([format isEqualToString:@"jpeg"]) {
        CGFloat quality = [ABI20_0_0RCTConvert CGFloat:options[@"quality"] ?: @1];
        data = UIImageJPEGRepresentation(image, quality);
      } else {
        ABI20_0_0RCTLogError(@"Unsupported image format: %@", format);
        return;
      }

      // Save to a temp file
      NSError *error = nil;
      NSString *tempFilePath = ABI20_0_0RCTTempFilePath(format, &error);
      if (tempFilePath) {
        if ([data writeToFile:tempFilePath options:(NSDataWritingOptions)0 error:&error]) {
          resolve(tempFilePath);
          return;
        }
      }

      // If we reached here, something went wrong
      reject(ABI20_0_0RCTErrorUnspecified, error.localizedDescription, error);
    });
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
ABI20_0_0RCT_EXPORT_METHOD(setJSResponder:(nonnull NSNumber *)ReactABI20_0_0Tag
                  blockNativeResponder:(__unused BOOL)blockNativeResponder)
{
  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = viewRegistry[ReactABI20_0_0Tag];
    if (!_jsResponder) {
      ABI20_0_0RCTLogError(@"Invalid view set to be the JS responder - tag %zd", ReactABI20_0_0Tag);
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(clearJSResponder)
{
  [self addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = nil;
  }];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSMutableDictionary<NSString *, NSDictionary *> *constants = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *directEvents = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *bubblingEvents = [NSMutableDictionary new];

  [_componentDataByName enumerateKeysAndObjectsUsingBlock:^(NSString *name, ABI20_0_0RCTComponentData *componentData, __unused BOOL *stop) {
     NSMutableDictionary<NSString *, id> *moduleConstants = [NSMutableDictionary new];

     // Add manager class
     moduleConstants[@"Manager"] = ABI20_0_0RCTBridgeModuleNameForClass(componentData.managerClass);

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
       if (ABI20_0_0RCT_DEBUG && bubblingEvents[eventName]) {
         ABI20_0_0RCTLogError(@"Component '%@' re-registered bubbling event '%@' as a "
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
       if (ABI20_0_0RCT_DEBUG && directEvents[eventName]) {
         ABI20_0_0RCTLogError(@"Component '%@' re-registered direct event '%@' as a "
                     "bubbling event", componentData.name, eventName);
       }
     }

     ABI20_0_0RCTAssert(!constants[name], @"UIManager already has constants for %@", componentData.name);
     constants[name] = moduleConstants;
  }];

  constants[@"customBubblingEventTypes"] = bubblingEvents;
  constants[@"customDirectEventTypes"] = directEvents;

  return constants;
}

ABI20_0_0RCT_EXPORT_METHOD(configureNextLayoutAnimation:(NSDictionary *)config
                  withCallback:(ABI20_0_0RCTResponseSenderBlock)callback
                  errorCallback:(__unused ABI20_0_0RCTResponseSenderBlock)errorCallback)
{
  ABI20_0_0RCTLayoutAnimationGroup *layoutAnimationGroup =
    [[ABI20_0_0RCTLayoutAnimationGroup alloc] initWithConfig:config
                                           callback:callback];

  [self addUIBlock:^(ABI20_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    [uiManager setNextLayoutAnimationGroup:layoutAnimationGroup];
  }];
}

- (void)rootViewForReactABI20_0_0Tag:(NSNumber *)ReactABI20_0_0Tag withCompletion:(void (^)(UIView *view))completion
{
  ABI20_0_0RCTAssertMainQueue();
  ABI20_0_0RCTAssert(completion != nil, @"Attempted to resolve rootView for tag %@ without a completion block", ReactABI20_0_0Tag);

  if (ReactABI20_0_0Tag == nil) {
    completion(nil);
    return;
  }

  dispatch_async(ABI20_0_0RCTGetUIManagerQueue(), ^{
    NSNumber *rootTag = [self _rootTagForReactABI20_0_0Tag:ReactABI20_0_0Tag];
    dispatch_async(dispatch_get_main_queue(), ^{
      UIView *rootView = nil;
      if (rootTag != nil) {
        rootView = [self viewForReactABI20_0_0Tag:rootTag];
      }
      completion(rootView);
    });
  });
}

- (NSNumber *)_rootTagForReactABI20_0_0Tag:(NSNumber *)ReactABI20_0_0Tag
{
  ABI20_0_0RCTAssert(!ABI20_0_0RCTIsMainQueue(), @"Should be called on shadow queue");

  if (ReactABI20_0_0Tag == nil) {
    return nil;
  }

  if (ABI20_0_0RCTIsReactABI20_0_0RootView(ReactABI20_0_0Tag)) {
    return ReactABI20_0_0Tag;
  }

  NSNumber *rootTag = nil;
  ABI20_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI20_0_0Tag];
  while (shadowView) {
    ABI20_0_0RCTShadowView *parent = [shadowView ReactABI20_0_0Superview];
    if (!parent && ABI20_0_0RCTIsReactABI20_0_0RootView(shadowView.ReactABI20_0_0Tag)) {
      rootTag = shadowView.ReactABI20_0_0Tag;
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

@implementation ABI20_0_0RCTUIManager (Deprecated)

- (void)registerRootView:(UIView *)rootView withSizeFlexibility:(__unused ABI20_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  ABI20_0_0RCTLogWarn(@"Calling of `[-ABI20_0_0RCTUIManager registerRootView:withSizeFlexibility:]` which is deprecated.");
  [self registerRootView:rootView];
}

- (void)setFrame:(CGRect)frame forView:(UIView *)view
{
  ABI20_0_0RCTLogWarn(@"Calling of `[-ABI20_0_0RCTUIManager setFrame:forView:]` which is deprecated.");
  [self setSize:frame.size forView:view];
}

ABI20_0_0RCT_EXPORT_METHOD(getContentSizeMultiplier:(nonnull ABI20_0_0RCTResponseSenderBlock)callback)
{
  ABI20_0_0RCTLogWarn(@"`getContentSizeMultiplier` is deprecated. Instead, use `PixelRatio.getFontScale()` and listen to the `didUpdateDimensions` event.");
  callback(@[@(_bridge.accessibilityManager.multiplier)]);
}

@end

@implementation ABI20_0_0RCTBridge (ABI20_0_0RCTUIManager)

- (ABI20_0_0RCTUIManager *)uiManager
{
  return [self moduleForClass:[ABI20_0_0RCTUIManager class]];
}

@end
