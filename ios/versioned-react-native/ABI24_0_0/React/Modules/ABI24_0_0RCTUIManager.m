/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTUIManager.h"

#import <AVFoundation/AVFoundation.h>

#import "ABI24_0_0RCTAccessibilityManager.h"
#import "ABI24_0_0RCTAssert.h"
#import "ABI24_0_0RCTBridge+Private.h"
#import "ABI24_0_0RCTBridge.h"
#import "ABI24_0_0RCTComponent.h"
#import "ABI24_0_0RCTComponentData.h"
#import "ABI24_0_0RCTConvert.h"
#import "ABI24_0_0RCTDefines.h"
#import "ABI24_0_0RCTEventDispatcher.h"
#import "ABI24_0_0RCTLayoutAnimation.h"
#import "ABI24_0_0RCTLayoutAnimationGroup.h"
#import "ABI24_0_0RCTLog.h"
#import "ABI24_0_0RCTModuleData.h"
#import "ABI24_0_0RCTModuleMethod.h"
#import "ABI24_0_0RCTProfile.h"
#import "ABI24_0_0RCTRootContentView.h"
#import "ABI24_0_0RCTRootShadowView.h"
#import "ABI24_0_0RCTRootViewInternal.h"
#import "ABI24_0_0RCTScrollableProtocol.h"
#import "ABI24_0_0RCTShadowView+Internal.h"
#import "ABI24_0_0RCTShadowView.h"
#import "ABI24_0_0RCTUIManagerObserverCoordinator.h"
#import "ABI24_0_0RCTUIManagerUtils.h"
#import "ABI24_0_0RCTUtils.h"
#import "ABI24_0_0RCTView.h"
#import "ABI24_0_0RCTViewManager.h"
#import "UIView+ReactABI24_0_0.h"

static void ABI24_0_0RCTTraverseViewNodes(id<ABI24_0_0RCTComponent> view, void (^block)(id<ABI24_0_0RCTComponent>))
{
  if (view.ReactABI24_0_0Tag) {
    block(view);

    for (id<ABI24_0_0RCTComponent> subview in view.ReactABI24_0_0Subviews) {
      ABI24_0_0RCTTraverseViewNodes(subview, block);
    }
  }
}

NSString *const ABI24_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification = @"ABI24_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification";

@implementation ABI24_0_0RCTUIManager
{
  // Root views are only mutated on the shadow queue
  NSMutableSet<NSNumber *> *_rootViewTags;
  NSMutableArray<ABI24_0_0RCTViewManagerUIBlock> *_pendingUIBlocks;

  // Animation
  ABI24_0_0RCTLayoutAnimationGroup *_layoutAnimationGroup; // Main thread only

  NSMutableDictionary<NSNumber *, ABI24_0_0RCTShadowView *> *_shadowViewRegistry; // ABI24_0_0RCT thread only
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry; // Main thread only

  // Keyed by viewName
  NSDictionary *_componentDataByName;

  NSMutableSet<id<ABI24_0_0RCTComponent>> *_bridgeTransactionListeners;
}

@synthesize bridge = _bridge;

ABI24_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)dealloc
{
  [NSNotificationCenter.defaultCenter removeObserver:self];
}

- (void)invalidate
{
  /**
   * Called on the JS Thread since all modules are invalidated on the JS thread
   */

  // This only accessed from the shadow queue
  _pendingUIBlocks = nil;

  ABI24_0_0RCTExecuteOnMainQueue(^{
    ABI24_0_0RCT_PROFILE_BEGIN_EVENT(ABI24_0_0RCTProfileTagAlways, @"UIManager invalidate", nil);
    for (NSNumber *rootViewTag in self->_rootViewTags) {
      [(id<ABI24_0_0RCTInvalidating>)self->_viewRegistry[rootViewTag] invalidate];
    }

    self->_rootViewTags = nil;
    self->_shadowViewRegistry = nil;
    self->_viewRegistry = nil;
    self->_bridgeTransactionListeners = nil;
    self->_bridge = nil;

    [[NSNotificationCenter defaultCenter] removeObserver:self];
    ABI24_0_0RCT_PROFILE_END_EVENT(ABI24_0_0RCTProfileTagAlways, @"");
  });
}

- (NSMutableDictionary<NSNumber *, ABI24_0_0RCTShadowView *> *)shadowViewRegistry
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

- (void)setBridge:(ABI24_0_0RCTBridge *)bridge
{
  ABI24_0_0RCTAssert(_bridge == nil, @"Should not re-use same UIIManager instance");
  _bridge = bridge;

  _shadowViewRegistry = [NSMutableDictionary new];
  _viewRegistry = [NSMutableDictionary new];

  // Internal resources
  _pendingUIBlocks = [NSMutableArray new];
  _rootViewTags = [NSMutableSet new];

  _bridgeTransactionListeners = [NSMutableSet new];
  _observerCoordinator = [ABI24_0_0RCTUIManagerObserverCoordinator new];

  // Get view managers from bridge
  NSMutableDictionary *componentDataByName = [NSMutableDictionary new];
  for (Class moduleClass in _bridge.moduleClasses) {
    if ([moduleClass isSubclassOfClass:[ABI24_0_0RCTViewManager class]]) {
      ABI24_0_0RCTComponentData *componentData = [[ABI24_0_0RCTComponentData alloc] initWithManagerClass:moduleClass
                                                                                bridge:_bridge];
      componentDataByName[componentData.name] = componentData;
    }
  }

  _componentDataByName = [componentDataByName copy];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:ABI24_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
#if !TARGET_OS_TV
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(namedOrientationDidChange)
                                               name:UIDeviceOrientationDidChangeNotification
                                             object:nil];
#endif
  [ABI24_0_0RCTLayoutAnimation initializeStatics];
}

#pragma mark - Event emitting

- (void)didReceiveNewContentSizeMultiplier
{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateContentSizeMultiplier"
                                              body:@([_bridge.accessibilityManager multiplier])];
#pragma clang diagnostic pop

  ABI24_0_0RCTExecuteOnUIManagerQueue(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI24_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
                                                        object:self];
    [self setNeedsLayout];
  });
}

