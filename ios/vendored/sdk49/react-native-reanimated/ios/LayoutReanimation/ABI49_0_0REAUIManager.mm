#import <Foundation/Foundation.h>
#import <ABI49_0_0RNReanimated/FeaturesConfig.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REAIOSScheduler.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REAUIManager.h>
#import <ABI49_0_0RNReanimated/Scheduler.h>
#import <ABI49_0_0React/ABI49_0_0RCTComponentData.h>
#import <ABI49_0_0React/ABI49_0_0RCTLayoutAnimation.h>
#import <ABI49_0_0React/ABI49_0_0RCTLayoutAnimationGroup.h>
#import <ABI49_0_0React/ABI49_0_0RCTModalHostView.h>
#import <ABI49_0_0React/ABI49_0_0RCTRootShadowView.h>
#import <ABI49_0_0React/ABI49_0_0RCTRootViewInternal.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManagerObserverCoordinator.h>

#if __has_include(<ABI49_0_0RNScreens/ABI49_0_0RNSScreen.h>)
#import <ABI49_0_0RNScreens/ABI49_0_0RNSScreen.h>
#endif

@interface ABI49_0_0RCTUIManager (REA)
- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildABI49_0_0ReactTags:(NSArray<NSNumber *> *)addChildABI49_0_0ReactTags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)registry;

- (ABI49_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI49_0_0RCTRootShadowView *)rootShadowView;

