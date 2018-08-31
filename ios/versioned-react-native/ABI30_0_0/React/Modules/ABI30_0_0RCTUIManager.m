/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTUIManager.h"

#import <AVFoundation/AVFoundation.h>

#import "ABI30_0_0RCTAccessibilityManager.h"
#import "ABI30_0_0RCTAssert.h"
#import "ABI30_0_0RCTBridge+Private.h"
#import "ABI30_0_0RCTBridge.h"
#import "ABI30_0_0RCTComponent.h"
#import "ABI30_0_0RCTComponentData.h"
#import "ABI30_0_0RCTConvert.h"
#import "ABI30_0_0RCTDefines.h"
#import "ABI30_0_0RCTEventDispatcher.h"
#import "ABI30_0_0RCTLayoutAnimation.h"
#import "ABI30_0_0RCTLayoutAnimationGroup.h"
#import "ABI30_0_0RCTLog.h"
#import "ABI30_0_0RCTModuleData.h"
#import "ABI30_0_0RCTModuleMethod.h"
#import "ABI30_0_0RCTProfile.h"
#import "ABI30_0_0RCTRootContentView.h"
#import "ABI30_0_0RCTRootShadowView.h"
#import "ABI30_0_0RCTRootViewInternal.h"
#import "ABI30_0_0RCTScrollableProtocol.h"
#import "ABI30_0_0RCTShadowView+Internal.h"
#import "ABI30_0_0RCTShadowView.h"
#import "ABI30_0_0RCTSurfaceRootShadowView.h"
#import "ABI30_0_0RCTSurfaceRootView.h"
#import "ABI30_0_0RCTUIManagerObserverCoordinator.h"
#import "ABI30_0_0RCTUIManagerUtils.h"
#import "ABI30_0_0RCTUtils.h"
#import "ABI30_0_0RCTView.h"
#import "ABI30_0_0RCTViewManager.h"
#import "UIView+ReactABI30_0_0.h"

static void ABI30_0_0RCTTraverseViewNodes(id<ABI30_0_0RCTComponent> view, void (^block)(id<ABI30_0_0RCTComponent>))
{
  if (view.ReactABI30_0_0Tag) {
    block(view);

    for (id<ABI30_0_0RCTComponent> subview in view.ReactABI30_0_0Subviews) {
      ABI30_0_0RCTTraverseViewNodes(subview, block);
    }
  }
}

NSString *const ABI30_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification = @"ABI30_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification";

@implementation ABI30_0_0RCTUIManager
{
  // Root views are only mutated on the shadow queue
  NSMutableSet<NSNumber *> *_rootViewTags;
  NSMutableArray<ABI30_0_0RCTViewManagerUIBlock> *_pendingUIBlocks;

  // Animation
  ABI30_0_0RCTLayoutAnimationGroup *_layoutAnimationGroup; // Main thread only

  NSMutableDictionary<NSNumber *, ABI30_0_0RCTShadowView *> *_shadowViewRegistry; // ABI30_0_0RCT thread only
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry; // Main thread only

  NSMapTable<ABI30_0_0RCTShadowView *, NSArray<NSString *> *> *_shadowViewsWithUpdatedProps; // UIManager queue only.
  NSHashTable<ABI30_0_0RCTShadowView *> *_shadowViewsWithUpdatedChildren; // UIManager queue only.

  // Keyed by viewName
  NSDictionary *_componentDataByName;
}

@synthesize bridge = _bridge;

ABI30_0_0RCT_EXPORT_MODULE()

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

  ABI30_0_0RCTExecuteOnMainQueue(^{
    ABI30_0_0RCT_PROFILE_BEGIN_EVENT(ABI30_0_0RCTProfileTagAlways, @"UIManager invalidate", nil);
    for (NSNumber *rootViewTag in self->_rootViewTags) {
      UIView *rootView = self->_viewRegistry[rootViewTag];
      if ([rootView conformsToProtocol:@protocol(ABI30_0_0RCTInvalidating)]) {
        [(id<ABI30_0_0RCTInvalidating>)rootView invalidate];
      }
    }

    self->_rootViewTags = nil;
    self->_shadowViewRegistry = nil;
    self->_viewRegistry = nil;
    self->_bridge = nil;

    [[NSNotificationCenter defaultCenter] removeObserver:self];
    ABI30_0_0RCT_PROFILE_END_EVENT(ABI30_0_0RCTProfileTagAlways, @"");
  });
}

- (NSMutableDictionary<NSNumber *, ABI30_0_0RCTShadowView *> *)shadowViewRegistry
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

- (void)setBridge:(ABI30_0_0RCTBridge *)bridge
{
  ABI30_0_0RCTAssert(_bridge == nil, @"Should not re-use same UIIManager instance");
  _bridge = bridge;

  _shadowViewRegistry = [NSMutableDictionary new];
  _viewRegistry = [NSMutableDictionary new];

  _shadowViewsWithUpdatedProps = [NSMapTable weakToStrongObjectsMapTable];
  _shadowViewsWithUpdatedChildren = [NSHashTable weakObjectsHashTable];

  // Internal resources
  _pendingUIBlocks = [NSMutableArray new];
  _rootViewTags = [NSMutableSet new];

  _observerCoordinator = [ABI30_0_0RCTUIManagerObserverCoordinator new];

  // Get view managers from bridge
  NSMutableDictionary *componentDataByName = [NSMutableDictionary new];
  for (Class moduleClass in _bridge.moduleClasses) {
    if ([moduleClass isSubclassOfClass:[ABI30_0_0RCTViewManager class]]) {
      ABI30_0_0RCTComponentData *componentData = [[ABI30_0_0RCTComponentData alloc] initWithManagerClass:moduleClass
                                                                                bridge:_bridge];
      componentDataByName[componentData.name] = componentData;
    }
  }

  _componentDataByName = [componentDataByName copy];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:ABI30_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
#if !TARGET_OS_TV
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(namedOrientationDidChange)
                                               name:UIDeviceOrientationDidChangeNotification
                                             object:nil];
#endif
  [ABI30_0_0RCTLayoutAnimation initializeStatics];
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

  ABI30_0_0RCTExecuteOnUIManagerQueue(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI30_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
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
  return ABI30_0_0RCTGetUIManagerQueue();
}

