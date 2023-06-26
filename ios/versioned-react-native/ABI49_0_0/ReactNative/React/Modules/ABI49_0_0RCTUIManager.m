/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTUIManager.h"

#import <AVFoundation/AVFoundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenterStub.h>

#import "ABI49_0_0RCTAssert.h"
#import "ABI49_0_0RCTBridge+Private.h"
#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTComponent.h"
#import "ABI49_0_0RCTComponentData.h"
#import "ABI49_0_0RCTConvert.h"
#import "ABI49_0_0RCTDefines.h"
#import "ABI49_0_0RCTEventDispatcherProtocol.h"
#import "ABI49_0_0RCTLayoutAnimation.h"
#import "ABI49_0_0RCTLayoutAnimationGroup.h"
#import "ABI49_0_0RCTLog.h"
#import "ABI49_0_0RCTModuleData.h"
#import "ABI49_0_0RCTModuleMethod.h"
#import "ABI49_0_0RCTProfile.h"
#import "ABI49_0_0RCTRootContentView.h"
#import "ABI49_0_0RCTRootShadowView.h"
#import "ABI49_0_0RCTRootViewInternal.h"
#import "ABI49_0_0RCTScrollableProtocol.h"
#import "ABI49_0_0RCTShadowView+Internal.h"
#import "ABI49_0_0RCTShadowView.h"
#import "ABI49_0_0RCTSurfaceRootShadowView.h"
#import "ABI49_0_0RCTSurfaceRootView.h"
#import "ABI49_0_0RCTUIManagerObserverCoordinator.h"
#import "ABI49_0_0RCTUIManagerUtils.h"
#import "ABI49_0_0RCTUtils.h"
#import "ABI49_0_0RCTView.h"
#import "ABI49_0_0RCTViewManager.h"
#import "ABI49_0_0UIView+React.h"

static void ABI49_0_0RCTTraverseViewNodes(id<ABI49_0_0RCTComponent> view, void (^block)(id<ABI49_0_0RCTComponent>))
{
  if (view.ABI49_0_0ReactTag) {
    block(view);

    for (id<ABI49_0_0RCTComponent> subview in view.ABI49_0_0ReactSubviews) {
      ABI49_0_0RCTTraverseViewNodes(subview, block);
    }
  }
}

static NSString *ABI49_0_0RCTNativeIDRegistryKey(NSString *nativeID, NSNumber *rootTag)
{
  if (!nativeID || !rootTag) {
    return @"";
  }
  return [NSString stringWithFormat:@"%@-%@", rootTag, nativeID];
}

NSString *const ABI49_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification =
    @"ABI49_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification";

@implementation ABI49_0_0RCTUIManager {
  // Root views are only mutated on the shadow queue
  NSMutableSet<NSNumber *> *_rootViewTags;
  NSMutableArray<ABI49_0_0RCTViewManagerUIBlock> *_pendingUIBlocks;

  // Animation
  ABI49_0_0RCTLayoutAnimationGroup *_layoutAnimationGroup; // Main thread only

  NSMutableDictionary<NSNumber *, ABI49_0_0RCTShadowView *> *_shadowViewRegistry; // ABI49_0_0RCT thread only
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry; // Main thread only
  NSMapTable<NSString *, UIView *> *_nativeIDRegistry;

  NSMapTable<ABI49_0_0RCTShadowView *, NSArray<NSString *> *> *_shadowViewsWithUpdatedProps; // UIManager queue only.
  NSHashTable<ABI49_0_0RCTShadowView *> *_shadowViewsWithUpdatedChildren; // UIManager queue only.

  // Keyed by viewName
  NSMutableDictionary *_componentDataByName;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;

ABI49_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)invalidate
{
  /**
   * Called on the JS Thread since all modules are invalidated on the JS thread
   */

  // This only accessed from the shadow queue
  _pendingUIBlocks = nil;

  ABI49_0_0RCTExecuteOnMainQueue(^{
    ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"UIManager invalidate", nil);
    for (NSNumber *rootViewTag in self->_rootViewTags) {
      UIView *rootView = self->_viewRegistry[rootViewTag];
      if ([rootView conformsToProtocol:@protocol(ABI49_0_0RCTInvalidating)]) {
        [(id<ABI49_0_0RCTInvalidating>)rootView invalidate];
      }
    }

    self->_rootViewTags = nil;
    self->_shadowViewRegistry = nil;
    self->_viewRegistry = nil;
    self->_nativeIDRegistry = nil;
    self->_bridge = nil;

    [[NSNotificationCenter defaultCenter] removeObserver:self];
    ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");
  });
}

- (NSMutableDictionary<NSNumber *, ABI49_0_0RCTShadowView *> *)shadowViewRegistry
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

- (NSMapTable *)nativeIDRegistry
{
  if (!_nativeIDRegistry) {
    _nativeIDRegistry = [NSMapTable strongToWeakObjectsMapTable];
  }
  return _nativeIDRegistry;
}

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge
{
  ABI49_0_0RCTEnforceNewArchitectureValidation(
      ABI49_0_0RCTNotAllowedInBridgeless, self, @"ABI49_0_0RCTUIManager must not be initialized for the new architecture");

  ABI49_0_0RCTAssert(_bridge == nil, @"Should not re-use same UIManager instance");
  _bridge = bridge;

  _shadowViewRegistry = [NSMutableDictionary new];
  _viewRegistry = [NSMutableDictionary new];
  _nativeIDRegistry = [NSMapTable strongToWeakObjectsMapTable];

  _shadowViewsWithUpdatedProps = [NSMapTable weakToStrongObjectsMapTable];
  _shadowViewsWithUpdatedChildren = [NSHashTable weakObjectsHashTable];

  // Internal resources
  _pendingUIBlocks = [NSMutableArray new];
  _rootViewTags = [NSMutableSet new];

  _observerCoordinator = [ABI49_0_0RCTUIManagerObserverCoordinator new];

  // Get view managers from bridge=
  _componentDataByName = [NSMutableDictionary new];
  for (Class moduleClass in _bridge.moduleClasses) {
    if ([moduleClass isSubclassOfClass:[ABI49_0_0RCTViewManager class]]) {
      ABI49_0_0RCTComponentData *componentData = [[ABI49_0_0RCTComponentData alloc] initWithManagerClass:moduleClass
                                                                                bridge:_bridge
                                                                       eventDispatcher:_bridge.eventDispatcher];
      _componentDataByName[componentData.name] = componentData;
    }
  }

  // This dispatch_async avoids a deadlock while configuring native modules
  dispatch_async(dispatch_get_main_queue(), ^{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveNewContentSizeMultiplier)
                                                 name:@"ABI49_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification"
                                               object:[self->_bridge moduleForName:@"AccessibilityManager"
                                                             lazilyLoadIfNecessary:YES]];
  });
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(namedOrientationDidChange)
                                               name:UIDeviceOrientationDidChangeNotification
                                             object:nil];
  [ABI49_0_0RCTLayoutAnimation initializeStatics];
}

#pragma mark - Event emitting

- (void)didReceiveNewContentSizeMultiplier
{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  id multiplier = [[self->_bridge moduleForName:@"AccessibilityManager"
                          lazilyLoadIfNecessary:YES] valueForKey:@"multiplier"];
  if (multiplier) {
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateContentSizeMultiplier"
                                                                          body:multiplier];
  }