- (NSArray<id<ABI49_0_0RCTComponent>> *)_childrenToRemoveFromContainer:(id<ABI49_0_0RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices;
@end

@implementation ABI49_0_0REAUIManager {
  NSMutableDictionary<NSNumber *, NSMutableSet<id<ABI49_0_0RCTComponent>> *> *ABI49_0_0_toBeRemovedRegister;
  NSMutableDictionary<NSNumber *, NSNumber *> *ABI49_0_0_parentMapper;
  ABI49_0_0REAAnimationsManager *ABI49_0_0_animationsManager;
  std::weak_ptr<ABI49_0_0reanimated::Scheduler> ABI49_0_0_scheduler;
}

+ (NSString *)moduleName
{
  return NSStringFromClass([ABI49_0_0RCTUIManager class]);
}

- (void)invalidate
{
  [ABI49_0_0_animationsManager invalidate];
  [super invalidate];
}

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge
{
  if (!_ABI49_0_0blockSetter) {
    _ABI49_0_0blockSetter = true;

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

    _ABI49_0_0blockSetter = false;
  }
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildABI49_0_0ReactTags:(NSArray<NSNumber *> *)addChildABI49_0_0ReactTags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *)registry
{
  bool isLayoutAnimationEnabled = ABI49_0_0reanimated::FeaturesConfig::isLayoutAnimationEnabled();
  id<ABI49_0_0RCTComponent> container;
  NSArray<id<ABI49_0_0RCTComponent>> *permanentlyRemovedChildren;
  BOOL containerIsRootOfViewController = NO;
  if (isLayoutAnimationEnabled) {
    container = registry[containerTag];
    permanentlyRemovedChildren = [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];

    if ([container isKindOfClass:[UIView class]]) {
      UIViewController *controller = ((UIView *)container).ABI49_0_0ReactViewController;
      UIViewController *parentController = ((UIView *)container).superview.ABI49_0_0ReactViewController;
      containerIsRootOfViewController = controller != parentController;
    }

    // we check if the container we`re removing from is a root view
    // of some view controller. In that case, we skip running exiting animations
    // in its children, to prevent issues with RN Screens.
    if (containerIsRootOfViewController) {
      NSArray<id<ABI49_0_0RCTComponent>> *permanentlyRemovedChildren = [self _childrenToRemoveFromContainer:container
                                                                                         atIndices:removeAtIndices];
      for (UIView *view in permanentlyRemovedChildren) {
        [ABI49_0_0_animationsManager endAnimationsRecursive:view];
      }
      [ABI49_0_0_animationsManager removeAnimationsFromSubtree:(UIView *)container];
    }
  }

  [super _manageChildren:containerTag
         moveFromIndices:moveFromIndices
           moveToIndices:moveToIndices
       addChildABI49_0_0ReactTags:addChildABI49_0_0ReactTags
            addAtIndices:addAtIndices
         removeAtIndices:removeAtIndices
                registry:registry];

  if (!isLayoutAnimationEnabled) {
    return;
  }

  if (containerIsRootOfViewController) {
    return;
  }

  // we sort the (index, view) pairs to make sure we insert views back in order
  NSMutableArray<NSArray<id> *> *removedViewsWithIndices = [NSMutableArray new];
  for (int i = 0; i < removeAtIndices.count; i++) {
    removedViewsWithIndices[i] = @[ removeAtIndices[i], permanentlyRemovedChildren[i] ];
  }
  [removedViewsWithIndices
      sortUsingComparator:^NSComparisonResult(NSArray<id> *_Nonnull obj1, NSArray<id> *_Nonnull obj2) {
        return [(NSNumber *)obj1[0] compare:(NSNumber *)obj2[0]];
      }];

  [ABI49_0_0_animationsManager reattachAnimatedChildren:permanentlyRemovedChildren
                                   toContainer:container
                                     atIndices:removeAtIndices];
}

- (void)callAnimationForTree:(UIView *)view parentTag:(NSNumber *)parentTag
{
  ABI49_0_0_parentMapper[view.ABI49_0_0ReactTag] = parentTag;

  for (UIView *subView in view.ABI49_0_0ReactSubviews) {
    [self callAnimationForTree:subView parentTag:view.ABI49_0_0ReactTag];
  }
}

// Overrided https://github.com/facebook/react-native/blob/v0.65.0/ABI49_0_0React/Modules/ABI49_0_0RCTUIManager.m#L530
- (ABI49_0_0RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(ABI49_0_0RCTRootShadowView *)rootShadowView
{
  if (!ABI49_0_0reanimated::FeaturesConfig::isLayoutAnimationEnabled()) {
    return [super uiBlockWithLayoutUpdateForRootView:rootShadowView];
  }

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
        NSMutableDictionary<NSNumber *, UIView *> *viewRegistry = [self valueForKey:@"_viewRegistry"];
        UIView *view = viewRegistry[ABI49_0_0ReactTag];
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
    ABI49_0_0RCTLayoutAnimationGroup *layoutAnimationGroup = [uiManager valueForKey:@"_layoutAnimationGroup"];

    __block NSUInteger completionsCalled = 0;

    NSMutableDictionary<NSNumber *, ABI49_0_0REASnapshot *> *snapshotsBefore = [NSMutableDictionary dictionary];

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

      // Reanimated changes /start
      ABI49_0_0REASnapshot *snapshotBefore = isNew ? nil : [self->ABI49_0_0_animationsManager prepareSnapshotBeforeMountForView:view];
      snapshotsBefore[ABI49_0_0ReactTag] = snapshotBefore;
      // Reanimated changes /end

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

    // Reanimated changes /start
    index = 0;
    for (NSNumber *ABI49_0_0ReactTag in ABI49_0_0ReactTags) {
      ABI49_0_0RCTFrameData frameData = frameDataArray[index++];
      UIView *view = viewRegistry[ABI49_0_0ReactTag];
      BOOL isNew = frameData.isNew;
      CGRect frame = frameData.frame;

      ABI49_0_0REASnapshot *snapshotBefore = snapshotsBefore[ABI49_0_0ReactTag];

      if (isNew || snapshotBefore != nil) {
        [self->ABI49_0_0_animationsManager viewDidMount:view withBeforeSnapshot:snapshotBefore withNewFrame:frame];
      }
    }

    // Clean up
    // below line serves as this one uiManager->_layoutAnimationGroup = nil;, because we don't have access to the
    // private field
    [uiManager setNextLayoutAnimationGroup:nil];

    [self->ABI49_0_0_animationsManager viewsDidLayout];
    // Reanimated changes /end
  };
}

- (Class)class
{
  return [ABI49_0_0RCTUIManager class];
}

+ (Class)class
{
  return [ABI49_0_0RCTUIManager class];
}

- (void)setUp:(ABI49_0_0REAAnimationsManager *)animationsManager
{
  ABI49_0_0_animationsManager = animationsManager;
  ABI49_0_0_toBeRemovedRegister = [[NSMutableDictionary<NSNumber *, NSMutableSet<id<ABI49_0_0RCTComponent>> *> alloc] init];
  ABI49_0_0_parentMapper = [[NSMutableDictionary<NSNumber *, NSNumber *> alloc] init];
}

- (void)unregisterView:(id<ABI49_0_0RCTComponent>)view
{
  NSNumber *tag = ABI49_0_0_parentMapper[view.ABI49_0_0ReactTag];
  if (tag == nil) {
    return;
  }

  [ABI49_0_0_toBeRemovedRegister[tag] removeObject:view];
  if (ABI49_0_0_toBeRemovedRegister[tag].count == 0) {
    [ABI49_0_0_toBeRemovedRegister removeObjectForKey:tag];
  }
  NSMutableDictionary<NSNumber *, id<ABI49_0_0RCTComponent>> *viewRegistry = [self valueForKey:@"_viewRegistry"];
  [view.ABI49_0_0ReactSuperview removeABI49_0_0ReactSubview:view];
  id<ABI49_0_0RCTComponent> parentView = viewRegistry[tag];
  @try {
    [parentView removeABI49_0_0ReactSubview:view];
  } @catch (id anException) {
  }
#if __has_include(<ABI49_0_0RNScreens/ABI49_0_0RNSScreen.h>)
  if ([view isKindOfClass:[ABI49_0_0RNSScreenView class]]) {
    [parentView didUpdateABI49_0_0ReactSubviews];
  }
#endif
  [viewRegistry removeObjectForKey:view.ABI49_0_0ReactTag];
}

@end
