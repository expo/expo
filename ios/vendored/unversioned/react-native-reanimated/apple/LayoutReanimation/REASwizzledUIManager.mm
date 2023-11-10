#import <RNReanimated/FeaturesConfig.h>
#import <RNReanimated/REASwizzledUIManager.h>
#import <RNReanimated/REAUIKit.h>
#import <RNReanimated/REAUtils.h>
#import <React/RCTLayoutAnimation.h>
#import <React/RCTLayoutAnimationGroup.h>
#import <React/RCTRootShadowView.h>
#import <React/RCTRootViewInternal.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <objc/runtime.h>

@interface RCTUIManager (Reanimated)
@property REAAnimationsManager *animationsManager;
- (NSArray<id<RCTComponent>> *)_childrenToRemoveFromContainer:(id<RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices;
@end

@implementation RCTUIManager (Reanimated)
@dynamic animationsManager;
- (void)setAnimationsManager:(REAAnimationsManager *)animationsManager
{
  objc_setAssociatedObject(self, @selector(animationsManager), animationsManager, OBJC_ASSOCIATION_RETAIN);
}
- (id)animationsManager
{
  return objc_getAssociatedObject(self, @selector(animationsManager));
}
@end

@implementation REASwizzledUIManager

std::atomic<uint> isFlushingBlocks;
std::atomic<bool> hasPendingBlocks;

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager
             withAnimationManager:(REAAnimationsManager *)animationsManager
{
  if (self = [super init]) {
    isFlushingBlocks = 0;
    hasPendingBlocks = false;
    [uiManager setAnimationsManager:animationsManager];
    [self swizzleMethods];

    IMP isExecutingUpdatesBatchImpl = imp_implementationWithBlock(^() {
      return hasPendingBlocks || isFlushingBlocks > 0;
    });
    class_addMethod([RCTUIManager class], @selector(isExecutingUpdatesBatch), isExecutingUpdatesBatchImpl, "");
  }
  return self;
}

- (void)swizzleMethods
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [REAUtils swizzleMethod:@selector(uiBlockWithLayoutUpdateForRootView:)
                   forClass:[RCTUIManager class]
                       with:@selector(reanimated_uiBlockWithLayoutUpdateForRootView:)
                  fromClass:[self class]];
    SEL manageChildrenOriginal = @selector
        (_manageChildren:moveFromIndices:moveToIndices:addChildReactTags:addAtIndices:removeAtIndices:registry:);
    SEL manageChildrenReanimated =
        @selector(reanimated_manageChildren:
                            moveFromIndices:moveToIndices:addChildReactTags:addAtIndices:removeAtIndices:registry:);
    [REAUtils swizzleMethod:manageChildrenOriginal
                   forClass:[RCTUIManager class]
                       with:manageChildrenReanimated
                  fromClass:[self class]];
    [REAUtils swizzleMethod:@selector(addUIBlock:)
                   forClass:[RCTUIManager class]
                       with:@selector(reanimated_addUIBlock:)
                  fromClass:[self class]];
    [REAUtils swizzleMethod:@selector(prependUIBlock:)
                   forClass:[RCTUIManager class]
                       with:@selector(reanimated_prependUIBlock:)
                  fromClass:[self class]];
    [REAUtils swizzleMethod:@selector(flushUIBlocksWithCompletion:)
                   forClass:[RCTUIManager class]
                       with:@selector(reanimated_flushUIBlocksWithCompletion:)
                  fromClass:[self class]];
  });
}