#pragma clang diagnostic pop

  ABI49_0_0RCTExecuteOnUIManagerQueue(^{
    [[NSNotificationCenter defaultCenter]
        postNotificationName:ABI49_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
                      object:self];
    [self setNeedsLayout];
  });
}

// Names and coordinate system from html5 spec:
// https://developer.mozilla.org/en-US/docs/Web/API/Screen.orientation
// https://developer.mozilla.org/en-US/docs/Web/API/Screen.lockOrientation
static NSDictionary *deviceOrientationEventBody(UIDeviceOrientation orientation)
{
  NSString *name;
  NSNumber *degrees = @0;
  BOOL isLandscape = NO;
  switch (orientation) {
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
    @"name" : name,
    @"rotationDegrees" : degrees,
    @"isLandscape" : @(isLandscape),
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
  [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"namedOrientationDidChange"
                                                                        body:orientationEvent];
#pragma clang diagnostic pop
}

- (dispatch_queue_t)methodQueue
{
  return ABI49_0_0RCTGetUIManagerQueue();
}

- (void)registerRootViewTag:(NSNumber *)rootTag
{
  ABI49_0_0RCTAssertUIManagerQueue();

  ABI49_0_0RCTAssert(ABI49_0_0RCTIsABI49_0_0ReactRootView(rootTag), @"Attempt to register rootTag (%@) which is not actually root tag.", rootTag);

  ABI49_0_0RCTAssert(
      ![_rootViewTags containsObject:rootTag],
      @"Attempt to register rootTag (%@) which was already registered.",
      rootTag);

  [_rootViewTags addObject:rootTag];

  // Registering root shadow view
  ABI49_0_0RCTSurfaceRootShadowView *shadowView = [ABI49_0_0RCTSurfaceRootShadowView new];
  shadowView.ABI49_0_0ReactTag = rootTag;
  _shadowViewRegistry[rootTag] = shadowView;

  // Registering root view
  ABI49_0_0RCTExecuteOnMainQueue(^{
    ABI49_0_0RCTSurfaceRootView *rootView = [ABI49_0_0RCTSurfaceRootView new];
    rootView.ABI49_0_0ReactTag = rootTag;
    self->_viewRegistry[rootTag] = rootView;
  });
}

- (void)registerRootView:(ABI49_0_0RCTRootContentView *)rootView
{
  ABI49_0_0RCTAssertMainQueue();

  NSNumber *ABI49_0_0ReactTag = rootView.ABI49_0_0ReactTag;
  ABI49_0_0RCTAssert(ABI49_0_0RCTIsABI49_0_0ReactRootView(ABI49_0_0ReactTag), @"View %@ with tag #%@ is not a root view", rootView, ABI49_0_0ReactTag);

  UIView *existingView = _viewRegistry[ABI49_0_0ReactTag];
  ABI49_0_0RCTAssert(
      existingView == nil || existingView == rootView,
      @"Expect all root views to have unique tag. Added %@ twice",
      ABI49_0_0ReactTag);

  CGSize availableSize = rootView.availableSize;

  // Register view
  _viewRegistry[ABI49_0_0ReactTag] = rootView;

  // Register shadow view
  ABI49_0_0RCTExecuteOnUIManagerQueue(^{
    if (!self->_viewRegistry) {
      return;
    }

    ABI49_0_0RCTRootShadowView *shadowView = [ABI49_0_0RCTRootShadowView new];
    shadowView.availableSize = availableSize;
    shadowView.ABI49_0_0ReactTag = ABI49_0_0ReactTag;
    shadowView.viewName = NSStringFromClass([rootView class]);
    self->_shadowViewRegistry[shadowView.ABI49_0_0ReactTag] = shadowView;
    [self->_rootViewTags addObject:ABI49_0_0ReactTag];
  });
}

- (NSString *)viewNameForABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag
{
  ABI49_0_0RCTAssertUIManagerQueue();
  NSString *name = _shadowViewRegistry[ABI49_0_0ReactTag].viewName;
  if (name) {
    return name;
  }

  __block UIView *view;
  ABI49_0_0RCTUnsafeExecuteOnMainQueueSync(^{
    view = self->_viewRegistry[ABI49_0_0ReactTag];
  });

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"

  if ([view respondsToSelector:@selector(componentViewName_DO_NOT_USE_THIS_IS_BROKEN)]) {
    return [view performSelector:@selector(componentViewName_DO_NOT_USE_THIS_IS_BROKEN)];
  }

#pragma clang diagnostic pop
  return nil;
}

- (UIView *)viewForABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag
{
  ABI49_0_0RCTAssertMainQueue();
  UIView *view = [_bridge.surfacePresenter findComponentViewWithTag_DO_NOT_USE_DEPRECATED:ABI49_0_0ReactTag.integerValue];
  if (!view) {
    view = _viewRegistry[ABI49_0_0ReactTag];
  }
  return view;
}

- (ABI49_0_0RCTShadowView *)shadowViewForABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag
{
  ABI49_0_0RCTAssertUIManagerQueue();
  return _shadowViewRegistry[ABI49_0_0ReactTag];
}

- (void)_executeBlockWithShadowView:(void (^)(ABI49_0_0RCTShadowView *shadowView))block forTag:(NSNumber *)tag
{
  ABI49_0_0RCTAssertMainQueue();

  ABI49_0_0RCTExecuteOnUIManagerQueue(^{
    ABI49_0_0RCTShadowView *shadowView = self->_shadowViewRegistry[tag];

    if (shadowView == nil) {
      ABI49_0_0RCTLogInfo(
          @"Could not locate shadow view with tag #%@, this is probably caused by a temporary inconsistency between native views and shadow views.",
          tag);
      return;
    }

    block(shadowView);
  });
}

- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView
{
  ABI49_0_0RCTAssertMainQueue();
  [self
      _executeBlockWithShadowView:^(ABI49_0_0RCTShadowView *shadowView) {
        ABI49_0_0RCTAssert(
            [shadowView isKindOfClass:[ABI49_0_0RCTRootShadowView class]], @"Located shadow view is actually not root view.");

        ABI49_0_0RCTRootShadowView *rootShadowView = (ABI49_0_0RCTRootShadowView *)shadowView;

        if (CGSizeEqualToSize(availableSize, rootShadowView.availableSize)) {
          return;
        }

        rootShadowView.availableSize = availableSize;
        [self setNeedsLayout];
      }
                           forTag:rootView.ABI49_0_0ReactTag];
}

- (void)setLocalData:(NSObject *)localData forView:(UIView *)view
{
  ABI49_0_0RCTAssertMainQueue();
  [self
      _executeBlockWithShadowView:^(ABI49_0_0RCTShadowView *shadowView) {
        shadowView.localData = localData;
        [self setNeedsLayout];
      }
                           forTag:view.ABI49_0_0ReactTag];
}

- (UIView *)viewForNativeID:(NSString *)nativeID withRootTag:(NSNumber *)rootTag
{
  if (!nativeID || !rootTag) {
    return nil;
  }
  UIView *view;
  @synchronized(self) {
    view = [_nativeIDRegistry objectForKey:ABI49_0_0RCTNativeIDRegistryKey(nativeID, rootTag)];
  }
  return view;
}

- (void)setNativeID:(NSString *)nativeID forView:(UIView *)view
{
  if (!nativeID || !view) {
    return;
  }
  __weak ABI49_0_0RCTUIManager *weakSelf = self;
  ABI49_0_0RCTExecuteOnUIManagerQueue(^{
    NSNumber *rootTag = [weakSelf shadowViewForABI49_0_0ReactTag:view.ABI49_0_0ReactTag].rootView.ABI49_0_0ReactTag;
    @synchronized(weakSelf) {
      [weakSelf.nativeIDRegistry setObject:view forKey:ABI49_0_0RCTNativeIDRegistryKey(nativeID, rootTag)];
    }
  });
}

- (void)setSize:(CGSize)size forView:(UIView *)view
{
  ABI49_0_0RCTAssertMainQueue();
  [self
      _executeBlockWithShadowView:^(ABI49_0_0RCTShadowView *shadowView) {
        if (CGSizeEqualToSize(size, shadowView.size)) {
          return;
        }

        shadowView.size = size;
        [self setNeedsLayout];
      }
                           forTag:view.ABI49_0_0ReactTag];
}

- (void)setIntrinsicContentSize:(CGSize)intrinsicContentSize forView:(UIView *)view
{
  ABI49_0_0RCTAssertMainQueue();
  [self
      _executeBlockWithShadowView:^(ABI49_0_0RCTShadowView *shadowView) {
        if (CGSizeEqualToSize(shadowView.intrinsicContentSize, intrinsicContentSize)) {
          return;
        }

        shadowView.intrinsicContentSize = intrinsicContentSize;
        [self setNeedsLayout];
      }
                           forTag:view.ABI49_0_0ReactTag];
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray<id<ABI49_0_0RCTComponent>> *)children
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)registry
{
  for (id<ABI49_0_0RCTComponent> child in children) {
    ABI49_0_0RCTTraverseViewNodes(registry[child.ABI49_0_0ReactTag], ^(id<ABI49_0_0RCTComponent> subview) {
      ABI49_0_0RCTAssert(![subview isABI49_0_0ReactRootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(ABI49_0_0RCTInvalidating)]) {
        [(id<ABI49_0_0RCTInvalidating>)subview invalidate];
      }
      [registry removeObjectForKey:subview.ABI49_0_0ReactTag];
    });
  }
}