- (void)registerRootViewTag:(NSNumber *)rootTag
{
  ABI30_0_0RCTAssertUIManagerQueue();

  ABI30_0_0RCTAssert(ABI30_0_0RCTIsReactABI30_0_0RootView(rootTag),
    @"Attempt to register rootTag (%@) which is not actually root tag.", rootTag);

  ABI30_0_0RCTAssert(![_rootViewTags containsObject:rootTag],
    @"Attempt to register rootTag (%@) which was already registred.", rootTag);

  [_rootViewTags addObject:rootTag];

  // Registering root shadow view
  ABI30_0_0RCTSurfaceRootShadowView *shadowView = [ABI30_0_0RCTSurfaceRootShadowView new];
  shadowView.ReactABI30_0_0Tag = rootTag;
  _shadowViewRegistry[rootTag] = shadowView;

  // Registering root view
  ABI30_0_0RCTExecuteOnMainQueue(^{
    ABI30_0_0RCTSurfaceRootView *rootView = [ABI30_0_0RCTSurfaceRootView new];
    rootView.ReactABI30_0_0Tag = rootTag;
    self->_viewRegistry[rootTag] = rootView;
  });
}

- (void)registerRootView:(ABI30_0_0RCTRootContentView *)rootView
{
  ABI30_0_0RCTAssertMainQueue();

  NSNumber *ReactABI30_0_0Tag = rootView.ReactABI30_0_0Tag;
  ABI30_0_0RCTAssert(ABI30_0_0RCTIsReactABI30_0_0RootView(ReactABI30_0_0Tag),
            @"View %@ with tag #%@ is not a root view", rootView, ReactABI30_0_0Tag);

  UIView *existingView = _viewRegistry[ReactABI30_0_0Tag];
  ABI30_0_0RCTAssert(existingView == nil || existingView == rootView,
            @"Expect all root views to have unique tag. Added %@ twice", ReactABI30_0_0Tag);

  CGSize availableSize = rootView.availableSize;

  // Register view
  _viewRegistry[ReactABI30_0_0Tag] = rootView;

  // Register shadow view
  ABI30_0_0RCTExecuteOnUIManagerQueue(^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI30_0_0RCTRootShadowView *shadowView = [ABI30_0_0RCTRootShadowView new];
    shadowView.availableSize = availableSize;
    shadowView.ReactABI30_0_0Tag = ReactABI30_0_0Tag;
    shadowView.viewName = NSStringFromClass([rootView class]);
    self->_shadowViewRegistry[shadowView.ReactABI30_0_0Tag] = shadowView;
    [self->_rootViewTags addObject:ReactABI30_0_0Tag];
  });
}

- (NSString *)viewNameForReactABI30_0_0Tag:(NSNumber *)ReactABI30_0_0Tag
{
  ABI30_0_0RCTAssertUIManagerQueue();
  return _shadowViewRegistry[ReactABI30_0_0Tag].viewName;
}

- (UIView *)viewForReactABI30_0_0Tag:(NSNumber *)ReactABI30_0_0Tag
{
  ABI30_0_0RCTAssertMainQueue();
  return _viewRegistry[ReactABI30_0_0Tag];
}

- (ABI30_0_0RCTShadowView *)shadowViewForReactABI30_0_0Tag:(NSNumber *)ReactABI30_0_0Tag
{
  ABI30_0_0RCTAssertUIManagerQueue();
  return _shadowViewRegistry[ReactABI30_0_0Tag];
}

- (void)_executeBlockWithShadowView:(void (^)(ABI30_0_0RCTShadowView *shadowView))block forTag:(NSNumber *)tag
{
  ABI30_0_0RCTAssertMainQueue();

  ABI30_0_0RCTExecuteOnUIManagerQueue(^{
    ABI30_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[tag];

    if (shadowView == nil) {
      ABI30_0_0RCTLogInfo(@"Could not locate shadow view with tag #%@, this is probably caused by a temporary inconsistency between native views and shadow views.", tag);
      return;
    }

    block(shadowView);
  });
}

- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView
{
  ABI30_0_0RCTAssertMainQueue();
  [self _executeBlockWithShadowView:^(ABI30_0_0RCTShadowView *shadowView) {
    ABI30_0_0RCTAssert([shadowView isKindOfClass:[ABI30_0_0RCTRootShadowView class]], @"Located shadow view is actually not root view.");

    ABI30_0_0RCTRootShadowView *rootShadowView = (ABI30_0_0RCTRootShadowView *)shadowView;

    if (CGSizeEqualToSize(availableSize, rootShadowView.availableSize)) {
      return;
    }

    rootShadowView.availableSize = availableSize;
    [self setNeedsLayout];
  } forTag:rootView.ReactABI30_0_0Tag];
}

- (void)setLocalData:(NSObject *)localData forView:(UIView *)view
{
  ABI30_0_0RCTAssertMainQueue();
  [self _executeBlockWithShadowView:^(ABI30_0_0RCTShadowView *shadowView) {
    shadowView.localData = localData;
    [self setNeedsLayout];
  } forTag:view.ReactABI30_0_0Tag];
}

/**
 * TODO(yuwang): implement the nativeID functionality in a more efficient way
 *               instead of searching the whole view tree
 */
- (UIView *)viewForNativeID:(NSString *)nativeID withRootTag:(NSNumber *)rootTag
{
  ABI30_0_0RCTAssertMainQueue();
  UIView *view = [self viewForReactABI30_0_0Tag:rootTag];
  return [self _lookupViewForNativeID:nativeID inView:view];
}

- (UIView *)_lookupViewForNativeID:(NSString *)nativeID inView:(UIView *)view
{
  ABI30_0_0RCTAssertMainQueue();
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
  ABI30_0_0RCTAssertMainQueue();
  [self _executeBlockWithShadowView:^(ABI30_0_0RCTShadowView *shadowView) {
    if (CGSizeEqualToSize(size, shadowView.size)) {
      return;
    }

    shadowView.size = size;
    [self setNeedsLayout];
  } forTag:view.ReactABI30_0_0Tag];
}

- (void)setIntrinsicContentSize:(CGSize)intrinsicContentSize forView:(UIView *)view
{
  ABI30_0_0RCTAssertMainQueue();
  [self _executeBlockWithShadowView:^(ABI30_0_0RCTShadowView *shadowView) {
    if (CGSizeEqualToSize(shadowView.intrinsicContentSize, intrinsicContentSize)) {
      return;
    }

    shadowView.intrinsicContentSize = intrinsicContentSize;
    [self setNeedsLayout];
  } forTag:view.ReactABI30_0_0Tag];
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray<id<ABI30_0_0RCTComponent>> *)children
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI30_0_0RCTComponent>> *)registry
{
  for (id<ABI30_0_0RCTComponent> child in children) {
    ABI30_0_0RCTTraverseViewNodes(registry[child.ReactABI30_0_0Tag], ^(id<ABI30_0_0RCTComponent> subview) {
      ABI30_0_0RCTAssert(![subview isReactABI30_0_0RootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(ABI30_0_0RCTInvalidating)]) {
        [(id<ABI30_0_0RCTInvalidating>)subview invalidate];
      }
      [registry removeObjectForKey:subview.ReactABI30_0_0Tag];
    });
  }
}