#if !TARGET_OS_TV
// Names and coordinate system from html5 spec:
// https://developer.mozilla.org/en-US/docs/Web/API/Screen.orientation
// https://developer.mozilla.org/en-US/docs/Web/API/Screen.lockOrientation
static NSDictionary *deviceOrientationEventBody(UIDeviceOrientation orientation)
{
  NSString *name;
  NSNumber *degrees = @0;
  BOOL isLandscape = NO;
  switch(orientation) {
    case UIDeviceOrientationPortrait:
      name = @"portrait-primary";
      break;
    case UIDeviceOrientationPortraitUpsideDown:
      name = @"portrait-secondary";
      degrees = @180;
      break;
    case UIDeviceOrientationLandscapeRight:
      name = @"landscape-primary";
      degrees = @-90;
      isLandscape = YES;
      break;
    case UIDeviceOrientationLandscapeLeft:
      name = @"landscape-secondary";
      degrees = @90;
      isLandscape = YES;
      break;
    case UIDeviceOrientationFaceDown:
    case UIDeviceOrientationFaceUp:
    case UIDeviceOrientationUnknown:
      // Unsupported
      return nil;
  }
  return @{
    @"name": name,
    @"rotationDegrees": degrees,
    @"isLandscape": @(isLandscape),
  };
}

- (void)namedOrientationDidChange
{
  NSDictionary *orientationEvent = deviceOrientationEventBody([UIDevice currentDevice].orientation);
  if (!orientationEvent) {
    return;
  }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"namedOrientationDidChange"
                                              body:orientationEvent];
#pragma clang diagnostic pop
}
#endif

- (dispatch_queue_t)methodQueue
{
  return ABI24_0_0RCTGetUIManagerQueue();
}

- (void)registerRootView:(ABI24_0_0RCTRootContentView *)rootView
{
  ABI24_0_0RCTAssertMainQueue();

  NSNumber *ReactABI24_0_0Tag = rootView.ReactABI24_0_0Tag;
  ABI24_0_0RCTAssert(ABI24_0_0RCTIsReactABI24_0_0RootView(ReactABI24_0_0Tag),
            @"View %@ with tag #%@ is not a root view", rootView, ReactABI24_0_0Tag);

  UIView *existingView = _viewRegistry[ReactABI24_0_0Tag];
  ABI24_0_0RCTAssert(existingView == nil || existingView == rootView,
            @"Expect all root views to have unique tag. Added %@ twice", ReactABI24_0_0Tag);

  CGSize availableSize = rootView.availableSize;

  // Register view
  _viewRegistry[ReactABI24_0_0Tag] = rootView;

  // Register shadow view
  ABI24_0_0RCTExecuteOnUIManagerQueue(^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI24_0_0RCTRootShadowView *shadowView = [ABI24_0_0RCTRootShadowView new];
    shadowView.availableSize = availableSize;
    shadowView.ReactABI24_0_0Tag = ReactABI24_0_0Tag;
    shadowView.backgroundColor = rootView.backgroundColor;
    shadowView.viewName = NSStringFromClass([rootView class]);
    self->_shadowViewRegistry[shadowView.ReactABI24_0_0Tag] = shadowView;
    [self->_rootViewTags addObject:ReactABI24_0_0Tag];
  });
}

- (NSString *)viewNameForReactABI24_0_0Tag:(NSNumber *)ReactABI24_0_0Tag
{
  ABI24_0_0RCTAssertUIManagerQueue();
  return _shadowViewRegistry[ReactABI24_0_0Tag].viewName;
}

- (UIView *)viewForReactABI24_0_0Tag:(NSNumber *)ReactABI24_0_0Tag
{
  ABI24_0_0RCTAssertMainQueue();
  return _viewRegistry[ReactABI24_0_0Tag];
}

- (ABI24_0_0RCTShadowView *)shadowViewForReactABI24_0_0Tag:(NSNumber *)ReactABI24_0_0Tag
{
  ABI24_0_0RCTAssertUIManagerQueue();
  return _shadowViewRegistry[ReactABI24_0_0Tag];
}

- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView
{
  ABI24_0_0RCTAssertMainQueue();
  NSNumber *ReactABI24_0_0Tag = rootView.ReactABI24_0_0Tag;
  ABI24_0_0RCTExecuteOnUIManagerQueue(^{
    ABI24_0_0RCTRootShadowView *shadowView = (ABI24_0_0RCTRootShadowView *)self->_shadowViewRegistry[ReactABI24_0_0Tag];
    ABI24_0_0RCTAssert(shadowView != nil, @"Could not locate shadow view with tag #%@", ReactABI24_0_0Tag);
    ABI24_0_0RCTAssert([shadowView isKindOfClass:[ABI24_0_0RCTRootShadowView class]], @"Located shadow view (with tag #%@) is actually not root view.", ReactABI24_0_0Tag);

    if (CGSizeEqualToSize(availableSize, shadowView.availableSize)) {
      return;
    }

    shadowView.availableSize = availableSize;
    [self setNeedsLayout];
  });
}

- (void)setLocalData:(NSObject *)localData forView:(UIView *)view
{
  ABI24_0_0RCTAssertMainQueue();
  NSNumber *tag = view.ReactABI24_0_0Tag;

  ABI24_0_0RCTExecuteOnUIManagerQueue(^{
    ABI24_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[tag];
    if (shadowView == nil) {
      ABI24_0_0RCTLogWarn(@"Could not locate shadow view with tag #%@, this is probably caused by a temporary inconsistency between native views and shadow views.", tag);
      return;
    }

    shadowView.localData = localData;
    [self setNeedsLayout];
  });
}

/**
 * TODO(yuwang): implement the nativeID functionality in a more efficient way
 *               instead of searching the whole view tree
 */
- (UIView *)viewForNativeID:(NSString *)nativeID withRootTag:(NSNumber *)rootTag
{
  ABI24_0_0RCTAssertMainQueue();
  UIView *view = [self viewForReactABI24_0_0Tag:rootTag];
  return [self _lookupViewForNativeID:nativeID inView:view];
}

- (UIView *)_lookupViewForNativeID:(NSString *)nativeID inView:(UIView *)view
{
  ABI24_0_0RCTAssertMainQueue();
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
  ABI24_0_0RCTAssertMainQueue();

  NSNumber *ReactABI24_0_0Tag = view.ReactABI24_0_0Tag;
  ABI24_0_0RCTExecuteOnUIManagerQueue(^{
    ABI24_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI24_0_0Tag];
    ABI24_0_0RCTAssert(shadowView != nil, @"Could not locate shadow view with tag #%@", ReactABI24_0_0Tag);

    if (CGSizeEqualToSize(size, shadowView.size)) {
      return;
    }

    shadowView.size = size;
    [self setNeedsLayout];
  });
}