- (void)reanimated_manageChildren:(NSNumber *)containerTag
                  moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
                    moveToIndices:(NSArray<NSNumber *> *)moveToIndices
                addChildReactTags:(NSArray<NSNumber *> *)addChildReactTags
                     addAtIndices:(NSArray<NSNumber *> *)addAtIndices
                  removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
                         registry:(NSMutableDictionary<NSNumber *, id<RCTComponent>> *)registry
{
  bool isLayoutAnimationEnabled = reanimated::FeaturesConfig::isLayoutAnimationEnabled();
  id<RCTComponent> container;
  NSArray<id<RCTComponent>> *permanentlyRemovedChildren;
  BOOL containerIsRootOfViewController = NO;
  RCTUIManager *originalSelf = (RCTUIManager *)self;
  if (isLayoutAnimationEnabled) {
    container = registry[containerTag];
    permanentlyRemovedChildren = [originalSelf _childrenToRemoveFromContainer:container atIndices:removeAtIndices];

    if ([container isKindOfClass:[REAUIView class]]) {
      UIViewController *controller = ((REAUIView *)container).reactViewController;
      UIViewController *parentController = ((REAUIView *)container).superview.reactViewController;
      containerIsRootOfViewController = controller != parentController;
    }

    // we check if the container we`re removing from is a root view
    // of some view controller. In that case, we skip running exiting animations
    // in its children, to prevent issues with RN Screens.
    if (containerIsRootOfViewController) {
      NSArray<id<RCTComponent>> *permanentlyRemovedChildren =
          [originalSelf _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
      for (REAUIView *view in permanentlyRemovedChildren) {
        [originalSelf.animationsManager endAnimationsRecursive:view];
        [originalSelf.animationsManager removeAnimationsFromSubtree:view];
      }
      [originalSelf.animationsManager onScreenRemoval:(REAUIView *)permanentlyRemovedChildren[0]
                                                stack:(REAUIView *)container];
    }
  }

  // call original method
  [self reanimated_manageChildren:containerTag
                  moveFromIndices:moveFromIndices
                    moveToIndices:moveToIndices
                addChildReactTags:addChildReactTags
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

  [originalSelf.animationsManager reattachAnimatedChildren:permanentlyRemovedChildren
                                               toContainer:container
                                                 atIndices:removeAtIndices];
}

- (RCTViewManagerUIBlock)reanimated_uiBlockWithLayoutUpdateForRootView:(RCTRootShadowView *)rootShadowView
{
  if (!reanimated::FeaturesConfig::isLayoutAnimationEnabled()) {
    return [self reanimated_uiBlockWithLayoutUpdateForRootView:rootShadowView];
  }

  RCTUIManager *originalSelf = (RCTUIManager *)self;
#if REACT_NATIVE_MINOR_VERSION >= 73
  NSPointerArray *affectedShadowViews = [NSPointerArray weakObjectsPointerArray];
#else
  NSHashTable<RCTShadowView *> *affectedShadowViews = [NSHashTable weakObjectsHashTable];
#endif
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
    RCTDisplayType displayType;
  } RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = affectedShadowViews.count;
  NSMutableArray *reactTags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(RCTFrameData) * count];
  {
    NSUInteger index = 0;
    RCTFrameData *frameDataArray = (RCTFrameData *)framesData.mutableBytes;
    for (RCTShadowView *shadowView in affectedShadowViews) {
      reactTags[index] = shadowView.reactTag;
      RCTLayoutMetrics layoutMetrics = shadowView.layoutMetrics;
      frameDataArray[index++] = (RCTFrameData){
          layoutMetrics.frame,
          layoutMetrics.layoutDirection,
          shadowView.isNewView,
          shadowView.superview.isNewView,
          layoutMetrics.displayType};
    }
  }

  for (RCTShadowView *shadowView in affectedShadowViews) {
    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *reactTag = shadowView.reactTag;

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

    if (RCTIsReactRootView(reactTag) && [shadowView isKindOfClass:[RCTRootShadowView class]]) {
      CGSize contentSize = shadowView.layoutMetrics.frame.size;

      RCTExecuteOnMainQueue(^{
        NSMutableDictionary<NSNumber *, REAUIView *> *viewRegistry = [self valueForKey:@"_viewRegistry"];
        REAUIView *view = viewRegistry[reactTag];
        RCTAssert(view != nil, @"view (for ID %@) not found", reactTag);

        RCTRootView *rootView = (RCTRootView *)[view superview];
        if ([rootView isKindOfClass:[RCTRootView class]]) {
          rootView.intrinsicContentSize = contentSize;
        }
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, REAUIView *> *viewRegistry) {
    const RCTFrameData *frameDataArray = (const RCTFrameData *)framesData.bytes;
    RCTLayoutAnimationGroup *layoutAnimationGroup = [uiManager valueForKey:@"_layoutAnimationGroup"];

    __block NSUInteger completionsCalled = 0;

    NSMutableDictionary<NSNumber *, REASnapshot *> *snapshotsBefore = [NSMutableDictionary dictionary];

    NSInteger index = 0;
    for (NSNumber *reactTag in reactTags) {
      RCTFrameData frameData = frameDataArray[index++];

      REAUIView *view = viewRegistry[reactTag];
      CGRect frame = frameData.frame;

      UIUserInterfaceLayoutDirection layoutDirection = frameData.layoutDirection;
      BOOL isNew = frameData.isNew;
      RCTLayoutAnimation *updatingLayoutAnimation = isNew ? nil : layoutAnimationGroup.updatingLayoutAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      RCTLayoutAnimation *creatingLayoutAnimation =
          shouldAnimateCreation ? layoutAnimationGroup.creatingLayoutAnimation : nil;
      BOOL isHidden = frameData.displayType == RCTDisplayTypeNone;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (layoutAnimationGroup.callback && completionsCalled == count) {
          layoutAnimationGroup.callback(@[ @(finished) ]);

          // It's unsafe to call this callback more than once, so we nil it out here
          // to make sure that doesn't happen.
          layoutAnimationGroup.callback = nil;
        }
      };

      if (view.reactLayoutDirection != layoutDirection) {
        view.reactLayoutDirection = layoutDirection;
      }

      if (view.isHidden != isHidden) {
        view.hidden = isHidden;
      }

      // Reanimated changes /start
      REASnapshot *snapshotBefore =
          isNew ? nil : [originalSelf.animationsManager prepareSnapshotBeforeMountForView:view];
      snapshotsBefore[reactTag] = snapshotBefore;
      // Reanimated changes /end

      if (creatingLayoutAnimation) {
        // Animate view creation
        [view reactSetFrame:frame];

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
          RCTLogError(@"Unsupported layout animation createConfig property %@", creatingLayoutAnimation.property);
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
                [view reactSetFrame:frame];
              }
            withCompletionBlock:completion];

      } else {
        // Update without animation
        [view reactSetFrame:frame];
        completion(YES);
      }
    }

    // Reanimated changes /start
    index = 0;
    for (NSNumber *reactTag in reactTags) {
      RCTFrameData frameData = frameDataArray[index++];
      REAUIView *view = viewRegistry[reactTag];
      BOOL isNew = frameData.isNew;
      CGRect frame = frameData.frame;

      REASnapshot *snapshotBefore = snapshotsBefore[reactTag];

      if (isNew || snapshotBefore != nil) {
        [originalSelf.animationsManager viewDidMount:view withBeforeSnapshot:snapshotBefore withNewFrame:frame];
      }
    }

    // Clean up
    // below line serves as this one uiManager->_layoutAnimationGroup = nil;, because we don't have access to the
    // private field
    [uiManager setValue:nil forKey:@"_layoutAnimationGroup"];

    [originalSelf.animationsManager viewsDidLayout];
    // Reanimated changes /end
  };
}

- (void)reanimated_addUIBlock:(RCTViewManagerUIBlock)block
{
  RCTAssertUIManagerQueue();
  hasPendingBlocks = true;
  [self reanimated_addUIBlock:block];
}

- (void)reanimated_prependUIBlock:(RCTViewManagerUIBlock)block
{
  RCTAssertUIManagerQueue();
  hasPendingBlocks = true;
  [self reanimated_prependUIBlock:block];
}

- (void)reanimated_flushUIBlocksWithCompletion:(void (^)(void))completion
{
  RCTAssertUIManagerQueue();
  if (hasPendingBlocks) {
    ++isFlushingBlocks;
    hasPendingBlocks = false;
    [self reanimated_addUIBlock:^(
              __unused RCTUIManager *manager, __unused NSDictionary<NSNumber *, REAUIView *> *viewRegistry) {
      --isFlushingBlocks;
    }];
  }
  [self reanimated_flushUIBlocksWithCompletion:completion];
}

@end