- (void)addUIBlock:(ABI30_0_0RCTViewManagerUIBlock)block
{
  ABI30_0_0RCTAssertUIManagerQueue();

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks addObject:block];
}

- (void)prependUIBlock:(ABI30_0_0RCTViewManagerUIBlock)block
{
  ABI30_0_0RCTAssertUIManagerQueue();

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks insertObject:block atIndex:0];
}

- (void)setNextLayoutAnimationGroup:(ABI30_0_0RCTLayoutAnimationGroup *)layoutAnimationGroup
{
  ABI30_0_0RCTAssertMainQueue();

  if (_layoutAnimationGroup && ![_layoutAnimationGroup isEqual:layoutAnimationGroup]) {
    ABI30_0_0RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.",
      [_layoutAnimationGroup description],
      [layoutAnimationGroup description]);
  }

  _layoutAnimationGroup = layoutAnimationGroup;
}

- (ABI30_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI30_0_0RCTRootShadowView *)rootShadowView
{
  ABI30_0_0RCTAssertUIManagerQueue();

  NSHashTable<ABI30_0_0RCTShadowView *> *affectedShadowViews = [NSHashTable weakObjectsHashTable];
  [rootShadowView layoutWithAffectedShadowViews:affectedShadowViews];

  if (!affectedShadowViews.count) {
    // no frame change results in no UI update block
    return nil;
  }

  typedef struct {
    CGRect frame;
    UIUserInterfaceLayoutDirection layoutDirection;
    BOOL isNew;
    BOOL parentIsNew;
  } ABI30_0_0RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = affectedShadowViews.count;
  NSMutableArray *ReactABI30_0_0Tags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(ABI30_0_0RCTFrameData) * count];
  {
    NSUInteger index = 0;
    ABI30_0_0RCTFrameData *frameDataArray = (ABI30_0_0RCTFrameData *)framesData.mutableBytes;
    for (ABI30_0_0RCTShadowView *shadowView in affectedShadowViews) {
      ReactABI30_0_0Tags[index] = shadowView.ReactABI30_0_0Tag;
      ABI30_0_0RCTLayoutMetrics layoutMetrics = shadowView.layoutMetrics;
      frameDataArray[index++] = (ABI30_0_0RCTFrameData){
        layoutMetrics.frame,
        layoutMetrics.layoutDirection,
        shadowView.isNewView,
        shadowView.superview.isNewView,
      };
    }
  }

  for (ABI30_0_0RCTShadowView *shadowView in affectedShadowViews) {

    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *ReactABI30_0_0Tag = shadowView.ReactABI30_0_0Tag;

    if (shadowView.onLayout) {
      CGRect frame = shadowView.layoutMetrics.frame;
      shadowView.onLayout(@{
        @"layout": @{
          @"x": @(frame.origin.x),
          @"y": @(frame.origin.y),
          @"width": @(frame.size.width),
          @"height": @(frame.size.height),
        },
      });
    }

    if (
        ABI30_0_0RCTIsReactABI30_0_0RootView(ReactABI30_0_0Tag) &&
        [shadowView isKindOfClass:[ABI30_0_0RCTRootShadowView class]]
    ) {
      CGSize contentSize = shadowView.layoutMetrics.frame.size;

      ABI30_0_0RCTExecuteOnMainQueue(^{
        UIView *view = self->_viewRegistry[ReactABI30_0_0Tag];
        ABI30_0_0RCTAssert(view != nil, @"view (for ID %@) not found", ReactABI30_0_0Tag);

        ABI30_0_0RCTRootView *rootView = (ABI30_0_0RCTRootView *)[view superview];
        if ([rootView isKindOfClass:[ABI30_0_0RCTRootView class]]) {
          rootView.intrinsicContentSize = contentSize;
        }
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    const ABI30_0_0RCTFrameData *frameDataArray = (const ABI30_0_0RCTFrameData *)framesData.bytes;
    ABI30_0_0RCTLayoutAnimationGroup *layoutAnimationGroup = uiManager->_layoutAnimationGroup;

    __block NSUInteger completionsCalled = 0;

    NSInteger index = 0;
    for (NSNumber *ReactABI30_0_0Tag in ReactABI30_0_0Tags) {
      ABI30_0_0RCTFrameData frameData = frameDataArray[index++];

      UIView *view = viewRegistry[ReactABI30_0_0Tag];
      CGRect frame = frameData.frame;

      UIUserInterfaceLayoutDirection layoutDirection = frameData.layoutDirection;
      BOOL isNew = frameData.isNew;
      ABI30_0_0RCTLayoutAnimation *updatingLayoutAnimation = isNew ? nil : layoutAnimationGroup.updatingLayoutAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      ABI30_0_0RCTLayoutAnimation *creatingLayoutAnimation = shouldAnimateCreation ? layoutAnimationGroup.creatingLayoutAnimation : nil;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (layoutAnimationGroup.callback && completionsCalled == count) {
          layoutAnimationGroup.callback(@[@(finished)]);

          // It's unsafe to call this callback more than once, so we nil it out here
          // to make sure that doesn't happen.
          layoutAnimationGroup.callback = nil;
        }
      };

      if (view.ReactABI30_0_0LayoutDirection != layoutDirection) {
        view.ReactABI30_0_0LayoutDirection = layoutDirection;
      }

      if (creatingLayoutAnimation) {

        // Animate view creation
        [view ReactABI30_0_0SetFrame:frame];

        CATransform3D finalTransform = view.layer.transform;
        CGFloat finalOpacity = view.layer.opacity;

        NSString *property = creatingLayoutAnimation.property;
        if ([property isEqualToString:@"scaleXY"]) {
          view.layer.transform = CATransform3DMakeScale(0, 0, 0);
        } else if ([property isEqualToString:@"opacity"]) {
          view.layer.opacity = 0.0;
        } else {
          ABI30_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
                      creatingLayoutAnimation.property);
        }

        [creatingLayoutAnimation performAnimations:^{
          if ([property isEqualToString:@"scaleXY"]) {
            view.layer.transform = finalTransform;
          } else if ([property isEqualToString:@"opacity"]) {
            view.layer.opacity = finalOpacity;
          }
        } withCompletionBlock:completion];

      } else if (updatingLayoutAnimation) {

        // Animate view update
        [updatingLayoutAnimation performAnimations:^{
          [view ReactABI30_0_0SetFrame:frame];
        } withCompletionBlock:completion];

      } else {

        // Update without animation
        [view ReactABI30_0_0SetFrame:frame];
        completion(YES);
      }
    }

    // Clean up
    uiManager->_layoutAnimationGroup = nil;
  };
}