- (void)setIntrinsicContentSize:(CGSize)size forView:(UIView *)view
{
  ABI24_0_0RCTAssertMainQueue();

  NSNumber *ReactABI24_0_0Tag = view.ReactABI24_0_0Tag;
  ABI24_0_0RCTExecuteOnUIManagerQueue(^{
    ABI24_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI24_0_0Tag];
    if (shadowView == nil) {
      ABI24_0_0RCTLogWarn(@"Could not locate shadow view with tag #%@, this is probably caused by a temporary inconsistency between native views and shadow views.", ReactABI24_0_0Tag);
      return;
    }    

    if (!CGSizeEqualToSize(shadowView.intrinsicContentSize, size)) {
      shadowView.intrinsicContentSize = size;
      [self setNeedsLayout];
    }
  });
}

- (void)setBackgroundColor:(UIColor *)color forView:(UIView *)view
{
  ABI24_0_0RCTAssertMainQueue();

  NSNumber *ReactABI24_0_0Tag = view.ReactABI24_0_0Tag;
  ABI24_0_0RCTExecuteOnUIManagerQueue(^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI24_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[ReactABI24_0_0Tag];
    ABI24_0_0RCTAssert(shadowView != nil, @"Could not locate root view with tag #%@", ReactABI24_0_0Tag);
    shadowView.backgroundColor = color;
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:shadowView];
    [self flushUIBlocks];
  });
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray<id<ABI24_0_0RCTComponent>> *)children
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *)registry
{
  for (id<ABI24_0_0RCTComponent> child in children) {
    ABI24_0_0RCTTraverseViewNodes(registry[child.ReactABI24_0_0Tag], ^(id<ABI24_0_0RCTComponent> subview) {
      ABI24_0_0RCTAssert(![subview isReactABI24_0_0RootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(ABI24_0_0RCTInvalidating)]) {
        [(id<ABI24_0_0RCTInvalidating>)subview invalidate];
      }
      [registry removeObjectForKey:subview.ReactABI24_0_0Tag];

      if (registry == (NSMutableDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *)self->_viewRegistry) {
        [self->_bridgeTransactionListeners removeObject:subview];
      }
    });
  }
}

- (void)addUIBlock:(ABI24_0_0RCTViewManagerUIBlock)block
{
  ABI24_0_0RCTAssertUIManagerQueue();

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks addObject:block];
}

- (void)prependUIBlock:(ABI24_0_0RCTViewManagerUIBlock)block
{
  ABI24_0_0RCTAssertUIManagerQueue();

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks insertObject:block atIndex:0];
}

- (void)setNextLayoutAnimationGroup:(ABI24_0_0RCTLayoutAnimationGroup *)layoutAnimationGroup
{
  ABI24_0_0RCTAssertMainQueue();

  if (_layoutAnimationGroup && ![_layoutAnimationGroup isEqual:layoutAnimationGroup]) {
    ABI24_0_0RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.",
      [_layoutAnimationGroup description],
      [layoutAnimationGroup description]);
  }

  _layoutAnimationGroup = layoutAnimationGroup;
}

