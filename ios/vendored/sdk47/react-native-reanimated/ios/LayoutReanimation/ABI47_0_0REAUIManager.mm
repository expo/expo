#import <Foundation/Foundation.h>
#import <ABI47_0_0RNReanimated/FeaturesConfig.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAIOSScheduler.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAUIManager.h>
#import <ABI47_0_0RNReanimated/Scheduler.h>
#import <ABI47_0_0React/ABI47_0_0RCTComponentData.h>
#import <ABI47_0_0React/ABI47_0_0RCTLayoutAnimation.h>
#import <ABI47_0_0React/ABI47_0_0RCTLayoutAnimationGroup.h>
#import <ABI47_0_0React/ABI47_0_0RCTModalHostView.h>
#import <ABI47_0_0React/ABI47_0_0RCTRootShadowView.h>
#import <ABI47_0_0React/ABI47_0_0RCTRootViewInternal.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManagerObserverCoordinator.h>

#if __has_include(<ABI47_0_0RNScreens/ABI47_0_0RNSScreen.h>)
#import <ABI47_0_0RNScreens/ABI47_0_0RNSScreen.h>
#endif

@interface ABI47_0_0RCTUIManager (REA)
- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildABI47_0_0ReactTags:(NSArray<NSNumber *> *)addChildABI47_0_0ReactTags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI47_0_0RCTComponent>> *)registry;