/**
 * A method to be called from JS, which takes a container ID and then releases
 * all subviews for that container upon receipt.
 */
ABI30_0_0RCT_EXPORT_METHOD(removeSubviewsFromContainerWithID:(nonnull NSNumber *)containerID)
{
  id<ABI30_0_0RCTComponent> container = _shadowViewRegistry[containerID];
  ABI30_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", containerID);

  NSUInteger subviewsCount = [container ReactABI30_0_0Subviews].count;
  NSMutableArray<NSNumber *> *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
  for (NSUInteger childIndex = 0; childIndex < subviewsCount; childIndex++) {
    [indices addObject:@(childIndex)];
  }

  [self manageChildren:containerID
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI30_0_0Tags:nil
          addAtIndices:nil
       removeAtIndices:indices];
}

/**
 * Disassociates children from container. Doesn't remove from registries.
 * TODO: use [NSArray getObjects:buffer] to reuse same fast buffer each time.
 *
 * @returns Array of removed items.
 */
- (NSArray<id<ABI30_0_0RCTComponent>> *)_childrenToRemoveFromContainer:(id<ABI30_0_0RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if (atIndices.count == 0 || [container ReactABI30_0_0Subviews].count == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray<id<ABI30_0_0RCTComponent>> *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  ABI30_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSNumber *indexNumber in atIndices) {
    NSUInteger index = indexNumber.unsignedIntegerValue;
    if (index < [container ReactABI30_0_0Subviews].count) {
      [removedChildren addObject:[container ReactABI30_0_0Subviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    NSString *message = [NSString stringWithFormat:@"removedChildren count (%tu) was not what we expected (%tu)",
                         removedChildren.count, atIndices.count];
    ABI30_0_0RCTFatal(ABI30_0_0RCTErrorWithMessage(message));
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray<id<ABI30_0_0RCTComponent>> *)children
          fromContainer:(id<ABI30_0_0RCTComponent>)container
{
  for (id<ABI30_0_0RCTComponent> removedChild in children) {
    [container removeReactABI30_0_0Subview:removedChild];
  }
}

/**
 * Remove subviews from their parent with an animation.
 */
- (void)_removeChildren:(NSArray<UIView *> *)children
          fromContainer:(UIView *)container
          withAnimation:(ABI30_0_0RCTLayoutAnimationGroup *)animation
{
  ABI30_0_0RCTAssertMainQueue();
  ABI30_0_0RCTLayoutAnimation *deletingLayoutAnimation = animation.deletingLayoutAnimation;

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
    // So, we have to remove this view from ReactABI30_0_0's view hierarchy but postpone removing from UIKit's hierarchy.
    // Here the problem: the default implementation of `-[UIView removeReactABI30_0_0Subview:]` also removes the view from UIKit's hierarchy.
    // So, let's temporary restore the view back after removing.
    // To do so, we have to memorize original `superview` (which can differ from `container`) and an index of removed view.
    UIView *originalSuperview = removedChild.superview;
    NSUInteger originalIndex = [originalSuperview.subviews indexOfObjectIdenticalTo:removedChild];
    [container removeReactABI30_0_0Subview:removedChild];
    // Disable user interaction while the view is animating
    // since the view is (conceptually) deleted and not supposed to be interactive.
    removedChild.userInteractionEnabled = NO;
    [originalSuperview insertSubview:removedChild atIndex:originalIndex];

    NSString *property = deletingLayoutAnimation.property;
    [deletingLayoutAnimation performAnimations:^{
      if ([property isEqualToString:@"scaleXY"]) {
        removedChild.layer.transform = CATransform3DMakeScale(0.001, 0.001, 0.001);
      } else if ([property isEqualToString:@"opacity"]) {
        removedChild.layer.opacity = 0.0;
      } else {
        ABI30_0_0RCTLogError(@"Unsupported layout animation createConfig property %@",
                    deletingLayoutAnimation.property);
      }
    } withCompletionBlock:completion];
  }
}


ABI30_0_0RCT_EXPORT_METHOD(removeRootView:(nonnull NSNumber *)rootReactABI30_0_0Tag)
{
  ABI30_0_0RCTShadowView *rootShadowView = _shadowViewRegistry[rootReactABI30_0_0Tag];
  ABI30_0_0RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootReactABI30_0_0Tag);
  [self _purgeChildren:(NSArray<id<ABI30_0_0RCTComponent>> *)rootShadowView.ReactABI30_0_0Subviews
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI30_0_0RCTComponent>> *)_shadowViewRegistry];
  [_shadowViewRegistry removeObjectForKey:rootReactABI30_0_0Tag];
  [_rootViewTags removeObject:rootReactABI30_0_0Tag];

  [self addUIBlock:^(ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    ABI30_0_0RCTAssertMainQueue();
    UIView *rootView = viewRegistry[rootReactABI30_0_0Tag];
    [uiManager _purgeChildren:(NSArray<id<ABI30_0_0RCTComponent>> *)rootView.ReactABI30_0_0Subviews
                 fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI30_0_0RCTComponent>> *)viewRegistry];
    [(NSMutableDictionary *)viewRegistry removeObjectForKey:rootReactABI30_0_0Tag];
  }];
}

ABI30_0_0RCT_EXPORT_METHOD(replaceExistingNonRootView:(nonnull NSNumber *)ReactABI30_0_0Tag
                  withView:(nonnull NSNumber *)newReactABI30_0_0Tag)
{
  ABI30_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI30_0_0Tag];
  ABI30_0_0RCTAssert(shadowView != nil, @"shadowView (for ID %@) not found", ReactABI30_0_0Tag);

  ABI30_0_0RCTShadowView *superShadowView = shadowView.superview;
  if (!superShadowView) {
    ABI30_0_0RCTAssert(NO, @"shadowView super (of ID %@) not found", ReactABI30_0_0Tag);
    return;
  }

  NSUInteger indexOfView = [superShadowView.ReactABI30_0_0Subviews indexOfObjectIdenticalTo:shadowView];
  ABI30_0_0RCTAssert(indexOfView != NSNotFound, @"View's superview doesn't claim it as subview (id %@)", ReactABI30_0_0Tag);
  NSArray<NSNumber *> *removeAtIndices = @[@(indexOfView)];
  NSArray<NSNumber *> *addTags = @[newReactABI30_0_0Tag];
  [self manageChildren:superShadowView.ReactABI30_0_0Tag
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactABI30_0_0Tags:addTags
          addAtIndices:removeAtIndices
       removeAtIndices:removeAtIndices];
}