- (ABI24_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI24_0_0RCTRootShadowView *)rootShadowView
{
  ABI24_0_0RCTAssertUIManagerQueue();

  // This is nuanced. In the JS thread, we create a new update buffer
  // `frameTags`/`frames` that is created/mutated in the JS thread. We access
  // these structures in the UI-thread block. `NSMutableArray` is not thread
  // safe so we rely on the fact that we never mutate it after it's passed to
  // the main thread.
  NSSet<ABI24_0_0RCTShadowView *> *viewsWithNewFrames = [rootShadowView collectViewsWithUpdatedFrames];

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
  } ABI24_0_0RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = viewsWithNewFrames.count;
  NSMutableArray *ReactABI24_0_0Tags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(ABI24_0_0RCTFrameData) * count];
  {
    NSUInteger index = 0;
    ABI24_0_0RCTFrameData *frameDataArray = (ABI24_0_0RCTFrameData *)framesData.mutableBytes;
    for (ABI24_0_0RCTShadowView *shadowView in viewsWithNewFrames) {
      ReactABI24_0_0Tags[index] = shadowView.ReactABI24_0_0Tag;
      frameDataArray[index++] = (ABI24_0_0RCTFrameData){
        shadowView.frame,
        shadowView.layoutDirection,
        shadowView.isNewView,
        shadowView.superview.isNewView,
        shadowView.isHidden,
      };
    }
  }

  // These are blocks to be executed on each view, immediately after
  // ReactABI24_0_0SetFrame: has been called. Note that if ReactABI24_0_0SetFrame: is not called,
  // these won't be called either, so this is not a suitable place to update
  // properties that aren't related to layout.
  NSMutableDictionary<NSNumber *, ABI24_0_0RCTViewManagerUIBlock> *updateBlocks =
  [NSMutableDictionary new];
  for (ABI24_0_0RCTShadowView *shadowView in viewsWithNewFrames) {

    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *ReactABI24_0_0Tag = shadowView.ReactABI24_0_0Tag;
    ABI24_0_0RCTViewManager *manager = [_componentDataByName[shadowView.viewName] manager];
    ABI24_0_0RCTViewManagerUIBlock block = [manager uiBlockToAmendWithShadowView:shadowView];
    if (block) {
      updateBlocks[ReactABI24_0_0Tag] = block;
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

    if (ABI24_0_0RCTIsReactABI24_0_0RootView(ReactABI24_0_0Tag)) {
      CGSize contentSize = shadowView.frame.size;

      ABI24_0_0RCTExecuteOnMainQueue(^{
        UIView *view = self->_viewRegistry[ReactABI24_0_0Tag];
        ABI24_0_0RCTAssert(view != nil, @"view (for ID %@) not found", ReactABI24_0_0Tag);

        ABI24_0_0RCTRootView *rootView = (ABI24_0_0RCTRootView *)[view superview];
        rootView.intrinsicContentSize = contentSize;
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    const ABI24_0_0RCTFrameData *frameDataArray = (const ABI24_0_0RCTFrameData *)framesData.bytes;
    ABI24_0_0RCTLayoutAnimationGroup *layoutAnimationGroup = uiManager->_layoutAnimationGroup;

    __block NSUInteger completionsCalled = 0;

    NSInteger index = 0;
    for (NSNumber *ReactABI24_0_0Tag in ReactABI24_0_0Tags) {
      ABI24_0_0RCTFrameData frameData = frameDataArray[index++];

      UIView *view = viewRegistry[ReactABI24_0_0Tag];
      CGRect frame = frameData.frame;

      BOOL isHidden = frameData.isHidden;
      UIUserInterfaceLayoutDirection layoutDirection = frameData.layoutDirection;
      BOOL isNew = frameData.isNew;
      ABI24_0_0RCTLayoutAnimation *updatingLayoutAnimation = isNew ? nil : layoutAnimationGroup.updatingLayoutAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      ABI24_0_0RCTLayoutAnimation *creatingLayoutAnimation = shouldAnimateCreation ? layoutAnimationGroup.creatingLayoutAnimation : nil;

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

      if (view.ReactABI24_0_0LayoutDirection != layoutDirection) {
        view.ReactABI24_0_0LayoutDirection = layoutDirection;
      }

      ABI24_0_0RCTViewManagerUIBlock updateBlock = updateBlocks[ReactABI24_0_0Tag];
      if (creatingLayoutAnimation) {

        // Animate view creation
        [view ReactABI24_0_0SetFrame:frame];

        CATransform3D finalTransform = view.layer.transform;
        CGFloat finalOpacity = view.layer.opacity;

        NSString *property = creatingLayoutAnimation.property;
        if ([property isEqualToString:@"scaleXY"]) {
          view.layer.transform = CATransform3DMakeScale(0, 0, 0);
        } else if ([property isEqualToString:@"opacity"]) {
          view.layer.opacity = 0.0;
        } else {
          ABI24_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
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
          [view ReactABI24_0_0SetFrame:frame];
          if (updateBlock) {
            updateBlock(self, viewRegistry);
          }
        } withCompletionBlock:completion];

      } else {

        // Update without animation
        [view ReactABI24_0_0SetFrame:frame];
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

- (void)_amendPendingUIBlocksWithStylePropagationUpdateForShadowView:(ABI24_0_0RCTShadowView *)topView
{
  NSMutableSet<ABI24_0_0RCTApplierBlock> *applierBlocks = [NSMutableSet setWithCapacity:1];
  [topView collectUpdatedProperties:applierBlocks parentProperties:@{}];

  if (applierBlocks.count) {
    [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      for (ABI24_0_0RCTApplierBlock block in applierBlocks) {
        block(viewRegistry);
      }
    }];
  }
}

/**
 * A method to be called from JS, which takes a container ID and then releases
 * all subviews for that container upon receipt.
 */
ABI24_0_0RCT_EXPORT_METHOD(removeSubviewsFromContainerWithID:(nonnull NSNumber *)containerID)
{
  id<ABI24_0_0RCTComponent> container = _shadowViewRegistry[containerID];
  ABI24_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", containerID);

  NSUInteger subviewsCount = [container ReactABI24_0_0Subviews].count;
  NSMutableArray<NSNumber *> *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
  for (NSUInteger childIndex = 0; childIndex < subviewsCount; childIndex++) {
    [indices addObject:@(childIndex)];
  }

  [self manageChildren:containerID
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI24_0_0Tags:nil
          addAtIndices:nil
       removeAtIndices:indices];
}

/**
 * Disassociates children from container. Doesn't remove from registries.
 * TODO: use [NSArray getObjects:buffer] to reuse same fast buffer each time.
 *
 * @returns Array of removed items.
 */
- (NSArray<id<ABI24_0_0RCTComponent>> *)_childrenToRemoveFromContainer:(id<ABI24_0_0RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if (atIndices.count == 0 || [container ReactABI24_0_0Subviews].count == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray<id<ABI24_0_0RCTComponent>> *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  ABI24_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSNumber *indexNumber in atIndices) {
    NSUInteger index = indexNumber.unsignedIntegerValue;
    if (index < [container ReactABI24_0_0Subviews].count) {
      [removedChildren addObject:[container ReactABI24_0_0Subviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    NSString *message = [NSString stringWithFormat:@"removedChildren count (%tu) was not what we expected (%tu)",
                         removedChildren.count, atIndices.count];
    ABI24_0_0RCTFatal(ABI24_0_0RCTErrorWithMessage(message));
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray<id<ABI24_0_0RCTComponent>> *)children
          fromContainer:(id<ABI24_0_0RCTComponent>)container
{
  for (id<ABI24_0_0RCTComponent> removedChild in children) {
    [container removeReactABI24_0_0Subview:removedChild];
  }
}

/**
 * Remove subviews from their parent with an animation.
 */
- (void)_removeChildren:(NSArray<UIView *> *)children
          fromContainer:(UIView *)container
          withAnimation:(ABI24_0_0RCTLayoutAnimationGroup *)animation
{
  ABI24_0_0RCTAssertMainQueue();
  ABI24_0_0RCTLayoutAnimation *deletingLayoutAnimation = animation.deletingLayoutAnimation;

  __block NSUInteger completionsCalled = 0;
  for (UIView *removedChild in children) {

    void (^completion)(BOOL) = ^(BOOL finished) {
      completionsCalled++;

      [removedChild removeFromSuperview];

      if (animation.callback && completionsCalled == children.count) {
        animation.callback(@[@(finished)]);

        // It's unsafe to call this callback more than once, so we nil it out here
        // to make sure that doesn't happen.
        animation.callback = nil;
      }
    };

    // Hack: At this moment we have two contradict intents.
    // First one: We want to delete the view from view hierarchy.
    // Second one: We want to animate this view, which implies the existence of this view in the hierarchy.
    // So, we have to remove this view from ReactABI24_0_0's view hierarchy but postpone removing from UIKit's hierarchy.
    // Here the problem: the default implementation of `-[UIView removeReactABI24_0_0Subview:]` also removes the view from UIKit's hierarchy.
    // So, let's temporary restore the view back after removing.
    // To do so, we have to memorize original `superview` (which can differ from `container`) and an index of removed view.
    UIView *originalSuperview = removedChild.superview;
    NSUInteger originalIndex = [originalSuperview.subviews indexOfObjectIdenticalTo:removedChild];
    [container removeReactABI24_0_0Subview:removedChild];
    // Disable user interaction while the view is animating
    // since the view is (conseptually) deleted and not supposed to be interactive.
    removedChild.userInteractionEnabled = NO;
    [originalSuperview insertSubview:removedChild atIndex:originalIndex];

    NSString *property = deletingLayoutAnimation.property;
    [deletingLayoutAnimation performAnimations:^{
      if ([property isEqualToString:@"scaleXY"]) {
        removedChild.layer.transform = CATransform3DMakeScale(0.001, 0.001, 0.001);
      } else if ([property isEqualToString:@"opacity"]) {
        removedChild.layer.opacity = 0.0;
      } else {
        ABI24_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
                    deletingLayoutAnimation.property);
      }
    } withCompletionBlock:completion];
  }
}


ABI24_0_0RCT_EXPORT_METHOD(removeRootView:(nonnull NSNumber *)rootReactABI24_0_0Tag)
{
  ABI24_0_0RCTShadowView *rootShadowView = _shadowViewRegistry[rootReactABI24_0_0Tag];
  ABI24_0_0RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootReactABI24_0_0Tag);
  [self _purgeChildren:(NSArray<id<ABI24_0_0RCTComponent>> *)rootShadowView.ReactABI24_0_0Subviews
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *)_shadowViewRegistry];
  [_shadowViewRegistry removeObjectForKey:rootReactABI24_0_0Tag];
  [_rootViewTags removeObject:rootReactABI24_0_0Tag];

  [self addUIBlock:^(ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    ABI24_0_0RCTAssertMainQueue();
    UIView *rootView = viewRegistry[rootReactABI24_0_0Tag];
    [uiManager _purgeChildren:(NSArray<id<ABI24_0_0RCTComponent>> *)rootView.ReactABI24_0_0Subviews
                 fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *)viewRegistry];
    [(NSMutableDictionary *)viewRegistry removeObjectForKey:rootReactABI24_0_0Tag];
  }];
}

ABI24_0_0RCT_EXPORT_METHOD(replaceExistingNonRootView:(nonnull NSNumber *)ReactABI24_0_0Tag
                  withView:(nonnull NSNumber *)newReactABI24_0_0Tag)
{
  ABI24_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI24_0_0Tag];
  ABI24_0_0RCTAssert(shadowView != nil, @"shadowView (for ID %@) not found", ReactABI24_0_0Tag);

  ABI24_0_0RCTShadowView *superShadowView = shadowView.superview;
  if (!superShadowView) {
    ABI24_0_0RCTAssert(NO, @"shadowView super (of ID %@) not found", ReactABI24_0_0Tag);
    return;
  }

  NSUInteger indexOfView = [superShadowView.ReactABI24_0_0Subviews indexOfObjectIdenticalTo:shadowView];
  ABI24_0_0RCTAssert(indexOfView != NSNotFound, @"View's superview doesn't claim it as subview (id %@)", ReactABI24_0_0Tag);
  NSArray<NSNumber *> *removeAtIndices = @[@(indexOfView)];
  NSArray<NSNumber *> *addTags = @[newReactABI24_0_0Tag];
  [self manageChildren:superShadowView.ReactABI24_0_0Tag
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI24_0_0Tags:addTags
          addAtIndices:removeAtIndices
       removeAtIndices:removeAtIndices];
}

ABI24_0_0RCT_EXPORT_METHOD(setChildren:(nonnull NSNumber *)containerTag
                  ReactABI24_0_0Tags:(NSArray<NSNumber *> *)ReactABI24_0_0Tags)
{
  ABI24_0_0RCTSetChildren(containerTag, ReactABI24_0_0Tags,
                 (NSDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *)_shadowViewRegistry);

  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){

    ABI24_0_0RCTSetChildren(containerTag, ReactABI24_0_0Tags,
                   (NSDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *)viewRegistry);
  }];
}

static void ABI24_0_0RCTSetChildren(NSNumber *containerTag,
                           NSArray<NSNumber *> *ReactABI24_0_0Tags,
                           NSDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *registry)
{
  id<ABI24_0_0RCTComponent> container = registry[containerTag];
  NSInteger index = 0;
  for (NSNumber *ReactABI24_0_0Tag in ReactABI24_0_0Tags) {
    id<ABI24_0_0RCTComponent> view = registry[ReactABI24_0_0Tag];
    if (view) {
      [container insertReactABI24_0_0Subview:view atIndex:index++];
    }
  }
}

ABI24_0_0RCT_EXPORT_METHOD(manageChildren:(nonnull NSNumber *)containerTag
                  moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
                  moveToIndices:(NSArray<NSNumber *> *)moveToIndices
                  addChildReactABI24_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI24_0_0Tags
                  addAtIndices:(NSArray<NSNumber *> *)addAtIndices
                  removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices)
{
  [self _manageChildren:containerTag
        moveFromIndices:moveFromIndices
          moveToIndices:moveToIndices
      addChildReactABI24_0_0Tags:addChildReactABI24_0_0Tags
           addAtIndices:addAtIndices
        removeAtIndices:removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *)_shadowViewRegistry];

  [self addUIBlock:^(ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    [uiManager _manageChildren:containerTag
               moveFromIndices:moveFromIndices
                 moveToIndices:moveToIndices
             addChildReactABI24_0_0Tags:addChildReactABI24_0_0Tags
                  addAtIndices:addAtIndices
               removeAtIndices:removeAtIndices
                      registry:(NSMutableDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *)viewRegistry];
  }];
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildReactABI24_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI24_0_0Tags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI24_0_0RCTComponent>> *)registry
{
  id<ABI24_0_0RCTComponent> container = registry[containerTag];
  ABI24_0_0RCTAssert(moveFromIndices.count == moveToIndices.count, @"moveFromIndices had size %tu, moveToIndices had size %tu", moveFromIndices.count, moveToIndices.count);
  ABI24_0_0RCTAssert(addChildReactABI24_0_0Tags.count == addAtIndices.count, @"there should be at least one ReactABI24_0_0 child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray<id<ABI24_0_0RCTComponent>> *permanentlyRemovedChildren =
    [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
  NSArray<id<ABI24_0_0RCTComponent>> *temporarilyRemovedChildren =
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
    id<ABI24_0_0RCTComponent> view = registry[addChildReactABI24_0_0Tags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray<NSNumber *> *sortedIndices =
    [destinationsToChildrenToAdd.allKeys sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *ReactABI24_0_0Index in sortedIndices) {
    [container insertReactABI24_0_0Subview:destinationsToChildrenToAdd[ReactABI24_0_0Index]
                          atIndex:ReactABI24_0_0Index.integerValue];
  }
}

ABI24_0_0RCT_EXPORT_METHOD(createView:(nonnull NSNumber *)ReactABI24_0_0Tag
                  viewName:(NSString *)viewName
                  rootTag:(nonnull NSNumber *)rootTag
                  props:(NSDictionary *)props)
{
  ABI24_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  if (componentData == nil) {
    ABI24_0_0RCTLogError(@"No component found for view with name \"%@\"", viewName);
  }

  // Register shadow view
  ABI24_0_0RCTShadowView *shadowView = [componentData createShadowViewWithTag:ReactABI24_0_0Tag];
  if (shadowView) {
    [componentData setProps:props forShadowView:shadowView];
    _shadowViewRegistry[ReactABI24_0_0Tag] = shadowView;
    ABI24_0_0RCTShadowView *rootView = _shadowViewRegistry[rootTag];
    ABI24_0_0RCTAssert([rootView isKindOfClass:[ABI24_0_0RCTRootShadowView class]],
      @"Given `rootTag` (%@) does not correspond to a valid root shadow view instance.", rootTag);
    shadowView.rootView = (ABI24_0_0RCTRootShadowView *)rootView;
  }

  // Shadow view is the source of truth for background color this is a little
  // bit counter-intuitive if people try to set background color when setting up
  // the view, but it's the only way that makes sense given our threading model
  UIColor *backgroundColor = shadowView.backgroundColor;

  // Dispatch view creation directly to the main thread instead of adding to
  // UIBlocks array. This way, it doesn't get deferred until after layout.
  __weak ABI24_0_0RCTUIManager *weakManager = self;
  ABI24_0_0RCTExecuteOnMainQueue(^{
    ABI24_0_0RCTUIManager *uiManager = weakManager;
    if (!uiManager) {
      return;
    }
    UIView *view = [componentData createViewWithTag:ReactABI24_0_0Tag];
    if (view) {
      [componentData setProps:props forView:view]; // Must be done before bgColor to prevent wrong default
      if ([view respondsToSelector:@selector(setBackgroundColor:)]) {
        ((UIView *)view).backgroundColor = backgroundColor;
      }
      if ([view respondsToSelector:@selector(ReactABI24_0_0BridgeDidFinishTransaction)]) {
        [uiManager->_bridgeTransactionListeners addObject:view];
      }
      uiManager->_viewRegistry[ReactABI24_0_0Tag] = view;

#if ABI24_0_0RCT_DEV
      [view _DEBUG_setReactABI24_0_0ShadowView:shadowView];
#endif
    }
  });
}

ABI24_0_0RCT_EXPORT_METHOD(updateView:(nonnull NSNumber *)ReactABI24_0_0Tag
                  viewName:(NSString *)viewName // not always reliable, use shadowView.viewName if available
                  props:(NSDictionary *)props)
{
  ABI24_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI24_0_0Tag];
  ABI24_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName ?: viewName];
  [componentData setProps:props forShadowView:shadowView];

  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI24_0_0Tag];
    [componentData setProps:props forView:view];
  }];
}

- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)ReactABI24_0_0Tag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props
{
  ABI24_0_0RCTAssertMainQueue();
  ABI24_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  UIView *view = _viewRegistry[ReactABI24_0_0Tag];
  [componentData setProps:props forView:view];
}

ABI24_0_0RCT_EXPORT_METHOD(focus:(nonnull NSNumber *)ReactABI24_0_0Tag)
{
  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *newResponder = viewRegistry[ReactABI24_0_0Tag];
    [newResponder ReactABI24_0_0Focus];
  }];
}

ABI24_0_0RCT_EXPORT_METHOD(blur:(nonnull NSNumber *)ReactABI24_0_0Tag)
{
  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *currentResponder = viewRegistry[ReactABI24_0_0Tag];
    [currentResponder ReactABI24_0_0Blur];
  }];
}

ABI24_0_0RCT_EXPORT_METHOD(findSubviewIn:(nonnull NSNumber *)ReactABI24_0_0Tag atPoint:(CGPoint)point callback:(ABI24_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI24_0_0Tag];
    UIView *target = [view hitTest:point withEvent:nil];
    CGRect frame = [target convertRect:target.bounds toView:view];

    while (target.ReactABI24_0_0Tag == nil && target.superview != nil) {
      target = target.superview;
    }

    callback(@[
      ABI24_0_0RCTNullIfNil(target.ReactABI24_0_0Tag),
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
    ]);
  }];
}