- (void)addUIBlock:(ABI49_0_0RCTViewManagerUIBlock)block
{
  ABI49_0_0RCTAssertUIManagerQueue();

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks addObject:block];
}

- (void)prependUIBlock:(ABI49_0_0RCTViewManagerUIBlock)block
{
  ABI49_0_0RCTAssertUIManagerQueue();

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks insertObject:block atIndex:0];
}

- (void)setNextLayoutAnimationGroup:(ABI49_0_0RCTLayoutAnimationGroup *)layoutAnimationGroup
{
  ABI49_0_0RCTAssertMainQueue();

  if (_layoutAnimationGroup && ![_layoutAnimationGroup isEqual:layoutAnimationGroup]) {
    ABI49_0_0RCTLogWarn(
        @"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.",
        [_layoutAnimationGroup description],
        [layoutAnimationGroup description]);
  }

  _layoutAnimationGroup = layoutAnimationGroup;
}

- (ABI49_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI49_0_0RCTRootShadowView *)rootShadowView
{
  ABI49_0_0RCTAssertUIManagerQueue();

  NSHashTable<ABI49_0_0RCTShadowView *> *affectedShadowViews = [NSHashTable weakObjectsHashTable];
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
    ABI49_0_0RCTDisplayType displayType;
  } ABI49_0_0RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = affectedShadowViews.count;
  NSMutableArray *ABI49_0_0ReactTags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(ABI49_0_0RCTFrameData) * count];
  {
    NSUInteger index = 0;
    ABI49_0_0RCTFrameData *frameDataArray = (ABI49_0_0RCTFrameData *)framesData.mutableBytes;
    for (ABI49_0_0RCTShadowView *shadowView in affectedShadowViews) {
      ABI49_0_0ReactTags[index] = shadowView.ABI49_0_0ReactTag;
      ABI49_0_0RCTLayoutMetrics layoutMetrics = shadowView.layoutMetrics;
      frameDataArray[index++] = (ABI49_0_0RCTFrameData){
          layoutMetrics.frame,
          layoutMetrics.layoutDirection,
          shadowView.isNewView,
          shadowView.superview.isNewView,
          layoutMetrics.displayType};
    }
  }

  for (ABI49_0_0RCTShadowView *shadowView in affectedShadowViews) {
    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *ABI49_0_0ReactTag = shadowView.ABI49_0_0ReactTag;

    if (shadowView.onLayout) {
      CGRect frame = shadowView.layoutMetrics.frame;
      shadowView.onLayout(@{
        @"layout" : @{
          @"x" : @(frame.origin.x),
          @"y" : @(frame.origin.y),
          @"width" : @(frame.size.width),
          @"height" : @(frame.size.height),
        },
      });
    }

    if (ABI49_0_0RCTIsABI49_0_0ReactRootView(ABI49_0_0ReactTag) && [shadowView isKindOfClass:[ABI49_0_0RCTRootShadowView class]]) {
      CGSize contentSize = shadowView.layoutMetrics.frame.size;

      ABI49_0_0RCTExecuteOnMainQueue(^{
        UIView *view = self->_viewRegistry[ABI49_0_0ReactTag];
        ABI49_0_0RCTAssert(view != nil, @"view (for ID %@) not found", ABI49_0_0ReactTag);

        ABI49_0_0RCTRootView *rootView = (ABI49_0_0RCTRootView *)[view superview];
        if ([rootView isKindOfClass:[ABI49_0_0RCTRootView class]]) {
          rootView.intrinsicContentSize = contentSize;
        }
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    const ABI49_0_0RCTFrameData *frameDataArray = (const ABI49_0_0RCTFrameData *)framesData.bytes;
    ABI49_0_0RCTLayoutAnimationGroup *layoutAnimationGroup = uiManager->_layoutAnimationGroup;

    __block NSUInteger completionsCalled = 0;

    NSInteger index = 0;
    for (NSNumber *ABI49_0_0ReactTag in ABI49_0_0ReactTags) {
      ABI49_0_0RCTFrameData frameData = frameDataArray[index++];

      UIView *view = viewRegistry[ABI49_0_0ReactTag];
      CGRect frame = frameData.frame;

      UIUserInterfaceLayoutDirection layoutDirection = frameData.layoutDirection;
      BOOL isNew = frameData.isNew;
      ABI49_0_0RCTLayoutAnimation *updatingLayoutAnimation = isNew ? nil : layoutAnimationGroup.updatingLayoutAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      ABI49_0_0RCTLayoutAnimation *creatingLayoutAnimation =
          shouldAnimateCreation ? layoutAnimationGroup.creatingLayoutAnimation : nil;
      BOOL isHidden = frameData.displayType == ABI49_0_0RCTDisplayTypeNone;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (layoutAnimationGroup.callback && completionsCalled == count) {
          layoutAnimationGroup.callback(@[ @(finished) ]);

          // It's unsafe to call this callback more than once, so we nil it out here
          // to make sure that doesn't happen.
          layoutAnimationGroup.callback = nil;
        }
      };

      if (view.ABI49_0_0ReactLayoutDirection != layoutDirection) {
        view.ABI49_0_0ReactLayoutDirection = layoutDirection;
      }

      if (view.isHidden != isHidden) {
        view.hidden = isHidden;
      }

      if (creatingLayoutAnimation) {
        // Animate view creation
        [view ABI49_0_0ReactSetFrame:frame];

        CATransform3D finalTransform = view.layer.transform;
        CGFloat finalOpacity = view.layer.opacity;

        NSString *property = creatingLayoutAnimation.property;
        if ([property isEqualToString:@"scaleXY"]) {
          view.layer.transform = CATransform3DMakeScale(0, 0, 0);
        } else if ([property isEqualToString:@"scaleX"]) {
          view.layer.transform = CATransform3DMakeScale(0, 1, 0);
        } else if ([property isEqualToString:@"scaleY"]) {
          view.layer.transform = CATransform3DMakeScale(1, 0, 0);
        } else if ([property isEqualToString:@"opacity"]) {
          view.layer.opacity = 0.0;
        } else {
          ABI49_0_0RCTLogError(@"Unsupported layout animation createConfig property %@", creatingLayoutAnimation.property);
        }

        [creatingLayoutAnimation
              performAnimations:^{
                if ([property isEqualToString:@"scaleX"] || [property isEqualToString:@"scaleY"] ||
                    [property isEqualToString:@"scaleXY"]) {
                  view.layer.transform = finalTransform;
                } else if ([property isEqualToString:@"opacity"]) {
                  view.layer.opacity = finalOpacity;
                }
              }
            withCompletionBlock:completion];

      } else if (updatingLayoutAnimation) {
        // Animate view update
        [updatingLayoutAnimation
              performAnimations:^{
                [view ABI49_0_0ReactSetFrame:frame];
              }
            withCompletionBlock:completion];

      } else {
        // Update without animation
        [view ABI49_0_0ReactSetFrame:frame];
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
ABI49_0_0RCT_EXPORT_METHOD(removeSubviewsFromContainerWithID : (nonnull NSNumber *)containerID)
{
  ABI49_0_0RCTLogWarn(
      @"ABI49_0_0RCTUIManager.removeSubviewsFromContainerWithID method is deprecated and it will not be implemented in newer versions of ABI49_0_0RN (Fabric) - T47686450");
  id<ABI49_0_0RCTComponent> container = _shadowViewRegistry[containerID];
  ABI49_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", containerID);

  NSUInteger subviewsCount = [container ABI49_0_0ReactSubviews].count;
  NSMutableArray<NSNumber *> *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
  for (NSUInteger childIndex = 0; childIndex < subviewsCount; childIndex++) {
    [indices addObject:@(childIndex)];
  }

  [self manageChildren:containerID
        moveFromIndices:nil
          moveToIndices:nil
      addChildABI49_0_0ReactTags:nil
           addAtIndices:nil
        removeAtIndices:indices];
}

/**
 * Disassociates children from container. Doesn't remove from registries.
 * TODO: use [NSArray getObjects:buffer] to reuse same fast buffer each time.
 *
 * @returns Array of removed items.
 */
- (NSArray<id<ABI49_0_0RCTComponent>> *)_childrenToRemoveFromContainer:(id<ABI49_0_0RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if (atIndices.count == 0 || [container ABI49_0_0ReactSubviews].count == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray<id<ABI49_0_0RCTComponent>> *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  ABI49_0_0RCTAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSNumber *indexNumber in atIndices) {
    NSUInteger index = indexNumber.unsignedIntegerValue;
    if (index < [container ABI49_0_0ReactSubviews].count) {
      [removedChildren addObject:[container ABI49_0_0ReactSubviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    NSString *message = [NSString stringWithFormat:@"removedChildren count (%tu) was not what we expected (%tu)",
                                                   removedChildren.count,
                                                   atIndices.count];
    ABI49_0_0RCTFatal(ABI49_0_0RCTErrorWithMessage(message));
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray<id<ABI49_0_0RCTComponent>> *)children fromContainer:(id<ABI49_0_0RCTComponent>)container
{
  for (id<ABI49_0_0RCTComponent> removedChild in children) {
    [container removeABI49_0_0ReactSubview:removedChild];
  }
}

/**
 * Remove subviews from their parent with an animation.
 */
- (void)_removeChildren:(NSArray<UIView *> *)children
          fromContainer:(UIView *)container
          withAnimation:(ABI49_0_0RCTLayoutAnimationGroup *)animation
{
  ABI49_0_0RCTAssertMainQueue();
  ABI49_0_0RCTLayoutAnimation *deletingLayoutAnimation = animation.deletingLayoutAnimation;

  __block NSUInteger completionsCalled = 0;
  for (UIView *removedChild in children) {
    void (^completion)(BOOL) = ^(BOOL finished) {
      completionsCalled++;

      [removedChild removeFromSuperview];

      if (animation.callback && completionsCalled == children.count) {
        animation.callback(@[ @(finished) ]);

        // It's unsafe to call this callback more than once, so we nil it out here
        // to make sure that doesn't happen.
        animation.callback = nil;
      }
    };

    // Hack: At this moment we have two contradict intents.
    // First one: We want to delete the view from view hierarchy.
    // Second one: We want to animate this view, which implies the existence of this view in the hierarchy.
    // So, we have to remove this view from ABI49_0_0React's view hierarchy but postpone removing from UIKit's hierarchy.
    // Here the problem: the default implementation of `-[UIView removeABI49_0_0ReactSubview:]` also removes the view from
    // UIKit's hierarchy. So, let's temporary restore the view back after removing. To do so, we have to memorize
    // original `superview` (which can differ from `container`) and an index of removed view.
    UIView *originalSuperview = removedChild.superview;
    NSUInteger originalIndex = [originalSuperview.subviews indexOfObjectIdenticalTo:removedChild];
    [container removeABI49_0_0ReactSubview:removedChild];
    // Disable user interaction while the view is animating
    // since the view is (conceptually) deleted and not supposed to be interactive.
    removedChild.userInteractionEnabled = NO;
    [originalSuperview insertSubview:removedChild atIndex:originalIndex];

    NSString *property = deletingLayoutAnimation.property;
    [deletingLayoutAnimation
          performAnimations:^{
            if ([property isEqualToString:@"scaleXY"]) {
              removedChild.layer.transform = CATransform3DMakeScale(0.001, 0.001, 0.001);
            } else if ([property isEqualToString:@"scaleX"]) {
              removedChild.layer.transform = CATransform3DMakeScale(0.001, 1, 0.001);
            } else if ([property isEqualToString:@"scaleY"]) {
              removedChild.layer.transform = CATransform3DMakeScale(1, 0.001, 0.001);
            } else if ([property isEqualToString:@"opacity"]) {
              removedChild.layer.opacity = 0.0;
            } else {
              ABI49_0_0RCTLogError(@"Unsupported layout animation createConfig property %@", deletingLayoutAnimation.property);
            }
          }
        withCompletionBlock:completion];
  }
}

ABI49_0_0RCT_EXPORT_METHOD(removeRootView : (nonnull NSNumber *)rootABI49_0_0ReactTag)
{
  ABI49_0_0RCTShadowView *rootShadowView = _shadowViewRegistry[rootABI49_0_0ReactTag];
  ABI49_0_0RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootABI49_0_0ReactTag);
  [self _purgeChildren:(NSArray<id<ABI49_0_0RCTComponent>> *)rootShadowView.ABI49_0_0ReactSubviews
          fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)_shadowViewRegistry];
  [_shadowViewRegistry removeObjectForKey:rootABI49_0_0ReactTag];
  [_rootViewTags removeObject:rootABI49_0_0ReactTag];

  [self addUIBlock:^(ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI49_0_0RCTAssertMainQueue();
    UIView *rootView = viewRegistry[rootABI49_0_0ReactTag];
    [uiManager _purgeChildren:(NSArray<id<ABI49_0_0RCTComponent>> *)rootView.ABI49_0_0ReactSubviews
                 fromRegistry:(NSMutableDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)viewRegistry];
    [(NSMutableDictionary *)viewRegistry removeObjectForKey:rootABI49_0_0ReactTag];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(replaceExistingNonRootView : (nonnull NSNumber *)ABI49_0_0ReactTag withView : (nonnull NSNumber *)newABI49_0_0ReactTag)
{
  ABI49_0_0RCTLogWarn(
      @"ABI49_0_0RCTUIManager.replaceExistingNonRootView method is deprecated and it will not be implemented in newer versions of ABI49_0_0RN (Fabric) - T47686450");
  ABI49_0_0RCTShadowView *shadowView = _shadowViewRegistry[ABI49_0_0ReactTag];
  ABI49_0_0RCTAssert(shadowView != nil, @"shadowView (for ID %@) not found", ABI49_0_0ReactTag);

  ABI49_0_0RCTShadowView *superShadowView = shadowView.superview;
  if (!superShadowView) {
    ABI49_0_0RCTAssert(NO, @"shadowView super (of ID %@) not found", ABI49_0_0ReactTag);
    return;
  }

  NSUInteger indexOfView = [superShadowView.ABI49_0_0ReactSubviews indexOfObjectIdenticalTo:shadowView];
  ABI49_0_0RCTAssert(indexOfView != NSNotFound, @"View's superview doesn't claim it as subview (id %@)", ABI49_0_0ReactTag);
  NSArray<NSNumber *> *removeAtIndices = @[ @(indexOfView) ];
  NSArray<NSNumber *> *addTags = @[ newABI49_0_0ReactTag ];
  [self manageChildren:superShadowView.ABI49_0_0ReactTag
        moveFromIndices:nil
          moveToIndices:nil
      addChildABI49_0_0ReactTags:addTags
           addAtIndices:removeAtIndices
        removeAtIndices:removeAtIndices];
}

ABI49_0_0RCT_EXPORT_METHOD(setChildren : (nonnull NSNumber *)containerTag ABI49_0_0ReactTags : (NSArray<NSNumber *> *)ABI49_0_0ReactTags)
{
  ABI49_0_0RCTSetChildren(containerTag, ABI49_0_0ReactTags, (NSDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)_shadowViewRegistry);

  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI49_0_0RCTSetChildren(containerTag, ABI49_0_0ReactTags, (NSDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)viewRegistry);
  }];

  [self _shadowViewDidReceiveUpdatedChildren:_shadowViewRegistry[containerTag]];
}

static void ABI49_0_0RCTSetChildren(
    NSNumber *containerTag,
    NSArray<NSNumber *> *ABI49_0_0ReactTags,
    NSDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *registry)
{
  id<ABI49_0_0RCTComponent> container = registry[containerTag];
  NSInteger index = 0;
  for (NSNumber *ABI49_0_0ReactTag in ABI49_0_0ReactTags) {
    id<ABI49_0_0RCTComponent> view = registry[ABI49_0_0ReactTag];
    if (view) {
      [container insertABI49_0_0ReactSubview:view atIndex:index++];
    }
  }
}

ABI49_0_0RCT_EXPORT_METHOD(manageChildren
                  : (nonnull NSNumber *)containerTag moveFromIndices
                  : (NSArray<NSNumber *> *)moveFromIndices moveToIndices
                  : (NSArray<NSNumber *> *)moveToIndices addChildABI49_0_0ReactTags
                  : (NSArray<NSNumber *> *)addChildABI49_0_0ReactTags addAtIndices
                  : (NSArray<NSNumber *> *)addAtIndices removeAtIndices
                  : (NSArray<NSNumber *> *)removeAtIndices)
{
  [self _manageChildren:containerTag
        moveFromIndices:moveFromIndices
          moveToIndices:moveToIndices
      addChildABI49_0_0ReactTags:addChildABI49_0_0ReactTags
           addAtIndices:addAtIndices
        removeAtIndices:removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)_shadowViewRegistry];

  [self addUIBlock:^(ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    [uiManager _manageChildren:containerTag
               moveFromIndices:moveFromIndices
                 moveToIndices:moveToIndices
             addChildABI49_0_0ReactTags:addChildABI49_0_0ReactTags
                  addAtIndices:addAtIndices
               removeAtIndices:removeAtIndices
                      registry:(NSMutableDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)viewRegistry];
  }];

  [self _shadowViewDidReceiveUpdatedChildren:_shadowViewRegistry[containerTag]];
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildABI49_0_0ReactTags:(NSArray<NSNumber *> *)addChildABI49_0_0ReactTags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)registry
{
  id<ABI49_0_0RCTComponent> container = registry[containerTag];
  ABI49_0_0RCTAssert(
      moveFromIndices.count == moveToIndices.count,
      @"moveFromIndices had size %tu, moveToIndices had size %tu",
      moveFromIndices.count,
      moveToIndices.count);
  ABI49_0_0RCTAssert(addChildABI49_0_0ReactTags.count == addAtIndices.count, @"there should be at least one ABI49_0_0React child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray<id<ABI49_0_0RCTComponent>> *permanentlyRemovedChildren = [self _childrenToRemoveFromContainer:container
                                                                                     atIndices:removeAtIndices];
  NSArray<id<ABI49_0_0RCTComponent>> *temporarilyRemovedChildren = [self _childrenToRemoveFromContainer:container
                                                                                     atIndices:moveFromIndices];

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
    id<ABI49_0_0RCTComponent> view = registry[addChildABI49_0_0ReactTags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray<NSNumber *> *sortedIndices =
      [destinationsToChildrenToAdd.allKeys sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *ABI49_0_0ReactIndex in sortedIndices) {
    [container insertABI49_0_0ReactSubview:destinationsToChildrenToAdd[ABI49_0_0ReactIndex] atIndex:ABI49_0_0ReactIndex.integerValue];
  }
}

ABI49_0_0RCT_EXPORT_METHOD(createView
                  : (nonnull NSNumber *)ABI49_0_0ReactTag viewName
                  : (NSString *)viewName rootTag
                  : (nonnull NSNumber *)rootTag props
                  : (NSDictionary *)props)
{
  ABI49_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  if (componentData == nil) {
    ABI49_0_0RCTLogError(@"No component found for view with name \"%@\"", viewName);
  }

  // Register shadow view
  ABI49_0_0RCTShadowView *shadowView = [componentData createShadowViewWithTag:ABI49_0_0ReactTag];
  if (shadowView) {
    [componentData setProps:props forShadowView:shadowView];
    _shadowViewRegistry[ABI49_0_0ReactTag] = shadowView;
    ABI49_0_0RCTShadowView *rootView = _shadowViewRegistry[rootTag];
    ABI49_0_0RCTAssert(
        [rootView isKindOfClass:[ABI49_0_0RCTRootShadowView class]] || [rootView isKindOfClass:[ABI49_0_0RCTSurfaceRootShadowView class]],
        @"Given `rootTag` (%@) does not correspond to a valid root shadow view instance.",
        rootTag);
    shadowView.rootView = (ABI49_0_0RCTRootShadowView *)rootView;
  }

  // Dispatch view creation directly to the main thread instead of adding to
  // UIBlocks array. This way, it doesn't get deferred until after layout.
  __block UIView *preliminaryCreatedView = nil;

  void (^createViewBlock)(void) = ^{
    // Do nothing on the second run.
    if (preliminaryCreatedView) {
      return;
    }

    preliminaryCreatedView = [componentData createViewWithTag:ABI49_0_0ReactTag rootTag:rootTag];

    if (preliminaryCreatedView) {
      self->_viewRegistry[ABI49_0_0ReactTag] = preliminaryCreatedView;
    }
  };

  // We cannot guarantee that asynchronously scheduled block will be executed
  // *before* a block is added to the regular mounting process (simply because
  // mounting process can be managed externally while the main queue is
  // locked).
  // So, we positively dispatch it asynchronously and double check inside
  // the regular mounting block.

  ABI49_0_0RCTExecuteOnMainQueue(createViewBlock);

  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    createViewBlock();

    if (preliminaryCreatedView) {
      [componentData setProps:props forView:preliminaryCreatedView];
    }
  }];

  [self _shadowView:shadowView didReceiveUpdatedProps:[props allKeys]];
}

ABI49_0_0RCT_EXPORT_METHOD(updateView
                  : (nonnull NSNumber *)ABI49_0_0ReactTag viewName
                  : (NSString *)viewName // not always reliable, use shadowView.viewName if available
                      props
                  : (NSDictionary *)props)
{
  ABI49_0_0RCTShadowView *shadowView = _shadowViewRegistry[ABI49_0_0ReactTag];
  ABI49_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName ?: viewName];
  [componentData setProps:props forShadowView:shadowView];

  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ABI49_0_0ReactTag];
    [componentData setProps:props forView:view];
  }];

  [self _shadowView:shadowView didReceiveUpdatedProps:[props allKeys]];
}

- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI49_0_0ReactTag viewName:(NSString *)viewName props:(NSDictionary *)props
{
  ABI49_0_0RCTAssertMainQueue();
  ABI49_0_0RCTComponentData *componentData = _componentDataByName[viewName];
  UIView *view = _viewRegistry[ABI49_0_0ReactTag];
  [componentData setProps:props forView:view];
}

ABI49_0_0RCT_EXPORT_METHOD(focus : (nonnull NSNumber *)ABI49_0_0ReactTag)
{
  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *newResponder = viewRegistry[ABI49_0_0ReactTag];
    [newResponder ABI49_0_0ReactFocus];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(blur : (nonnull NSNumber *)ABI49_0_0ReactTag)
{
  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *currentResponder = viewRegistry[ABI49_0_0ReactTag];
    [currentResponder ABI49_0_0ReactBlur];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(findSubviewIn
                  : (nonnull NSNumber *)ABI49_0_0ReactTag atPoint
                  : (CGPoint)point callback
                  : (ABI49_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ABI49_0_0ReactTag];
    UIView *target = [view hitTest:point withEvent:nil];
    CGRect frame = [target convertRect:target.bounds toView:view];

    while (target.ABI49_0_0ReactTag == nil && target.superview != nil) {
      target = target.superview;
    }

    callback(@[
      ABI49_0_0RCTNullIfNil(target.ABI49_0_0ReactTag),
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
    ]);
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(dispatchViewManagerCommand
                  : (nonnull NSNumber *)ABI49_0_0ReactTag commandID
                  : (id /*(NSString or NSNumber) */)commandID commandArgs
                  : (NSArray<id> *)commandArgs)
{
  ABI49_0_0RCTShadowView *shadowView = _shadowViewRegistry[ABI49_0_0ReactTag];
  ABI49_0_0RCTComponentData *componentData = _componentDataByName[shadowView.viewName];

  // Achtung! Achtung!
  // This is a remarkably hacky and ugly workaround.
  // We need this only temporary for some testing. We need this hack until Fabric fully implements command-execution
  // pipeline. This does not affect non-Fabric apps.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  if (!componentData) {
    __block UIView *view;
    ABI49_0_0RCTUnsafeExecuteOnMainQueueSync(^{
      view = self->_viewRegistry[ABI49_0_0ReactTag];
    });
    if ([view respondsToSelector:@selector(componentViewName_DO_NOT_USE_THIS_IS_BROKEN)]) {
      NSString *name = [view performSelector:@selector(componentViewName_DO_NOT_USE_THIS_IS_BROKEN)];
      componentData = _componentDataByName[[NSString stringWithFormat:@"ABI49_0_0RCT%@", name]];
    }
  }
#pragma clang diagnostic pop

  Class managerClass = componentData.managerClass;
  ABI49_0_0RCTModuleData *moduleData = [_bridge moduleDataForName:ABI49_0_0RCTBridgeModuleNameForClass(managerClass)];

  id<ABI49_0_0RCTBridgeMethod> method;
  if ([commandID isKindOfClass:[NSNumber class]]) {
    method = moduleData.methods[[commandID intValue]];
  } else if ([commandID isKindOfClass:[NSString class]]) {
    method = moduleData.methodsByName[commandID];
    if (method == nil) {
      ABI49_0_0RCTLogError(@"No command found with name \"%@\"", commandID);
    }
  } else {
    ABI49_0_0RCTLogError(@"dispatchViewManagerCommand must be called with a string or integer command");
    return;
  }

  NSArray *args = [@[ ABI49_0_0ReactTag ] arrayByAddingObjectsFromArray:commandArgs];
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
  for (NSNumber *ABI49_0_0ReactTag in _rootViewTags) {
    ABI49_0_0RCTRootShadowView *rootView = (ABI49_0_0RCTRootShadowView *)_shadowViewRegistry[ABI49_0_0ReactTag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
  }

  [_observerCoordinator uiManagerDidPerformLayout:self];

  [_observerCoordinator uiManagerWillPerformMounting:self];

  [self flushUIBlocksWithCompletion:^{
    [self->_observerCoordinator uiManagerDidPerformMounting:self];
  }];
}

- (void)flushUIBlocksWithCompletion:(void (^)(void))completion
{
  ABI49_0_0RCTAssertUIManagerQueue();

  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  NSArray<ABI49_0_0RCTViewManagerUIBlock> *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [NSMutableArray new];

  if (previousPendingUIBlocks.count == 0) {
    completion();
    return;
  }

  __weak typeof(self) weakSelf = self;

  void (^mountingBlock)(void) = ^{
    typeof(self) strongSelf = weakSelf;

    @try {
      for (ABI49_0_0RCTViewManagerUIBlock block in previousPendingUIBlocks) {
        block(strongSelf, strongSelf->_viewRegistry);
      }
    } @catch (NSException *exception) {
      ABI49_0_0RCTLogError(@"Exception thrown while executing UI block: %@", exception);
    }
  };

  if ([self.observerCoordinator uiManager:self performMountingWithBlock:mountingBlock]) {
    completion();
    return;
  }

  // Execute the previously queued UI blocks
  ABI49_0_0RCTProfileBeginFlowEvent();
  ABI49_0_0RCTExecuteOnMainQueue(^{
    ABI49_0_0RCTProfileEndFlowEvent();
    ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"-[UIManager flushUIBlocks]", (@{
                              @"count" : [@(previousPendingUIBlocks.count) stringValue],
                            }));

    mountingBlock();

    ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");

    ABI49_0_0RCTExecuteOnUIManagerQueue(completion);
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

- (void)_shadowView:(ABI49_0_0RCTShadowView *)shadowView didReceiveUpdatedProps:(NSArray<NSString *> *)props
{
  // We collect a set with changed `shadowViews` and its changed props,
  // so we have to maintain this collection properly.
  NSArray<NSString *> *previousProps;
  if ((previousProps = [_shadowViewsWithUpdatedProps objectForKey:shadowView])) {
    // Merging already registered changed props and new ones.
    NSMutableSet *set = [NSMutableSet setWithArray:previousProps];
    [set addObjectsFromArray:props];
    props = [set allObjects];
  }

  [_shadowViewsWithUpdatedProps setObject:props forKey:shadowView];
}

- (void)_shadowViewDidReceiveUpdatedChildren:(ABI49_0_0RCTShadowView *)shadowView
{
  [_shadowViewsWithUpdatedChildren addObject:shadowView];
}

- (void)_dispatchChildrenDidChangeEvents
{
  if (_shadowViewsWithUpdatedChildren.count == 0) {
    return;
  }

  NSHashTable<ABI49_0_0RCTShadowView *> *shadowViews = _shadowViewsWithUpdatedChildren;
  _shadowViewsWithUpdatedChildren = [NSHashTable weakObjectsHashTable];

  NSMutableArray *tags = [NSMutableArray arrayWithCapacity:shadowViews.count];

  for (ABI49_0_0RCTShadowView *shadowView in shadowViews) {
    [shadowView didUpdateABI49_0_0ReactSubviews];
    [tags addObject:shadowView.ABI49_0_0ReactTag];
  }

  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (NSNumber *tag in tags) {
      UIView<ABI49_0_0RCTComponent> *view = viewRegistry[tag];
      [view didUpdateABI49_0_0ReactSubviews];
    }
  }];
}

- (void)_dispatchPropsDidChangeEvents
{
  if (_shadowViewsWithUpdatedProps.count == 0) {
    return;
  }

  NSMapTable<ABI49_0_0RCTShadowView *, NSArray<NSString *> *> *shadowViews = _shadowViewsWithUpdatedProps;
  _shadowViewsWithUpdatedProps = [NSMapTable weakToStrongObjectsMapTable];

  NSMapTable<NSNumber *, NSArray<NSString *> *> *tags = [NSMapTable strongToStrongObjectsMapTable];

  for (ABI49_0_0RCTShadowView *shadowView in shadowViews) {
    NSArray<NSString *> *props = [shadowViews objectForKey:shadowView];
    [shadowView didSetProps:props];
    [tags setObject:props forKey:shadowView.ABI49_0_0ReactTag];
  }

  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (NSNumber *tag in tags) {
      UIView<ABI49_0_0RCTComponent> *view = viewRegistry[tag];
      [view didSetProps:[tags objectForKey:tag]];
    }
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(measure : (nonnull NSNumber *)ABI49_0_0ReactTag callback : (ABI49_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ABI49_0_0ReactTag];
    if (!view) {
      // this view was probably collapsed out
      ABI49_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ABI49_0_0ReactTag);
      callback(@[]);
      return;
    }

    // If in a <Modal>, rootView will be the root of the modal container.
    UIView *rootView = view;
    while (rootView.superview && ![rootView isABI49_0_0ReactRootView]) {
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

ABI49_0_0RCT_EXPORT_METHOD(measureInWindow : (nonnull NSNumber *)ABI49_0_0ReactTag callback : (ABI49_0_0RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ABI49_0_0ReactTag];
    if (!view) {
      // this view was probably collapsed out
      ABI49_0_0RCTLogWarn(@"measure cannot find view with tag #%@", ABI49_0_0ReactTag);
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
 * Returns if the shadow view provided has the `ancestor` shadow view as
 * an actual ancestor.
 */
ABI49_0_0RCT_EXPORT_METHOD(viewIsDescendantOf
                  : (nonnull NSNumber *)ABI49_0_0ReactTag ancestor
                  : (nonnull NSNumber *)ancestorABI49_0_0ReactTag callback
                  : (ABI49_0_0RCTResponseSenderBlock)callback)
{
  ABI49_0_0RCTShadowView *shadowView = _shadowViewRegistry[ABI49_0_0ReactTag];
  ABI49_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorABI49_0_0ReactTag];
  if (!shadowView) {
    return;
  }
  if (!ancestorShadowView) {
    return;
  }
  BOOL viewIsAncestor = [shadowView viewIsDescendantOf:ancestorShadowView];
  callback(@[ @(viewIsAncestor) ]);
}

static void ABI49_0_0RCTMeasureLayout(ABI49_0_0RCTShadowView *view, ABI49_0_0RCTShadowView *ancestor, ABI49_0_0RCTResponseSenderBlock callback)
{
  if (!view) {
    return;
  }
  if (!ancestor) {
    return;
  }
  CGRect result = [view measureLayoutRelativeToAncestor:ancestor];
  if (CGRectIsNull(result)) {
    ABI49_0_0RCTLogError(
        @"view %@ (tag #%@) is not a descendant of %@ (tag #%@)", view, view.ABI49_0_0ReactTag, ancestor, ancestor.ABI49_0_0ReactTag);
    return;
  }
  CGFloat leftOffset = result.origin.x;
  CGFloat topOffset = result.origin.y;
  CGFloat width = result.size.width;
  CGFloat height = result.size.height;
  if (isnan(leftOffset) || isnan(topOffset) || isnan(width) || isnan(height)) {
    ABI49_0_0RCTLogError(@"Attempted to measure layout but offset or dimensions were NaN");
    return;
  }
  callback(@[ @(leftOffset), @(topOffset), @(width), @(height) ]);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
ABI49_0_0RCT_EXPORT_METHOD(measureLayout
                  : (nonnull NSNumber *)ABI49_0_0ReactTag relativeTo
                  : (nonnull NSNumber *)ancestorABI49_0_0ReactTag errorCallback
                  : (__unused ABI49_0_0RCTResponseSenderBlock)errorCallback callback
                  : (ABI49_0_0RCTResponseSenderBlock)callback)
{
  ABI49_0_0RCTShadowView *shadowView = _shadowViewRegistry[ABI49_0_0ReactTag];
  ABI49_0_0RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorABI49_0_0ReactTag];
  ABI49_0_0RCTMeasureLayout(shadowView, ancestorShadowView, callback);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
ABI49_0_0RCT_EXPORT_METHOD(measureLayoutRelativeToParent
                  : (nonnull NSNumber *)ABI49_0_0ReactTag errorCallback
                  : (__unused ABI49_0_0RCTResponseSenderBlock)errorCallback callback
                  : (ABI49_0_0RCTResponseSenderBlock)callback)
{
  ABI49_0_0RCTLogWarn(
      @"ABI49_0_0RCTUIManager.measureLayoutRelativeToParent method is deprecated and it will not be implemented in newer versions of ABI49_0_0RN (Fabric) - T47686450");
  ABI49_0_0RCTShadowView *shadowView = _shadowViewRegistry[ABI49_0_0ReactTag];
  ABI49_0_0RCTMeasureLayout(shadowView, shadowView.ABI49_0_0ReactSuperview, callback);
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
ABI49_0_0RCT_EXPORT_METHOD(setJSResponder
                  : (nonnull NSNumber *)ABI49_0_0ReactTag blockNativeResponder
                  : (__unused BOOL)blockNativeResponder)
{
  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = viewRegistry[ABI49_0_0ReactTag];
    // Fabric view's are not stored in viewRegistry. We avoid logging a warning in that case.
    if (!_jsResponder && !ABI49_0_0RCTUIManagerTypeForTagIsFabric(ABI49_0_0ReactTag)) {
      ABI49_0_0RCTLogWarn(@"Invalid view set to be the JS responder - tag %@", ABI49_0_0ReactTag);
    }
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(clearJSResponder)
{
  [self addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = nil;
  }];
}

static NSMutableDictionary<NSString *, id> *moduleConstantsForComponent(
    NSMutableDictionary<NSString *, NSDictionary *> *directEvents,
    NSMutableDictionary<NSString *, NSDictionary *> *bubblingEvents,
    ABI49_0_0RCTComponentData *componentData)
{
  NSMutableDictionary<NSString *, id> *moduleConstants = [NSMutableDictionary new];

  // Register which event-types this view dispatches.
  // ABI49_0_0React needs this for the event plugin.
  NSMutableDictionary<NSString *, NSDictionary *> *bubblingEventTypes = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *directEventTypes = [NSMutableDictionary new];

  // Add manager class
  moduleConstants[@"Manager"] = ABI49_0_0RCTBridgeModuleNameForClass(componentData.managerClass);

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
        @"registrationName" : [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"],
      };
    }
    directEventTypes[eventName] = directEvents[eventName];
    if (ABI49_0_0RCT_DEBUG && bubblingEvents[eventName]) {
      ABI49_0_0RCTLogError(
          @"Component '%@' re-registered bubbling event '%@' as a "
           "direct event",
          componentData.name,
          eventName);
    }
  }

  // Add bubbling events
  for (NSString *eventName in viewConfig[@"bubblingEvents"]) {
    if (!bubblingEvents[eventName]) {
      NSString *bubbleName = [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"];
      bubblingEvents[eventName] = @{
        @"phasedRegistrationNames" : @{
          @"bubbled" : bubbleName,
          @"captured" : [bubbleName stringByAppendingString:@"Capture"],
        }
      };
    }
    bubblingEventTypes[eventName] = bubblingEvents[eventName];
    if (ABI49_0_0RCT_DEBUG && directEvents[eventName]) {
      ABI49_0_0RCTLogError(
          @"Component '%@' re-registered direct event '%@' as a "
           "bubbling event",
          componentData.name,
          eventName);
    }
  }

  // Add capturing events (added as bubbling events but with the 'skipBubbling' flag)
  for (NSString *eventName in viewConfig[@"capturingEvents"]) {
    if (!bubblingEvents[eventName]) {
      NSString *bubbleName = [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"];
      bubblingEvents[eventName] = @{
        @"phasedRegistrationNames" : @{
          @"bubbled" : bubbleName,
          @"captured" : [bubbleName stringByAppendingString:@"Capture"],
          @"skipBubbling" : @YES
        }
      };
    }
    bubblingEventTypes[eventName] = bubblingEvents[eventName];
    if (ABI49_0_0RCT_DEBUG && directEvents[eventName]) {
      ABI49_0_0RCTLogError(
          @"Component '%@' re-registered direct event '%@' as a "
           "bubbling event",
          componentData.name,
          eventName);
    }
  }

  return moduleConstants;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  NSMutableDictionary<NSString *, NSDictionary *> *constants = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *directEvents = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *bubblingEvents = [NSMutableDictionary new];

  [_componentDataByName
      enumerateKeysAndObjectsUsingBlock:^(NSString *name, ABI49_0_0RCTComponentData *componentData, __unused BOOL *stop) {
        ABI49_0_0RCTAssert(!constants[name], @"UIManager already has constants for %@", componentData.name);
        NSMutableDictionary<NSString *, id> *moduleConstants =
            moduleConstantsForComponent(directEvents, bubblingEvents, componentData);
        constants[name] = moduleConstants;
      }];

  return constants;
}

ABI49_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(lazilyLoadView : (NSString *)name)
{
  if (_componentDataByName[name]) {
    return @{};
  }

  id<ABI49_0_0RCTBridgeDelegate> delegate = self.bridge.delegate;
  if (![delegate respondsToSelector:@selector(bridge:didNotFindModule:)]) {
    return @{};
  }

  NSString *moduleName = name;
  BOOL result = [delegate bridge:self.bridge didNotFindModule:moduleName];
  if (!result) {
    moduleName = [name stringByAppendingString:@"Manager"];
    result = [delegate bridge:self.bridge didNotFindModule:moduleName];
  }
  if (!result) {
    return @{};
  }

  id module = [self.bridge moduleForName:moduleName lazilyLoadIfNecessary:ABI49_0_0RCTTurboModuleEnabled()];
  if (module == nil) {
    // There is all sorts of code in this codebase that drops prefixes.
    //
    // If we didn't find a module, it's possible because it's stored under a key
    // which had ABI49_0_0RCT Prefixes stripped. Lets check one more time...
    module = [self.bridge moduleForName:ABI49_0_0RCTDropABI49_0_0ReactPrefixes(moduleName) lazilyLoadIfNecessary:ABI49_0_0RCTTurboModuleEnabled()];
  }

  if (!module) {
    return @{};
  }

  ABI49_0_0RCTComponentData *componentData = [[ABI49_0_0RCTComponentData alloc] initWithManagerClass:[module class]
                                                                            bridge:self.bridge
                                                                   eventDispatcher:self.bridge.eventDispatcher];
  _componentDataByName[componentData.name] = componentData;
  NSMutableDictionary *directEvents = [NSMutableDictionary new];
  NSMutableDictionary *bubblingEvents = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, id> *moduleConstants =
      moduleConstantsForComponent(directEvents, bubblingEvents, componentData);
  return @{
    @"viewConfig" : moduleConstants,
  };
}

ABI49_0_0RCT_EXPORT_METHOD(configureNextLayoutAnimation
                  : (NSDictionary *)config withCallback
                  : (ABI49_0_0RCTResponseSenderBlock)callback errorCallback
                  : (__unused ABI49_0_0RCTResponseSenderBlock)errorCallback)
{
  ABI49_0_0RCTLayoutAnimationGroup *layoutAnimationGroup = [[ABI49_0_0RCTLayoutAnimationGroup alloc] initWithConfig:config
                                                                                         callback:callback];

  [self addUIBlock:^(ABI49_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    [uiManager setNextLayoutAnimationGroup:layoutAnimationGroup];
  }];
}

- (void)rootViewForABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag withCompletion:(void (^)(UIView *view))completion
{
  ABI49_0_0RCTAssertMainQueue();
  ABI49_0_0RCTAssert(completion != nil, @"Attempted to resolve rootView for tag %@ without a completion block", ABI49_0_0ReactTag);

  if (ABI49_0_0ReactTag == nil) {
    completion(nil);
    return;
  }

  ABI49_0_0RCTExecuteOnUIManagerQueue(^{
    NSNumber *rootTag = [self shadowViewForABI49_0_0ReactTag:ABI49_0_0ReactTag].rootView.ABI49_0_0ReactTag;
    ABI49_0_0RCTExecuteOnMainQueue(^{
      UIView *rootView = nil;
      if (rootTag != nil) {
        rootView = [self viewForABI49_0_0ReactTag:rootTag];
      }
      completion(rootView);
    });
  });
}

static UIView *_jsResponder;

+ (UIView *)JSResponder
{
  ABI49_0_0RCTErrorNewArchitectureValidation(
      ABI49_0_0RCTNotAllowedInFabricWithoutLegacy, @"ABI49_0_0RCTUIManager", @"Please migrate this legacy surface to Fabric.");
  return _jsResponder;
}

@end

@implementation ABI49_0_0RCTBridge (ABI49_0_0RCTUIManager)

- (ABI49_0_0RCTUIManager *)uiManager
{
  return [self moduleForClass:[ABI49_0_0RCTUIManager class]];
}

@end