ABI30_0_0RCT_EXPORT_METHOD(setChildren:(nonnull NSNumber *)containerTag
                  ReactABI30_0_0Tags:(NSArray<NSNumber *> *)ReactABI30_0_0Tags)
{
  ABI30_0_0RCTSetChildren(containerTag, ReactABI30_0_0Tags,
                 (NSDictionary<NSNumber *, id<ABI30_0_0RCTComponent>> *)_shadowViewRegistry);

  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){

    ABI30_0_0RCTSetChildren(containerTag, ReactABI30_0_0Tags,
                   (NSDictionary<NSNumber *, id<ABI30_0_0RCTComponent>> *)viewRegistry);
  }];

  [self _shadowViewDidReceiveUpdatedChildren:_shadowViewRegistry[containerTag]];
}

static void ABI30_0_0RCTSetChildren(NSNumber *containerTag,
                           NSArray<NSNumber *> *ReactABI30_0_0Tags,
                           NSDictionary<NSNumber *, id<ABI30_0_0RCTComponent>> *registry)
{
  id<ABI30_0_0RCTComponent> container = registry[containerTag];
  NSInteger index = 0;
  for (NSNumber *ReactABI30_0_0Tag in ReactABI30_0_0Tags) {
    id<ABI30_0_0RCTComponent> view = registry[ReactABI30_0_0Tag];
    if (view) {
      [container insertReactABI30_0_0Subview:view atIndex:index++];
    }
  }
}

ABI30_0_0RCT_EXPORT_METHOD(manageChildren:(nonnull NSNumber *)containerTag
                  moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
                  moveToIndices:(NSArray<NSNumber *> *)moveToIndices
                  addChildReactABI30_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI30_0_0Tags
                  addAtIndices:(NSArray<NSNumber *> *)addAtIndices
                  removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices)
{
  [self _manageChildren:containerTag
        moveFromIndices:moveFromIndices
          moveToIndices:moveToIndices
      addChildReactABI30_0_0Tags:addChildReactABI30_0_0Tags
           addAtIndices:addAtIndices
        removeAtIndices:removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI30_0_0RCTComponent>> *)_shadowViewRegistry];

  [self addUIBlock:^(ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    [uiManager _manageChildren:containerTag
               moveFromIndices:moveFromIndices
                 moveToIndices:moveToIndices
             addChildReactABI30_0_0Tags:addChildReactABI30_0_0Tags
                  addAtIndices:addAtIndices
               removeAtIndices:removeAtIndices
                      registry:(NSMutableDictionary<NSNumber *, id<ABI30_0_0RCTComponent>> *)viewRegistry];
  }];

  [self _shadowViewDidReceiveUpdatedChildren:_shadowViewRegistry[containerTag]];
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildReactABI30_0_0Tags:(NSArray<NSNumber *> *)addChildReactABI30_0_0Tags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI30_0_0RCTComponent>> *)registry
{
  id<ABI30_0_0RCTComponent> container = registry[containerTag];
  ABI30_0_0RCTAssert(moveFromIndices.count == moveToIndices.count, @"moveFromIndices had size %tu, moveToIndices had size %tu", moveFromIndices.count, moveToIndices.count);
  ABI30_0_0RCTAssert(addChildReactABI30_0_0Tags.count == addAtIndices.count, @"there should be at least one ReactABI30_0_0 child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray<id<ABI30_0_0RCTComponent>> *permanentlyRemovedChildren =
    [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
  NSArray<id<ABI30_0_0RCTComponent>> *temporarilyRemovedChildren =
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
    id<ABI30_0_0RCTComponent> view = registry[addChildReactABI30_0_0Tags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray<NSNumber *> *sortedIndices =
    [destinationsToChildrenToAdd.allKeys sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *ReactABI30_0_0Index in sortedIndices) {
    [container insertReactABI30_0_0Subview:destinationsToChildrenToAdd[ReactABI30_0_0Index]
                          atIndex:ReactABI30_0_0Index.integerValue];
  }
}

ABI30_0_0RCT_EXPORT_METHOD(createView:(nonnull NSNumber *)ReactABI30_0_0Tag
                  viewName:(NSString *)viewName
                  rootTag:(nonnull NSNumber *)rootTag
                  props:(NSDictionary *)props)
{
  ABI30_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  if (componentData == nil) {
    ABI30_0_0RCTLogError(@"No component found for view with name \"%@\"", viewName);
  }

  // Register shadow view
  ABI30_0_0RCTShadowView *shadowView = [componentData createShadowViewWithTag:ReactABI30_0_0Tag];
  if (shadowView) {
    [componentData setProps:props forShadowView:shadowView];
    _shadowViewRegistry[ReactABI30_0_0Tag] = shadowView;
    ABI30_0_0RCTShadowView *rootView = _shadowViewRegistry[rootTag];
    ABI30_0_0RCTAssert([rootView isKindOfClass:[ABI30_0_0RCTRootShadowView class]] ||
              [rootView isKindOfClass:[ABI30_0_0RCTSurfaceRootShadowView class]],
      @"Given `rootTag` (%@) does not correspond to a valid root shadow view instance.", rootTag);
    shadowView.rootView = (ABI30_0_0RCTRootShadowView *)rootView;
  }

  // Dispatch view creation directly to the main thread instead of adding to
  // UIBlocks array. This way, it doesn't get deferred until after layout.
  __block UIView *preliminaryCreatedView = nil;

  void (^createViewBlock)(void) = ^{
    // Do nothing on the second run.
    if (preliminaryCreatedView) {
      return;
    }

    preliminaryCreatedView = [componentData createViewWithTag:ReactABI30_0_0Tag];

    if (preliminaryCreatedView) {
      self->_viewRegistry[ReactABI30_0_0Tag] = preliminaryCreatedView;
    }
  };

  // We cannot guarantee that asynchronously scheduled block will be executed
  // *before* a block is added to the regular mounting process (simply because
  // mounting process can be managed externally while the main queue is
  // locked).
  // So, we positively dispatch it asynchronously and double check inside
  // the regular mounting block.

  ABI30_0_0RCTExecuteOnMainQueue(createViewBlock);

  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    createViewBlock();

    if (preliminaryCreatedView) {
      [componentData setProps:props forView:preliminaryCreatedView];
    }
  }];

  [self _shadowView:shadowView didReceiveUpdatedProps:[props allKeys]];
}

ABI30_0_0RCT_EXPORT_METHOD(updateView:(nonnull NSNumber *)ReactABI30_0_0Tag
                  viewName:(NSString *)viewName // not always reliable, use shadowView.viewName if available
                  props:(NSDictionary *)props)
{
  ABI30_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI30_0_0Tag];
  ABI30_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName ?: viewName];
  [componentData setProps:props forShadowView:shadowView];

  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI30_0_0Tag];
    [componentData setProps:props forView:view];
  }];

  [self _shadowView:shadowView didReceiveUpdatedProps:[props allKeys]];
}

- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)ReactABI30_0_0Tag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props
{
  ABI30_0_0RCTAssertMainQueue();
  ABI30_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  UIView *view = _viewRegistry[ReactABI30_0_0Tag];
  [componentData setProps:props forView:view];
}

ABI30_0_0RCT_EXPORT_METHOD(focus:(nonnull NSNumber *)ReactABI30_0_0Tag)
{
  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *newResponder = viewRegistry[ReactABI30_0_0Tag];
    [newResponder ReactABI30_0_0Focus];
  }];
}

ABI30_0_0RCT_EXPORT_METHOD(blur:(nonnull NSNumber *)ReactABI30_0_0Tag)
{
  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *currentResponder = viewRegistry[ReactABI30_0_0Tag];
    [currentResponder ReactABI30_0_0Blur];
  }];
}

ABI30_0_0RCT_EXPORT_METHOD(findSubviewIn:(nonnull NSNumber *)ReactABI30_0_0Tag atPoint:(CGPoint)point callback:(ABI30_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI30_0_0Tag];
    UIView *target = [view hitTest:point withEvent:nil];
    CGRect frame = [target convertRect:target.bounds toView:view];

    while (target.ReactABI30_0_0Tag == nil && target.superview != nil) {
      target = target.superview;
    }

    callback(@[
      ABI30_0_0RCTNullIfNil(target.ReactABI30_0_0Tag),
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
    ]);
  }];
}

ABI30_0_0RCT_EXPORT_METHOD(dispatchViewManagerCommand:(nonnull NSNumber *)ReactABI30_0_0Tag
                  commandID:(NSInteger)commandID
                  commandArgs:(NSArray<id> *)commandArgs)
{
  ABI30_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI30_0_0Tag];
  ABI30_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName];
  Class managerClass = componentData.managerClass;
  ABI30_0_0RCTModuleData *moduleData = [_bridge moduleDataForName:ABI30_0_0RCTBridgeModuleNameForClass(managerClass)];
  id<ABI30_0_0RCTBridgeMethod> method = moduleData.methods[commandID];

  NSArray *args = [@[ReactABI30_0_0Tag] arrayByAddingObjectsFromArray:commandArgs];
  [method invokeWithBridge:_bridge module:componentData.manager arguments:args];
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
  [self _dispatchPropsDidChangeEvents];
  [self _dispatchChildrenDidChangeEvents];

  [_observerCoordinator uiManagerWillPerformLayout:self];

  // Perform layout
  for (NSNumber *ReactABI30_0_0Tag in _rootViewTags) {
    ABI30_0_0RCTRootShadowView *rootView = (ABI30_0_0RCTRootShadowView *)_shadowViewRegistry[ReactABI30_0_0Tag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
  }

  [_observerCoordinator uiManagerDidPerformLayout:self];

  [_observerCoordinator uiManagerWillPerformMounting:self];

  [self flushUIBlocksWithCompletion:^{
    [self->_observerCoordinator uiManagerDidPerformMounting:self];
  }];
}

- (void)flushUIBlocksWithCompletion:(void (^)(void))completion;
{
  ABI30_0_0RCTAssertUIManagerQueue();

  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  NSArray<ABI30_0_0RCTViewManagerUIBlock> *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [NSMutableArray new];

  if (previousPendingUIBlocks.count == 0) {
    completion();
    return;
  }

  __weak typeof(self) weakSelf = self;

   void (^mountingBlock)(void) = ^{
    typeof(self) strongSelf = weakSelf;

    @try {
      for (ABI30_0_0RCTViewManagerUIBlock block in previousPendingUIBlocks) {
        block(strongSelf, strongSelf->_viewRegistry);
      }
    }
    @catch (NSException *exception) {
      ABI30_0_0RCTLogError(@"Exception thrown while executing UI block: %@", exception);
    }
  };

  if ([self.observerCoordinator uiManager:self performMountingWithBlock:mountingBlock]) {
    completion();
    return;
  }

  // Execute the previously queued UI blocks
  ABI30_0_0RCTProfileBeginFlowEvent();
  ABI30_0_0RCTExecuteOnMainQueue(^{
    ABI30_0_0RCTProfileEndFlowEvent();
    ABI30_0_0RCT_PROFILE_BEGIN_EVENT(ABI30_0_0RCTProfileTagAlways, @"-[UIManager flushUIBlocks]", (@{
      @"count": [@(previousPendingUIBlocks.count) stringValue],
    }));

    mountingBlock();

    ABI30_0_0RCT_PROFILE_END_EVENT(ABI30_0_0RCTProfileTagAlways, @"");

    ABI30_0_0RCTExecuteOnUIManagerQueue(completion);
  });
}

- (void)setNeedsLayout
{
  // If there is an active batch layout will happen when batch finished, so we will wait for that.
  // Otherwise we immediately trigger layout.
  if (![_bridge isBatchActive] && ![_bridge isLoading]) {
    [self _layoutAndMount];
  }
}

- (void)_shadowView:(ABI30_0_0RCTShadowView *)shadowView didReceiveUpdatedProps:(NSArray<NSString *> *)props
{
  // We collect a set with changed `shadowViews` and its changed props,
  // so we have to maintain this collection properly.
  NSArray<NSString *> *previousProps;
  if ((previousProps = [_shadowViewsWithUpdatedProps objectForKey:shadowView])) {
    // Merging already registred changed props and new ones.
    NSMutableSet *set = [NSMutableSet setWithArray:previousProps];
    [set addObjectsFromArray:props];
    props = [set allObjects];
  }

  [_shadowViewsWithUpdatedProps setObject:props forKey:shadowView];
}

- (void)_shadowViewDidReceiveUpdatedChildren:(ABI30_0_0RCTShadowView *)shadowView
{
  [_shadowViewsWithUpdatedChildren addObject:shadowView];
}