ABI24_0_0RCT_EXPORT_METHOD(dispatchViewManagerCommand:(nonnull NSNumber *)ReactABI24_0_0Tag
                  commandID:(NSInteger)commandID
                  commandArgs:(NSArray<id> *)commandArgs)
{
  ABI24_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI24_0_0Tag];
  ABI24_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName];
  Class managerClass = componentData.managerClass;
  ABI24_0_0RCTModuleData *moduleData = [_bridge moduleDataForName:ABI24_0_0RCTBridgeModuleNameForClass(managerClass)];
  id<ABI24_0_0RCTBridgeMethod> method = moduleData.methods[commandID];

  NSArray *args = [@[ReactABI24_0_0Tag] arrayByAddingObjectsFromArray:commandArgs];
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
  for (ABI24_0_0RCTComponentData *componentData in _componentDataByName.allValues) {
    ABI24_0_0RCTViewManagerUIBlock uiBlock = [componentData uiBlockToAmendWithShadowViewRegistry:_shadowViewRegistry];
    [self addUIBlock:uiBlock];
  }

  [_observerCoordinator uiManagerWillPerformLayout:self];

  // Perform layout
  for (NSNumber *ReactABI24_0_0Tag in _rootViewTags) {
    ABI24_0_0RCTRootShadowView *rootView = (ABI24_0_0RCTRootShadowView *)_shadowViewRegistry[ReactABI24_0_0Tag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
  }

  [_observerCoordinator uiManagerDidPerformLayout:self];

  // Properies propagation
  for (NSNumber *ReactABI24_0_0Tag in _rootViewTags) {
    ABI24_0_0RCTRootShadowView *rootView = (ABI24_0_0RCTRootShadowView *)_shadowViewRegistry[ReactABI24_0_0Tag];
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:rootView];
  }

  [self addUIBlock:^(ABI24_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    /**
     * TODO(tadeu): Remove it once and for all
     */
    for (id<ABI24_0_0RCTComponent> node in uiManager->_bridgeTransactionListeners) {
      [node ReactABI24_0_0BridgeDidFinishTransaction];
    }
  }];

  [_observerCoordinator uiManagerWillFlushUIBlocks:self];

  [self flushUIBlocks];
}

