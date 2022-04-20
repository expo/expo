#import <Foundation/Foundation.h>
#import <ABI45_0_0RNReanimated/FeaturesConfig.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAIOSScheduler.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAUIManager.h>
#import <ABI45_0_0RNReanimated/Scheduler.h>
#import <ABI45_0_0React/ABI45_0_0RCTComponentData.h>
#import <ABI45_0_0React/ABI45_0_0RCTLayoutAnimation.h>
#import <ABI45_0_0React/ABI45_0_0RCTLayoutAnimationGroup.h>
#import <ABI45_0_0React/ABI45_0_0RCTModalHostView.h>
#import <ABI45_0_0React/ABI45_0_0RCTRootShadowView.h>
#import <ABI45_0_0React/ABI45_0_0RCTRootViewInternal.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManagerObserverCoordinator.h>

#if __has_include(<ABI45_0_0RNScreens/ABI45_0_0RNSScreen.h>)
#import <ABI45_0_0RNScreens/ABI45_0_0RNSScreen.h>
#endif

@interface ABI45_0_0RCTUIManager (REA)
- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildABI45_0_0ReactTags:(NSArray<NSNumber *> *)addChildABI45_0_0ReactTags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI45_0_0RCTComponent>> *)registry;

- (NSArray<id<ABI45_0_0RCTComponent>> *)_childrenToRemoveFromContainer:(id<ABI45_0_0RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices;
@end

@implementation ABI45_0_0REAUIManager

BOOL ABI45_0_0blockSetter = false;
NSMutableDictionary<NSNumber *, NSMutableSet<id<ABI45_0_0RCTComponent>> *> *ABI45_0_0_toBeRemovedRegister;
NSMutableDictionary<NSNumber *, NSNumber *> *ABI45_0_0_parentMapper;
ABI45_0_0REAAnimationsManager *ABI45_0_0_animationsManager;
std::weak_ptr<ABI45_0_0reanimated::Scheduler> ABI45_0_0_scheduler;

+ (NSString *)moduleName
{
  return NSStringFromClass([ABI45_0_0RCTUIManager class]);
}

- (void)setBridge:(ABI45_0_0RCTBridge *)bridge
{
  if (!_ABI45_0_0blockSetter) {
    _ABI45_0_0blockSetter = true;

    self.bridge = bridge;
    [super setValue:bridge forKey:@"_bridge"];
    [self setValue:[bridge.uiManager valueForKey:@"_shadowViewRegistry"] forKey:@"_shadowViewRegistry"];
    [self setValue:[bridge.uiManager valueForKey:@"_viewRegistry"] forKey:@"_viewRegistry"];
    [self setValue:[bridge.uiManager valueForKey:@"_nativeIDRegistry"] forKey:@"_nativeIDRegistry"];
    [self setValue:[bridge.uiManager valueForKey:@"_shadowViewsWithUpdatedProps"]
            forKey:@"_shadowViewsWithUpdatedProps"];
    [self setValue:[bridge.uiManager valueForKey:@"_shadowViewsWithUpdatedChildren"]
            forKey:@"_shadowViewsWithUpdatedChildren"];
    [self setValue:[bridge.uiManager valueForKey:@"_pendingUIBlocks"] forKey:@"_pendingUIBlocks"];
    [self setValue:[bridge.uiManager valueForKey:@"_rootViewTags"] forKey:@"_rootViewTags"];
    [self setValue:[bridge.uiManager valueForKey:@"_observerCoordinator"] forKey:@"_observerCoordinator"];
    [self setValue:[bridge.uiManager valueForKey:@"_componentDataByName"] forKey:@"_componentDataByName"];

    _ABI45_0_0blockSetter = false;
  }
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildABI45_0_0ReactTags:(NSArray<NSNumber *> *)addChildABI45_0_0ReactTags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI45_0_0RCTComponent>> *)registry
{
  if (!ABI45_0_0reanimated::FeaturesConfig::isLayoutAnimationEnabled()) {
    [super _manageChildren:containerTag
           moveFromIndices:moveFromIndices
             moveToIndices:moveToIndices
         addChildABI45_0_0ReactTags:addChildABI45_0_0ReactTags
              addAtIndices:addAtIndices
           removeAtIndices:removeAtIndices
                  registry:registry];
    return;
  }

  // Reanimated changes /start
  BOOL isUIViewRegistry = ((id)registry == (id)[self valueForKey:@"_viewRegistry"]);
  id<ABI45_0_0RCTComponent> container;
  NSMutableArray<id<ABI45_0_0RCTComponent>> *permanentlyRemovedChildren;
  if (isUIViewRegistry) {
    container = registry[containerTag];
    for (id<ABI45_0_0RCTComponent> toRemoveChild in ABI45_0_0_toBeRemovedRegister[containerTag]) {
      [container removeABI45_0_0ReactSubview:toRemoveChild];
    }

    permanentlyRemovedChildren = (NSMutableArray *)[super _childrenToRemoveFromContainer:container
                                                                               atIndices:removeAtIndices];
    if (permanentlyRemovedChildren != nil) {
      for (id<ABI45_0_0RCTComponent> permanentlyRemovedChild in permanentlyRemovedChildren) {
        if (ABI45_0_0_toBeRemovedRegister[containerTag] == nil) {
          ABI45_0_0_toBeRemovedRegister[containerTag] = [[NSMutableSet<id<ABI45_0_0RCTComponent>> alloc] init];
        }
        [ABI45_0_0_toBeRemovedRegister[containerTag] addObject:permanentlyRemovedChild];
      }
    }
  }
  // Reanimated changes /end

  [super _manageChildren:containerTag
         moveFromIndices:moveFromIndices
           moveToIndices:moveToIndices
       addChildABI45_0_0ReactTags:addChildABI45_0_0ReactTags
            addAtIndices:addAtIndices
         removeAtIndices:removeAtIndices
                registry:registry];

  // Reanimated changes /start
  if (isUIViewRegistry) {
    NSMutableDictionary<NSNumber *, id<ABI45_0_0RCTComponent>> *viewRegistry = [self valueForKey:@"_viewRegistry"];
    for (id<ABI45_0_0RCTComponent> toRemoveChild in ABI45_0_0_toBeRemovedRegister[containerTag]) {
      NSInteger lastIndex = [container ABI45_0_0ReactSubviews].count - 1;
      if (lastIndex < 0) {
        lastIndex = 0;
      }
      if ([toRemoveChild isKindOfClass:[ABI45_0_0RCTModalHostView class]]
#if __has_include(<ABI45_0_0RNScreens/ABI45_0_0RNSScreen.h>)
          || ([toRemoveChild isKindOfClass:[ABI45_0_0RNSScreenView class]])
#endif
      ) {
        // we don't want layout animations when removing modals or Screens of native-stack since it brings buggy
        // behavior
        [ABI45_0_0_toBeRemovedRegister[container.ABI45_0_0ReactTag] removeObject:toRemoveChild];
        [permanentlyRemovedChildren removeObject:toRemoveChild];

      } else {
        [container insertABI45_0_0ReactSubview:toRemoveChild atIndex:lastIndex];
        viewRegistry[toRemoveChild.ABI45_0_0ReactTag] = toRemoveChild;
      }
    }

    for (UIView *removedChild in permanentlyRemovedChildren) {
      [self callAnimationForTree:removedChild parentTag:containerTag];
    }
  }
  // Reanimated changes /end
}

- (void)callAnimationForTree:(UIView *)view parentTag:(NSNumber *)parentTag
{
  ABI45_0_0REASnapshot *snapshot = [[ABI45_0_0REASnapshot alloc] init:view];
  ABI45_0_0_parentMapper[view.ABI45_0_0ReactTag] = parentTag;
  [ABI45_0_0_animationsManager onViewRemoval:view before:snapshot];

  for (UIView *subView in view.ABI45_0_0ReactSubviews) {
    [self callAnimationForTree:subView parentTag:view.ABI45_0_0ReactTag];
  }
}

// Overrided https://github.com/facebook/react-native/blob/v0.65.0/ABI45_0_0React/Modules/ABI45_0_0RCTUIManager.m#L530
- (ABI45_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI45_0_0RCTRootShadowView *)rootShadowView
{
  NSHashTable<ABI45_0_0RCTShadowView *> *affectedShadowViews = [NSHashTable weakObjectsHashTable];
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
    ABI45_0_0RCTDisplayType displayType;
  } ABI45_0_0RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = affectedShadowViews.count;
  NSMutableArray *ABI45_0_0ReactTags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(ABI45_0_0RCTFrameData) * count];
  {
    NSUInteger index = 0;
    ABI45_0_0RCTFrameData *frameDataArray = (ABI45_0_0RCTFrameData *)framesData.mutableBytes;
    for (ABI45_0_0RCTShadowView *shadowView in affectedShadowViews) {
      ABI45_0_0ReactTags[index] = shadowView.ABI45_0_0ReactTag;
      ABI45_0_0RCTLayoutMetrics layoutMetrics = shadowView.layoutMetrics;
      frameDataArray[index++] = (ABI45_0_0RCTFrameData){
          layoutMetrics.frame,
          layoutMetrics.layoutDirection,
          shadowView.isNewView,
          shadowView.superview.isNewView,
          layoutMetrics.displayType};
    }
  }

  for (ABI45_0_0RCTShadowView *shadowView in affectedShadowViews) {
    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *ABI45_0_0ReactTag = shadowView.ABI45_0_0ReactTag;

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

    if (ABI45_0_0RCTIsABI45_0_0ReactRootView(ABI45_0_0ReactTag) && [shadowView isKindOfClass:[ABI45_0_0RCTRootShadowView class]]) {
      CGSize contentSize = shadowView.layoutMetrics.frame.size;

      ABI45_0_0RCTExecuteOnMainQueue(^{
        NSMutableDictionary<NSNumber *, UIView *> *viewRegistry = [self valueForKey:@"_viewRegistry"];
        UIView *view = viewRegistry[ABI45_0_0ReactTag];
        ABI45_0_0RCTAssert(view != nil, @"view (for ID %@) not found", ABI45_0_0ReactTag);

        ABI45_0_0RCTRootView *rootView = (ABI45_0_0RCTRootView *)[view superview];
        if ([rootView isKindOfClass:[ABI45_0_0RCTRootView class]]) {
          rootView.intrinsicContentSize = contentSize;
        }
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    const ABI45_0_0RCTFrameData *frameDataArray = (const ABI45_0_0RCTFrameData *)framesData.bytes;
    ABI45_0_0RCTLayoutAnimationGroup *layoutAnimationGroup = [uiManager valueForKey:@"_layoutAnimationGroup"];

    __block NSUInteger completionsCalled = 0;

    NSInteger index = 0;
    for (NSNumber *ABI45_0_0ReactTag in ABI45_0_0ReactTags) {
      ABI45_0_0RCTFrameData frameData = frameDataArray[index++];

      UIView *view = viewRegistry[ABI45_0_0ReactTag];
      CGRect frame = frameData.frame;

      UIUserInterfaceLayoutDirection layoutDirection = frameData.layoutDirection;
      BOOL isNew = frameData.isNew;
      ABI45_0_0RCTLayoutAnimation *updatingLayoutAnimation = isNew ? nil : layoutAnimationGroup.updatingLayoutAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      ABI45_0_0RCTLayoutAnimation *creatingLayoutAnimation =
          shouldAnimateCreation ? layoutAnimationGroup.creatingLayoutAnimation : nil;
      BOOL isHidden = frameData.displayType == ABI45_0_0RCTDisplayTypeNone;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (layoutAnimationGroup.callback && completionsCalled == count) {
          layoutAnimationGroup.callback(@[ @(finished) ]);

          // It's unsafe to call this callback more than once, so we nil it out here
          // to make sure that doesn't happen.
          layoutAnimationGroup.callback = nil;
        }
      };

      if (view.ABI45_0_0ReactLayoutDirection != layoutDirection) {
        view.ABI45_0_0ReactLayoutDirection = layoutDirection;
      }

      if (view.isHidden != isHidden) {
        view.hidden = isHidden;
      }

      // Reanimated changes /start
      ABI45_0_0REASnapshot *snapshotBefore;
      if (ABI45_0_0reanimated::FeaturesConfig::isLayoutAnimationEnabled()) {
        snapshotBefore = [[ABI45_0_0REASnapshot alloc] init:view];
      }
      // Reanimated changes /end

      if (creatingLayoutAnimation) {
        // Animate view creation
        [view ABI45_0_0ReactSetFrame:frame];

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
          ABI45_0_0RCTLogError(@"Unsupported layout animation createConfig property %@", creatingLayoutAnimation.property);
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
                [view ABI45_0_0ReactSetFrame:frame];
              }
            withCompletionBlock:completion];

      } else {
        // Update without animation
        [view ABI45_0_0ReactSetFrame:frame];
        completion(YES);
      }

      // Reanimated changes /start
      if (ABI45_0_0reanimated::FeaturesConfig::isLayoutAnimationEnabled()) {
        if (isNew) {
          ABI45_0_0REASnapshot *snapshot = [[ABI45_0_0REASnapshot alloc] init:view];
          [ABI45_0_0_animationsManager onViewCreate:view after:snapshot];
        } else {
          ABI45_0_0REASnapshot *snapshotAfter = [[ABI45_0_0REASnapshot alloc] init:view];
          [ABI45_0_0_animationsManager onViewUpdate:view before:snapshotBefore after:snapshotAfter];
        }
      }
    }

    [ABI45_0_0_animationsManager removeLeftovers];
    // Clean up
    // uiManager->_layoutAnimationGroup = nil;
    [uiManager setValue:nil forKey:@"_layoutAnimationGroup"];
    // Reanimated changes /end
  };
}