- (void)_dispatchChildrenDidChangeEvents
{
  if (_shadowViewsWithUpdatedChildren.count == 0) {
    return;
  }

  NSHashTable<ABI30_0_0RCTShadowView *> *shadowViews = _shadowViewsWithUpdatedChildren;
  _shadowViewsWithUpdatedChildren = [NSHashTable weakObjectsHashTable];

  NSMutableArray *tags = [NSMutableArray arrayWithCapacity:shadowViews.count];

  for (ABI30_0_0RCTShadowView *shadowView in shadowViews) {
    [shadowView didUpdateReactABI30_0_0Subviews];
    [tags addObject:shadowView.ReactABI30_0_0Tag];
  }

  [self addUIBlock:^(ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (NSNumber *tag in tags) {
      UIView<ABI30_0_0RCTComponent> *view = viewRegistry[tag];
      [view didUpdateReactABI30_0_0Subviews];
    }
  }];
}

- (void)_dispatchPropsDidChangeEvents
{
  if (_shadowViewsWithUpdatedProps.count == 0) {
    return;
  }

  NSMapTable<ABI30_0_0RCTShadowView *, NSArray<NSString *> *> *shadowViews = _shadowViewsWithUpdatedProps;
  _shadowViewsWithUpdatedProps = [NSMapTable weakToStrongObjectsMapTable];

  NSMapTable<NSNumber *, NSArray<NSString *> *> *tags = [NSMapTable strongToStrongObjectsMapTable];

  for (ABI30_0_0RCTShadowView *shadowView in shadowViews) {
    NSArray<NSString *> *props = [shadowViews objectForKey:shadowView];
    [shadowView didSetProps:props];
    [tags setObject:props forKey:shadowView.ReactABI30_0_0Tag];
  }

  [self addUIBlock:^(ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (NSNumber *tag in tags) {
      UIView<ABI30_0_0RCTComponent> *view = viewRegistry[tag];
      [view didSetProps:[tags objectForKey:tag]];
    }
  }];
}

ABI30_0_0RCT_EXPORT_METHOD(measure:(nonnull NSNumber *)ReactABI30_0_0Tag
                  callback:(ABI30_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI30_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI30_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI30_0_0Tag);
      callback(@[]);
      return;
    }

    // If in a <Modal>, rootView will be the root of the modal container.
    UIView *rootView = view;
    while (rootView.superview && ![rootView isReactABI30_0_0RootView]) {
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

ABI30_0_0RCT_EXPORT_METHOD(measureInWindow:(nonnull NSNumber *)ReactABI30_0_0Tag
                  callback:(ABI30_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI30_0_0Tag];
    if (!view) {
      // this view was probably collapsed out
      ABI30_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ReactABI30_0_0Tag);
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
ABI30_0_0RCT_EXPORT_METHOD(viewIsDescendantOf:(nonnull NSNumber *)ReactABI30_0_0Tag
                  ancestor:(nonnull NSNumber *)ancestorReactABI30_0_0Tag
                  callback:(ABI30_0_0RCTResponseSenderBlock)callback)
{
  ABI30_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI30_0_0Tag];
  ABI30_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI30_0_0Tag];
  if (!shadowView) {
    return;
  }
  if (!ancestorShadowView) {
    return;
  }
  BOOL viewIsAncestor = [shadowView viewIsDescendantOf:ancestorShadowView];
  callback(@[@(viewIsAncestor)]);
}