- (NSArray<id<ABI47_0_0RCTComponent>> *)_childrenToRemoveFromContainer:(id<ABI47_0_0RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices;
@end

@implementation ABI47_0_0REAUIManager

BOOL ABI47_0_0blockSetter = false;
NSMutableDictionary<NSNumber *, NSMutableSet<id<ABI47_0_0RCTComponent>> *> *ABI47_0_0_toBeRemovedRegister;
NSMutableDictionary<NSNumber *, NSNumber *> *ABI47_0_0_parentMapper;
ABI47_0_0REAAnimationsManager *ABI47_0_0_animationsManager;
std::weak_ptr<ABI47_0_0reanimated::Scheduler> ABI47_0_0_scheduler;

+ (NSString *)moduleName
{
  return NSStringFromClass([ABI47_0_0RCTUIManager class]);
}

- (void)setBridge:(ABI47_0_0RCTBridge *)bridge
{
  if (!_ABI47_0_0blockSetter) {
    _ABI47_0_0blockSetter = true;

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

    _ABI47_0_0blockSetter = false;
  }
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildABI47_0_0ReactTags:(NSArray<NSNumber *> *)addChildABI47_0_0ReactTags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI47_0_0RCTComponent>> *)registry
{
  if (!ABI47_0_0reanimated::FeaturesConfig::isLayoutAnimationEnabled()) {
    [super _manageChildren:containerTag
           moveFromIndices:moveFromIndices
             moveToIndices:moveToIndices
         addChildABI47_0_0ReactTags:addChildABI47_0_0ReactTags
              addAtIndices:addAtIndices
           removeAtIndices:removeAtIndices
                  registry:registry];
    return;
  }

  // Reanimated changes /start
  BOOL isUIViewRegistry = ((id)registry == (id)[self valueForKey:@"_viewRegistry"]);
  id<ABI47_0_0RCTComponent> container;
  NSMutableArray<id<ABI47_0_0RCTComponent>> *permanentlyRemovedChildren;
  if (isUIViewRegistry) {
    container = registry[containerTag];
    for (id<ABI47_0_0RCTComponent> toRemoveChild in ABI47_0_0_toBeRemovedRegister[containerTag]) {
      [container removeABI47_0_0ReactSubview:toRemoveChild];
    }

    permanentlyRemovedChildren = (NSMutableArray *)[super _childrenToRemoveFromContainer:container
                                                                               atIndices:removeAtIndices];
    if (permanentlyRemovedChildren != nil) {
      for (id<ABI47_0_0RCTComponent> permanentlyRemovedChild in permanentlyRemovedChildren) {
        if (ABI47_0_0_toBeRemovedRegister[containerTag] == nil) {
          ABI47_0_0_toBeRemovedRegister[containerTag] = [[NSMutableSet<id<ABI47_0_0RCTComponent>> alloc] init];
        }
        [ABI47_0_0_toBeRemovedRegister[containerTag] addObject:permanentlyRemovedChild];
      }
    }
  }
  // Reanimated changes /end

  [super _manageChildren:containerTag
         moveFromIndices:moveFromIndices
           moveToIndices:moveToIndices
       addChildABI47_0_0ReactTags:addChildABI47_0_0ReactTags
            addAtIndices:addAtIndices
         removeAtIndices:removeAtIndices
                registry:registry];

  // Reanimated changes /start
  if (isUIViewRegistry) {
    NSMutableDictionary<NSNumber *, id<ABI47_0_0RCTComponent>> *viewRegistry = [self valueForKey:@"_viewRegistry"];
    for (id<ABI47_0_0RCTComponent> toRemoveChild in ABI47_0_0_toBeRemovedRegister[containerTag]) {
      NSInteger lastIndex = [container ABI47_0_0ReactSubviews].count - 1;
      if (lastIndex < 0) {
        lastIndex = 0;
      }
      if ([toRemoveChild isKindOfClass:[ABI47_0_0RCTModalHostView class]]
#if __has_include(<ABI47_0_0RNScreens/ABI47_0_0RNSScreen.h>)
          || ([toRemoveChild isKindOfClass:[ABI47_0_0RNSScreenView class]])
#endif
      ) {
        // we don't want layout animations when removing modals or Screens of native-stack since it brings buggy
        // behavior
        [ABI47_0_0_toBeRemovedRegister[container.ABI47_0_0ReactTag] removeObject:toRemoveChild];
        [permanentlyRemovedChildren removeObject:toRemoveChild];

      } else {
        [container insertABI47_0_0ReactSubview:toRemoveChild atIndex:lastIndex];
        viewRegistry[toRemoveChild.ABI47_0_0ReactTag] = toRemoveChild;
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
  ABI47_0_0REASnapshot *snapshot = [[ABI47_0_0REASnapshot alloc] init:view];
  ABI47_0_0_parentMapper[view.ABI47_0_0ReactTag] = parentTag;
  [ABI47_0_0_animationsManager onViewRemoval:view before:snapshot];

  for (UIView *subView in view.ABI47_0_0ReactSubviews) {
    [self callAnimationForTree:subView parentTag:view.ABI47_0_0ReactTag];
  }
}

// Overrided https://github.com/facebook/react-native/blob/v0.65.0/ABI47_0_0React/Modules/ABI47_0_0RCTUIManager.m#L530
- (ABI47_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI47_0_0RCTRootShadowView *)rootShadowView
{
  NSHashTable<ABI47_0_0RCTShadowView *> *affectedShadowViews = [NSHashTable weakObjectsHashTable];
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
    ABI47_0_0RCTDisplayType displayType;
  } ABI47_0_0RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = affectedShadowViews.count;
  NSMutableArray *ABI47_0_0ReactTags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(ABI47_0_0RCTFrameData) * count];
  {
    NSUInteger index = 0;
    ABI47_0_0RCTFrameData *frameDataArray = (ABI47_0_0RCTFrameData *)framesData.mutableBytes;
    for (ABI47_0_0RCTShadowView *shadowView in affectedShadowViews) {
      ABI47_0_0ReactTags[index] = shadowView.ABI47_0_0ReactTag;
      ABI47_0_0RCTLayoutMetrics layoutMetrics = shadowView.layoutMetrics;
      frameDataArray[index++] = (ABI47_0_0RCTFrameData){
          layoutMetrics.frame,
          layoutMetrics.layoutDirection,
          shadowView.isNewView,
          shadowView.superview.isNewView,
          layoutMetrics.displayType};
    }
  }

  for (ABI47_0_0RCTShadowView *shadowView in affectedShadowViews) {
    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *ABI47_0_0ReactTag = shadowView.ABI47_0_0ReactTag;

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

    if (ABI47_0_0RCTIsABI47_0_0ReactRootView(ABI47_0_0ReactTag) && [shadowView isKindOfClass:[ABI47_0_0RCTRootShadowView class]]) {
      CGSize contentSize = shadowView.layoutMetrics.frame.size;

      ABI47_0_0RCTExecuteOnMainQueue(^{
        NSMutableDictionary<NSNumber *, UIView *> *viewRegistry = [self valueForKey:@"_viewRegistry"];
        UIView *view = viewRegistry[ABI47_0_0ReactTag];
        ABI47_0_0RCTAssert(view != nil, @"view (for ID %@) not found", ABI47_0_0ReactTag);

        ABI47_0_0RCTRootView *rootView = (ABI47_0_0RCTRootView *)[view superview];
        if ([rootView isKindOfClass:[ABI47_0_0RCTRootView class]]) {
          rootView.intrinsicContentSize = contentSize;
        }
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    const ABI47_0_0RCTFrameData *frameDataArray = (const ABI47_0_0RCTFrameData *)framesData.bytes;
    ABI47_0_0RCTLayoutAnimationGroup *layoutAnimationGroup = [uiManager valueForKey:@"_layoutAnimationGroup"];

    __block NSUInteger completionsCalled = 0;

    NSInteger index = 0;
    for (NSNumber *ABI47_0_0ReactTag in ABI47_0_0ReactTags) {
      ABI47_0_0RCTFrameData frameData = frameDataArray[index++];

      UIView *view = viewRegistry[ABI47_0_0ReactTag];
      CGRect frame = frameData.frame;

      UIUserInterfaceLayoutDirection layoutDirection = frameData.layoutDirection;
      BOOL isNew = frameData.isNew;
      ABI47_0_0RCTLayoutAnimation *updatingLayoutAnimation = isNew ? nil : layoutAnimationGroup.updatingLayoutAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      ABI47_0_0RCTLayoutAnimation *creatingLayoutAnimation =
          shouldAnimateCreation ? layoutAnimationGroup.creatingLayoutAnimation : nil;
      BOOL isHidden = frameData.displayType == ABI47_0_0RCTDisplayTypeNone;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (layoutAnimationGroup.callback && completionsCalled == count) {
          layoutAnimationGroup.callback(@[ @(finished) ]);

          // It's unsafe to call this callback more than once, so we nil it out here
          // to make sure that doesn't happen.
          layoutAnimationGroup.callback = nil;
        }
      };

      if (view.ABI47_0_0ReactLayoutDirection != layoutDirection) {
        view.ABI47_0_0ReactLayoutDirection = layoutDirection;
      }

      if (view.isHidden != isHidden) {
        view.hidden = isHidden;
      }

      // Reanimated changes /start
      ABI47_0_0REASnapshot *snapshotBefore;
      if (ABI47_0_0reanimated::FeaturesConfig::isLayoutAnimationEnabled()) {
        snapshotBefore = [[ABI47_0_0REASnapshot alloc] init:view];
      }
      // Reanimated changes /end

      if (creatingLayoutAnimation) {
        // Animate view creation
        [view ABI47_0_0ReactSetFrame:frame];

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
          ABI47_0_0RCTLogError(@"Unsupported layout animation createConfig property %@", creatingLayoutAnimation.property);
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
                [view ABI47_0_0ReactSetFrame:frame];
              }
            withCompletionBlock:completion];

      } else {
        // Update without animation
        [view ABI47_0_0ReactSetFrame:frame];
        completion(YES);
      }

      // Reanimated changes /start
      if (ABI47_0_0reanimated::FeaturesConfig::isLayoutAnimationEnabled()) {
        if (isNew) {
          ABI47_0_0REASnapshot *snapshot = [[ABI47_0_0REASnapshot alloc] init:view];
          [ABI47_0_0_animationsManager onViewCreate:view after:snapshot];
        } else {
          ABI47_0_0REASnapshot *snapshotAfter = [[ABI47_0_0REASnapshot alloc] init:view];
          [ABI47_0_0_animationsManager onViewUpdate:view before:snapshotBefore after:snapshotAfter];
        }
      }
    }

    [ABI47_0_0_animationsManager removeLeftovers];
    // Clean up
    // uiManager->_layoutAnimationGroup = nil;
    [uiManager setValue:nil forKey:@"_layoutAnimationGroup"];
    // Reanimated changes /end
  };
}

- (Class)class
{
  return [ABI47_0_0RCTUIManager class];
}

+ (Class)class
{
  return [ABI47_0_0RCTUIManager class];
}

- (void)setUp:(ABI47_0_0REAAnimationsManager *)animationsManager
{
  ABI47_0_0_animationsManager = animationsManager;
  ABI47_0_0_toBeRemovedRegister = [[NSMutableDictionary<NSNumber *, NSMutableSet<id<ABI47_0_0RCTComponent>> *> alloc] init];
  ABI47_0_0_parentMapper = [[NSMutableDictionary<NSNumber *, NSNumber *> alloc] init];
}

- (void)unregisterView:(id<ABI47_0_0RCTComponent>)view
{
  NSNumber *tag = ABI47_0_0_parentMapper[view.ABI47_0_0ReactTag];
  if (tag == nil) {
    return;
  }

  [ABI47_0_0_toBeRemovedRegister[tag] removeObject:view];
  if (ABI47_0_0_toBeRemovedRegister[tag].count == 0) {
    [ABI47_0_0_toBeRemovedRegister removeObjectForKey:tag];
  }
  NSMutableDictionary<NSNumber *, id<ABI47_0_0RCTComponent>> *viewRegistry = [self valueForKey:@"_viewRegistry"];
  [view.ABI47_0_0ReactSuperview removeABI47_0_0ReactSubview:view];
  id<ABI47_0_0RCTComponent> parentView = viewRegistry[tag];
  @try {
    [parentView removeABI47_0_0ReactSubview:view];
  } @catch (id anException) {
  }
#if __has_include(<ABI47_0_0RNScreens/ABI47_0_0RNSScreen.h>)
  if ([view isKindOfClass:[ABI47_0_0RNSScreenView class]]) {
    [parentView didUpdateABI47_0_0ReactSubviews];
  }
#endif
  [viewRegistry removeObjectForKey:view.ABI47_0_0ReactTag];
}

@end