- (Class)class
{
  return [ABI45_0_0RCTUIManager class];
}

+ (Class)class
{
  return [ABI45_0_0RCTUIManager class];
}

- (void)setUp:(ABI45_0_0REAAnimationsManager *)animationsManager
{
  ABI45_0_0_animationsManager = animationsManager;
  ABI45_0_0_toBeRemovedRegister = [[NSMutableDictionary<NSNumber *, NSMutableSet<id<ABI45_0_0RCTComponent>> *> alloc] init];
  ABI45_0_0_parentMapper = [[NSMutableDictionary<NSNumber *, NSNumber *> alloc] init];
}

- (void)unregisterView:(id<ABI45_0_0RCTComponent>)view
{
  NSNumber *tag = ABI45_0_0_parentMapper[view.ABI45_0_0ReactTag];
  if (tag == nil) {
    return;
  }

  [ABI45_0_0_toBeRemovedRegister[tag] removeObject:view];
  if (ABI45_0_0_toBeRemovedRegister[tag].count == 0) {
    [ABI45_0_0_toBeRemovedRegister removeObjectForKey:tag];
  }
  NSMutableDictionary<NSNumber *, id<ABI45_0_0RCTComponent>> *viewRegistry = [self valueForKey:@"_viewRegistry"];
  [view.ABI45_0_0ReactSuperview removeABI45_0_0ReactSubview:view];
  id<ABI45_0_0RCTComponent> parentView = viewRegistry[tag];
  @try {
    [parentView removeABI45_0_0ReactSubview:view];
  } @catch (id anException) {
  }
#if __has_include(<ABI45_0_0RNScreens/ABI45_0_0RNSScreen.h>)
  if ([view isKindOfClass:[ABI45_0_0RNSScreenView class]]) {
    [parentView didUpdateABI45_0_0ReactSubviews];
  }
#endif
  [viewRegistry removeObjectForKey:view.ABI45_0_0ReactTag];
}

@end