static void ABI30_0_0RCTMeasureLayout(ABI30_0_0RCTShadowView *view,
                             ABI30_0_0RCTShadowView *ancestor,
                             ABI30_0_0RCTResponseSenderBlock callback)
{
  if (!view) {
    return;
  }
  if (!ancestor) {
    return;
  }
  CGRect result = [view measureLayoutRelativeToAncestor:ancestor];
  if (CGRectIsNull(result)) {
    ABI30_0_0RCTLogError(@"view %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                view, view.ReactABI30_0_0Tag, ancestor, ancestor.ReactABI30_0_0Tag);
    return;
  }
  CGFloat leftOffset = result.origin.x;
  CGFloat topOffset = result.origin.y;
  CGFloat width = result.size.width;
  CGFloat height = result.size.height;
  if (isnan(leftOffset) || isnan(topOffset) || isnan(width) || isnan(height)) {
    ABI30_0_0RCTLogError(@"Attempted to measure layout but offset or dimensions were NaN");
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
ABI30_0_0RCT_EXPORT_METHOD(measureLayout:(nonnull NSNumber *)ReactABI30_0_0Tag
                  relativeTo:(nonnull NSNumber *)ancestorReactABI30_0_0Tag
                  errorCallback:(__unused ABI30_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI30_0_0RCTResponseSenderBlock)callback)
{
  ABI30_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI30_0_0Tag];
  ABI30_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactABI30_0_0Tag];
  ABI30_0_0RCTMeasureLayout(shadowView, ancestorShadowView, callback);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
ABI30_0_0RCT_EXPORT_METHOD(measureLayoutRelativeToParent:(nonnull NSNumber *)ReactABI30_0_0Tag
                  errorCallback:(__unused ABI30_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI30_0_0RCTResponseSenderBlock)callback)
{
  ABI30_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI30_0_0Tag];
  ABI30_0_0RCTMeasureLayout(shadowView, shadowView.ReactABI30_0_0Superview, callback);
}

/**
 * Returns an array of computed offset layouts in a dictionary form. The layouts are of any ReactABI30_0_0 subviews
 * that are immediate descendants to the parent view found within a specified rect. The dictionary result
 * contains left, top, width, height and an index. The index specifies the position among the other subviews.
 * Only layouts for views that are within the rect passed in are returned. Invokes the error callback if the
 * passed in parent view does not exist. Invokes the supplied callback with the array of computed layouts.
 */
ABI30_0_0RCT_EXPORT_METHOD(measureViewsInRect:(CGRect)rect
                  parentView:(nonnull NSNumber *)ReactABI30_0_0Tag
                  errorCallback:(__unused ABI30_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI30_0_0RCTResponseSenderBlock)callback)
{
  ABI30_0_0RCTShadowView *shadowView = _shadowViewRegistry[ReactABI30_0_0Tag];
  if (!shadowView) {
    ABI30_0_0RCTLogError(@"Attempting to measure view that does not exist (tag #%@)", ReactABI30_0_0Tag);
    return;
  }
  NSArray<ABI30_0_0RCTShadowView *> *childShadowViews = [shadowView ReactABI30_0_0Subviews];
  NSMutableArray<NSDictionary *> *results =
    [[NSMutableArray alloc] initWithCapacity:childShadowViews.count];

  [childShadowViews enumerateObjectsUsingBlock:
   ^(ABI30_0_0RCTShadowView *childShadowView, NSUInteger idx, __unused BOOL *stop) {
    CGRect childLayout = [childShadowView measureLayoutRelativeToAncestor:shadowView];
    if (CGRectIsNull(childLayout)) {
      ABI30_0_0RCTLogError(@"View %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                  childShadowView, childShadowView.ReactABI30_0_0Tag, shadowView, shadowView.ReactABI30_0_0Tag);
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

ABI30_0_0RCT_EXPORT_METHOD(takeSnapshot:(id /* NSString or NSNumber */)target
                  withOptions:(NSDictionary *)options
                  resolve:(ABI30_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI30_0_0RCTPromiseRejectBlock)reject)
{
  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    // Get view
    UIView *view;
    if (target == nil || [target isEqual:@"window"]) {
      view = ABI30_0_0RCTKeyWindow();
    } else if ([target isKindOfClass:[NSNumber class]]) {
      view = viewRegistry[target];
      if (!view) {
        ABI30_0_0RCTLogError(@"No view found with ReactABI30_0_0Tag: %@", target);
        return;
      }
    }

    // Get options
    CGSize size = [ABI30_0_0RCTConvert CGSize:options];
    NSString *format = [ABI30_0_0RCTConvert NSString:options[@"format"] ?: @"png"];

    // Capture image
    if (size.width < 0.1 || size.height < 0.1) {
      size = view.bounds.size;
    }
    UIGraphicsBeginImageContextWithOptions(size, NO, 0);
    BOOL success = [view drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    if (!success || !image) {
      reject(ABI30_0_0RCTErrorUnspecified, @"Failed to capture view snapshot.", nil);
      return;
    }

    // Convert image to data (on a background thread)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

      NSData *data;
      if ([format isEqualToString:@"png"]) {
        data = UIImagePNGRepresentation(image);
      } else if ([format isEqualToString:@"jpeg"]) {
        CGFloat quality = [ABI30_0_0RCTConvert CGFloat:options[@"quality"] ?: @1];
        data = UIImageJPEGRepresentation(image, quality);
      } else {
        ABI30_0_0RCTLogError(@"Unsupported image format: %@", format);
        return;
      }

      // Save to a temp file
      NSError *error = nil;
      NSString *tempFilePath = ABI30_0_0RCTTempFilePath(format, &error);
      if (tempFilePath) {
        if ([data writeToFile:tempFilePath options:(NSDataWritingOptions)0 error:&error]) {
          resolve(tempFilePath);
          return;
        }
      }

      // If we reached here, something went wrong
      reject(ABI30_0_0RCTErrorUnspecified, error.localizedDescription, error);
    });
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
ABI30_0_0RCT_EXPORT_METHOD(setJSResponder:(nonnull NSNumber *)ReactABI30_0_0Tag
                  blockNativeResponder:(__unused BOOL)blockNativeResponder)
{
  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = viewRegistry[ReactABI30_0_0Tag];
    if (!_jsResponder) {
      ABI30_0_0RCTLogError(@"Invalid view set to be the JS responder - tag %@", ReactABI30_0_0Tag);
    }
  }];
}

ABI30_0_0RCT_EXPORT_METHOD(clearJSResponder)
{
  [self addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = nil;
  }];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSMutableDictionary<NSString *, NSDictionary *> *constants = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *directEvents = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *bubblingEvents = [NSMutableDictionary new];

  [_componentDataByName enumerateKeysAndObjectsUsingBlock:^(NSString *name, ABI30_0_0RCTComponentData *componentData, __unused BOOL *stop) {
     NSMutableDictionary<NSString *, id> *moduleConstants = [NSMutableDictionary new];

     // Register which event-types this view dispatches.
     // ReactABI30_0_0 needs this for the event plugin.
     NSMutableDictionary<NSString *, NSDictionary *> *bubblingEventTypes = [NSMutableDictionary new];
     NSMutableDictionary<NSString *, NSDictionary *> *directEventTypes = [NSMutableDictionary new];

     // Add manager class
     moduleConstants[@"Manager"] = ABI30_0_0RCTBridgeModuleNameForClass(componentData.managerClass);

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
       if (ABI30_0_0RCT_DEBUG && bubblingEvents[eventName]) {
         ABI30_0_0RCTLogError(@"Component '%@' re-registered bubbling event '%@' as a "
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
       if (ABI30_0_0RCT_DEBUG && directEvents[eventName]) {
         ABI30_0_0RCTLogError(@"Component '%@' re-registered direct event '%@' as a "
                     "bubbling event", componentData.name, eventName);
       }
     }

     ABI30_0_0RCTAssert(!constants[name], @"UIManager already has constants for %@", componentData.name);
     constants[name] = moduleConstants;
  }];

  return constants;
}

ABI30_0_0RCT_EXPORT_METHOD(configureNextLayoutAnimation:(NSDictionary *)config
                  withCallback:(ABI30_0_0RCTResponseSenderBlock)callback
                  errorCallback:(__unused ABI30_0_0RCTResponseSenderBlock)errorCallback)
{
  ABI30_0_0RCTLayoutAnimationGroup *layoutAnimationGroup =
    [[ABI30_0_0RCTLayoutAnimationGroup alloc] initWithConfig:config
                                           callback:callback];

  [self addUIBlock:^(ABI30_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    [uiManager setNextLayoutAnimationGroup:layoutAnimationGroup];
  }];
}

- (void)rootViewForReactABI30_0_0Tag:(NSNumber *)ReactABI30_0_0Tag withCompletion:(void (^)(UIView *view))completion
{
  ABI30_0_0RCTAssertMainQueue();
  ABI30_0_0RCTAssert(completion != nil, @"Attempted to resolve rootView for tag %@ without a completion block", ReactABI30_0_0Tag);

  if (ReactABI30_0_0Tag == nil) {
    completion(nil);
    return;
  }

  ABI30_0_0RCTExecuteOnUIManagerQueue(^{
    NSNumber *rootTag = [self shadowViewForReactABI30_0_0Tag:ReactABI30_0_0Tag].rootView.ReactABI30_0_0Tag;
    ABI30_0_0RCTExecuteOnMainQueue(^{
      UIView *rootView = nil;
      if (rootTag != nil) {
        rootView = [self viewForReactABI30_0_0Tag:rootTag];
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

@implementation ABI30_0_0RCTBridge (ABI30_0_0RCTUIManager)

- (ABI30_0_0RCTUIManager *)uiManager
{
  return [self moduleForClass:[ABI30_0_0RCTUIManager class]];
}

@end