- (void)flushUIBlocks
{
  ABI24_0_0RCTAssertUIManagerQueue();

  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  NSArray<ABI24_0_0RCTViewManagerUIBlock> *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [NSMutableArray new];

  if (previousPendingUIBlocks.count) {
    // Execute the previously queued UI blocks
    ABI24_0_0RCTProfileBeginFlowEvent();
    ABI24_0_0RCTExecuteOnMainQueue(^{
      ABI24_0_0RCTProfileEndFlowEvent();
      ABI24_0_0RCT_PROFILE_BEGIN_EVENT(ABI24_0_0RCTProfileTagAlways, @"-[UIManager flushUIBlocks]", (@{
        @"count": [@(previousPendingUIBlocks.count) stringValue],
      }));
      @try {
        for (ABI24_0_0RCTViewManagerUIBlock block in previousPendingUIBlocks) {
          block(self, self->_viewRegistry);
        }
      }
      @catch (NSException *exception) {
        ABI24_0_0RCTLogError(@"Exception thrown while executing UI block: %@", exception);
      }
      ABI24_0_0RCT_PROFILE_END_EVENT(ABI24_0_0RCTProfileTagAlways, @"");
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

ABI24_0_0RCT_EXPORT_METHOD(measure:(nonnull NSNumber *)ReactABI24_0_0Tag
                  callback:(ABI24_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI24_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI24_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI24_0_0Tag);
      callback(@[]);
      return;
    }

    // If in a <Modal>, rootView will be the root of the modal container.
    UIView *rootView = view;
    while (rootView.superview && ![rootView isReactABI24_0_0RootView]) {
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

ABI24_0_0RCT_EXPORT_METHOD(measureInWindow:(nonnull NSNumber *)ReactABI24_0_0Tag
                  callback:(ABI24_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI24_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI24_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI24_0_0Tag);
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
ABI24_0_0RCT_EXPORT_METHOD(viewIsDescendantOf:(nonnull NSNumber *)ReactABI24_0_0Tag
                  ancestor:(nonnull NSNumber *)ancestorReactABI24_0_0Tag
                  callback:(ABI24_0_0RCTResponseSenderBlock)callback)
{
  ABI24_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI24_0_0Tag];
  ABI24_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI24_0_0Tag];
  if (!shadowView) {
    return;
  }
  if (!ancestorShadowView) {
    return;
  }
  BOOL viewIsAncestor = [shadowView viewIsDescendantOf:ancestorShadowView];
  callback(@[@(viewIsAncestor)]);
}

static void ABI24_0_0RCTMeasureLayout(ABI24_0_0RCTShadowView *view,
                             ABI24_0_0RCTShadowView *ancestor,
                             ABI24_0_0RCTResponseSenderBlock callback)
{
  if (!view) {
    return;
  }
  if (!ancestor) {
    return;
  }
  CGRect result = [view measureLayoutRelativeToAncestor:ancestor];
  if (CGRectIsNull(result)) {
    ABI24_0_0RCTLogError(@"view %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                view, view.ReactABI24_0_0Tag, ancestor, ancestor.ReactABI24_0_0Tag);
    return;
  }
  CGFloat leftOffset = result.origin.x;
  CGFloat topOffset = result.origin.y;
  CGFloat width = result.size.width;
  CGFloat height = result.size.height;
  if (isnan(leftOffset) || isnan(topOffset) || isnan(width) || isnan(height)) {
    ABI24_0_0RCTLogError(@"Attempted to measure layout but offset or dimensions were NaN");
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
ABI24_0_0RCT_EXPORT_METHOD(measureLayout:(nonnull NSNumber *)ReactABI24_0_0Tag
                  relativeTo:(nonnull NSNumber *)ancestorReactABI24_0_0Tag
                  errorCallback:(__unused ABI24_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI24_0_0RCTResponseSenderBlock)callback)
{
  ABI24_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI24_0_0Tag];
  ABI24_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI24_0_0Tag];
  ABI24_0_0RCTMeasureLayout(shadowView, ancestorShadowView, callback);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
ABI24_0_0RCT_EXPORT_METHOD(measureLayoutRelativeToParent:(nonnull NSNumber *)ReactABI24_0_0Tag
                  errorCallback:(__unused ABI24_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI24_0_0RCTResponseSenderBlock)callback)
{
  ABI24_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI24_0_0Tag];
  ABI24_0_0RCTMeasureLayout(shadowView, shadowView.ReactABI24_0_0Superview, callback);
}

/**
 * Returns an array of computed offset layouts in a dictionary form. The layouts are of any ReactABI24_0_0 subviews
 * that are immediate descendants to the parent view found within a specified rect. The dictionary result
 * contains left, top, width, height and an index. The index specifies the position among the other subviews.
 * Only layouts for views that are within the rect passed in are returned. Invokes the error callback if the
 * passed in parent view does not exist. Invokes the supplied callback with the array of computed layouts.
 */
ABI24_0_0RCT_EXPORT_METHOD(measureViewsInRect:(CGRect)rect
                  parentView:(nonnull NSNumber *)ReactABI24_0_0Tag
                  errorCallback:(__unused ABI24_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI24_0_0RCTResponseSenderBlock)callback)
{
  ABI24_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI24_0_0Tag];
  if (!shadowView) {
    ABI24_0_0RCTLogError(@"Attempting to measure view that does not exist (tag #%@)", ReactABI24_0_0Tag);
    return;
  }
  NSArray<ABI24_0_0RCTShadowView *> *childShadowViews = [shadowView ReactABI24_0_0Subviews];
  NSMutableArray<NSDictionary *> *results =
    [[NSMutableArray alloc] initWithCapacity:childShadowViews.count];

  [childShadowViews enumerateObjectsUsingBlock:
   ^(ABI24_0_0RCTShadowView *childShadowView, NSUInteger idx, __unused BOOL *stop) {
    CGRect childLayout = [childShadowView measureLayoutRelativeToAncestor:shadowView];
    if (CGRectIsNull(childLayout)) {
      ABI24_0_0RCTLogError(@"View %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                  childShadowView, childShadowView.ReactABI24_0_0Tag, shadowView, shadowView.ReactABI24_0_0Tag);
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

ABI24_0_0RCT_EXPORT_METHOD(takeSnapshot:(id /* NSString or NSNumber */)target
                  withOptions:(NSDictionary *)options
                  resolve:(ABI24_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI24_0_0RCTPromiseRejectBlock)reject)
{
  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    // Get view
    UIView *view;
    if (target == nil || [target isEqual:@"window"]) {
      view = ABI24_0_0RCTKeyWindow();
    } else if ([target isKindOfClass:[NSNumber class]]) {
      view = viewRegistry[target];
      if (!view) {
        ABI24_0_0RCTLogError(@"No view found with ReactABI24_0_0Tag: %@", target);
        return;
      }
    }

    // Get options
    CGSize size = [ABI24_0_0RCTConvert CGSize:options];
    NSString *format = [ABI24_0_0RCTConvert NSString:options[@"format"] ?: @"png"];

    // Capture image
    if (size.width < 0.1 || size.height < 0.1) {
      size = view.bounds.size;
    }
    UIGraphicsBeginImageContextWithOptions(size, NO, 0);
    BOOL success = [view drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    if (!success || !image) {
      reject(ABI24_0_0RCTErrorUnspecified, @"Failed to capture view snapshot.", nil);
      return;
    }

    // Convert image to data (on a background thread)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

      NSData *data;
      if ([format isEqualToString:@"png"]) {
        data = UIImagePNGRepresentation(image);
      } else if ([format isEqualToString:@"jpeg"]) {
        CGFloat quality = [ABI24_0_0RCTConvert CGFloat:options[@"quality"] ?: @1];
        data = UIImageJPEGRepresentation(image, quality);
      } else {
        ABI24_0_0RCTLogError(@"Unsupported image format: %@", format);
        return;
      }

      // Save to a temp file
      NSError *error = nil;
      NSString *tempFilePath = ABI24_0_0RCTTempFilePath(format, &error);
      if (tempFilePath) {
        if ([data writeToFile:tempFilePath options:(NSDataWritingOptions)0 error:&error]) {
          resolve(tempFilePath);
          return;
        }
      }

      // If we reached here, something went wrong
      reject(ABI24_0_0RCTErrorUnspecified, error.localizedDescription, error);
    });
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
ABI24_0_0RCT_EXPORT_METHOD(setJSResponder:(nonnull NSNumber *)ReactABI24_0_0Tag
                  blockNativeResponder:(__unused BOOL)blockNativeResponder)
{
  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = viewRegistry[ReactABI24_0_0Tag];
    if (!_jsResponder) {
      ABI24_0_0RCTLogError(@"Invalid view set to be the JS responder - tag %@", ReactABI24_0_0Tag);
    }
  }];
}

ABI24_0_0RCT_EXPORT_METHOD(clearJSResponder)
{
  [self addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = nil;
  }];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSMutableDictionary<NSString *, NSDictionary *> *constants = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *directEvents = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *bubblingEvents = [NSMutableDictionary new];

  [_componentDataByName enumerateKeysAndObjectsUsingBlock:^(NSString *name, ABI24_0_0RCTComponentData *componentData, __unused BOOL *stop) {
     NSMutableDictionary<NSString *, id> *moduleConstants = [NSMutableDictionary new];

     // Register which event-types this view dispatches.
     // ReactABI24_0_0 needs this for the event plugin.
     NSMutableDictionary<NSString *, NSDictionary *> *bubblingEventTypes = [NSMutableDictionary new];
     NSMutableDictionary<NSString *, NSDictionary *> *directEventTypes = [NSMutableDictionary new];

     // Add manager class
     moduleConstants[@"Manager"] = ABI24_0_0RCTBridgeModuleNameForClass(componentData.managerClass);

     // Add native props
     NSDictionary<NSString *, id> *viewConfig = [componentData viewConfig];
     moduleConstants[@"NativeProps"] = viewConfig[@"propTypes"];
     moduleConstants[@"baseModuleName"] = viewConfig[@"baseModuleName"];
     moduleConstants[@"bubblingEventTypes"] = bubblingEventTypes;
     moduleConstants[@"directEventTypes"] = directEventTypes;

     // Add direct events
     for (NSString *eventName in viewConfig[@"directEvents"]) {
       if (!directEvents[eventName]) {
         directEvents[eventName] = @{
           @"registrationName": [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"],
         };
       }
       directEventTypes[eventName] = directEvents[eventName];
       if (ABI24_0_0RCT_DEBUG && bubblingEvents[eventName]) {
         ABI24_0_0RCTLogError(@"Component '%@' re-registered bubbling event '%@' as a "
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
       bubblingEventTypes[eventName] = bubblingEvents[eventName];
       if (ABI24_0_0RCT_DEBUG && directEvents[eventName]) {
         ABI24_0_0RCTLogError(@"Component '%@' re-registered direct event '%@' as a "
                     "bubbling event", componentData.name, eventName);
       }
     }

     ABI24_0_0RCTAssert(!constants[name], @"UIManager already has constants for %@", componentData.name);
     constants[name] = moduleConstants;
  }];

  return constants;
}

ABI24_0_0RCT_EXPORT_METHOD(configureNextLayoutAnimation:(NSDictionary *)config
                  withCallback:(ABI24_0_0RCTResponseSenderBlock)callback
                  errorCallback:(__unused ABI24_0_0RCTResponseSenderBlock)errorCallback)
{
  ABI24_0_0RCTLayoutAnimationGroup *layoutAnimationGroup =
    [[ABI24_0_0RCTLayoutAnimationGroup alloc] initWithConfig:config
                                           callback:callback];

  [self addUIBlock:^(ABI24_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    [uiManager setNextLayoutAnimationGroup:layoutAnimationGroup];
  }];
}

- (void)rootViewForReactABI24_0_0Tag:(NSNumber *)ReactABI24_0_0Tag withCompletion:(void (^)(UIView *view))completion
{
  ABI24_0_0RCTAssertMainQueue();
  ABI24_0_0RCTAssert(completion != nil, @"Attempted to resolve rootView for tag %@ without a completion block", ReactABI24_0_0Tag);

  if (ReactABI24_0_0Tag == nil) {
    completion(nil);
    return;
  }

  ABI24_0_0RCTExecuteOnUIManagerQueue(^{
    NSNumber *rootTag = [self shadowViewForReactABI24_0_0Tag:ReactABI24_0_0Tag].rootView.ReactABI24_0_0Tag;
    ABI24_0_0RCTExecuteOnMainQueue(^{
      UIView *rootView = nil;
      if (rootTag != nil) {
        rootView = [self viewForReactABI24_0_0Tag:rootTag];
      }
      completion(rootView);
    });
  });
}

static UIView *_jsResponder;

+ (UIView *)JSResponder
{
  return _jsResponder;
}

@end

@implementation ABI24_0_0RCTBridge (ABI24_0_0RCTUIManager)

- (ABI24_0_0RCTUIManager *)uiManager
{
  return [self moduleForClass:[ABI24_0_0RCTUIManager class]];
}

@end
