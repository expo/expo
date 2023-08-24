#import <RNReanimated/REAAnimationsManager.h>
#import <RNReanimated/REASharedElement.h>
#import <RNReanimated/REASharedTransitionManager.h>
#import <RNReanimated/REAUIManager.h>
#import <React/RCTComponentData.h>
#import <React/RCTTextView.h>
#import <React/UIView+Private.h>
#import <React/UIView+React.h>

typedef NS_ENUM(NSInteger, FrameConfigType) { EnteringFrame, ExitingFrame };

BOOL REANodeFind(id<RCTComponent> view, int (^block)(id<RCTComponent>))
{
  if (!view.reactTag) {
    return NO;
  }

  if (block(view)) {
    return YES;
  }

  for (id<RCTComponent> subview in view.reactSubviews) {
    if (REANodeFind(subview, block)) {
      return YES;
    }
  }

  return NO;
}

@implementation REAAnimationsManager {
  RCTUIManager *_uiManager;
  REAUIManager *_reaUiManager;
  NSMutableSet<NSNumber *> *_enteringViews;
  NSMutableDictionary<NSNumber *, REASnapshot *> *_enteringViewTargetValues;
  NSMutableDictionary<NSNumber *, UIView *> *_exitingViews;
  NSMutableDictionary<NSNumber *, NSNumber *> *_exitingSubviewsCountMap;
  NSMutableDictionary<NSNumber *, NSNumber *> *_exitingParentTags;
  NSMutableSet<NSNumber *> *_ancestorsToRemove;
  NSMutableArray<NSString *> *_targetKeys;
  NSMutableArray<NSString *> *_currentKeys;
  REAAnimationStartingBlock _startAnimationForTag;
  REAHasAnimationBlock _hasAnimationForTag;
  REAAnimationRemovingBlock _clearAnimationConfigForTag;
  REASharedTransitionManager *_sharedTransitionManager;
}

+ (NSArray *)layoutKeys
{
  static NSArray *_array;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _array = @[ @"originX", @"originY", @"width", @"height" ];
  });
  return _array;
}

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager
{
  if (self = [super init]) {
    _uiManager = uiManager;
    _reaUiManager = (REAUIManager *)uiManager;
    _exitingViews = [NSMutableDictionary new];
    _exitingSubviewsCountMap = [NSMutableDictionary new];
    _ancestorsToRemove = [NSMutableSet new];
    _exitingParentTags = [NSMutableDictionary new];
    _enteringViews = [NSMutableSet new];
    _enteringViewTargetValues = [NSMutableDictionary new];

    _targetKeys = [NSMutableArray new];
    _currentKeys = [NSMutableArray new];
    for (NSString *key in [[self class] layoutKeys]) {
      [_targetKeys addObject:[NSString stringWithFormat:@"target%@", [key capitalizedString]]];
      [_currentKeys addObject:[NSString stringWithFormat:@"current%@", [key capitalizedString]]];
    }
    _sharedTransitionManager = [[REASharedTransitionManager alloc] initWithAnimationsManager:self];
  }
  return self;
}

- (void)invalidate
{
  _startAnimationForTag = nil;
  _hasAnimationForTag = nil;
  _uiManager = nil;
  _exitingViews = nil;
  _targetKeys = nil;
  _currentKeys = nil;
}

- (void)setAnimationStartingBlock:(REAAnimationStartingBlock)startAnimation
{
  _startAnimationForTag = startAnimation;
}

- (void)setHasAnimationBlock:(REAHasAnimationBlock)hasAnimation
{
  _hasAnimationForTag = hasAnimation;
}

- (void)setAnimationRemovingBlock:(REAAnimationRemovingBlock)clearAnimation
{
  _clearAnimationConfigForTag = clearAnimation;
}

- (UIView *)viewForTag:(NSNumber *)tag
{
  UIView *view;
  (view = [_reaUiManager viewForReactTag:tag]) || (view = [_exitingViews objectForKey:tag]) ||
      (view = [_sharedTransitionManager getTransitioningView:tag]);
  return view;
}

- (void)endLayoutAnimationForTag:(NSNumber *)tag cancelled:(BOOL)cancelled removeView:(BOOL)removeView
{
  UIView *view = [self viewForTag:tag];

  if (view == nil) {
    return;
  }
  if ([_enteringViews containsObject:tag] && !removeView) {
    REASnapshot *target = _enteringViewTargetValues[tag];
    if (target != nil) {
      [self setNewProps:target.values forView:view];
    }
  }
  [_enteringViews removeObject:tag];
  [_enteringViewTargetValues removeObjectForKey:tag];

  if (removeView) {
    [self endAnimationsRecursive:view];
    [view removeFromSuperview];
  }
  [_sharedTransitionManager finishSharedAnimation:[self viewForTag:tag]];
}

- (void)endAnimationsRecursive:(UIView *)view
{
  NSNumber *tag = [view reactTag];

  if (tag == nil) {
    return;
  }

  // we'll remove this view anyway when exiting from recursion,
  // no need to remove it in `maybeDropAncestors`
  [_ancestorsToRemove removeObject:tag];

  for (UIView *child in [[view subviews] copy]) {
    [self endAnimationsRecursive:child];
  }

  if ([_exitingViews objectForKey:tag]) {
    [_exitingViews removeObjectForKey:tag];
    [self maybeDropAncestors:view];
  }
}

- (void)progressLayoutAnimationWithStyle:(NSDictionary *)newStyle
                                  forTag:(NSNumber *)tag
                      isSharedTransition:(BOOL)isSharedTransition
{
  [self setNewProps:[newStyle mutableCopy] forView:[self viewForTag:tag] convertFromAbsolute:isSharedTransition];
}

- (double)getDoubleOrZero:(NSNumber *)number
{
  double doubleValue = [number doubleValue];
  if (doubleValue != doubleValue) { // NaN != NaN
    return 0;
  }
  return doubleValue;
}

- (void)setNewProps:(NSMutableDictionary *)newProps forView:(UIView *)view
{
  [self setNewProps:newProps forView:view convertFromAbsolute:NO];
}

- (void)setNewProps:(NSMutableDictionary *)newProps forView:(UIView *)view convertFromAbsolute:(BOOL)convertFromAbsolute
{
  if (newProps[@"height"]) {
    double height = [self getDoubleOrZero:newProps[@"height"]];
    double oldHeight = view.bounds.size.height;
    view.bounds = CGRectMake(0, 0, view.bounds.size.width, height);
    view.center = CGPointMake(view.center.x, view.center.y - oldHeight / 2.0 + view.bounds.size.height / 2.0);
    [newProps removeObjectForKey:@"height"];
  }
  if (newProps[@"width"]) {
    double width = [self getDoubleOrZero:newProps[@"width"]];
    double oldWidth = view.bounds.size.width;
    view.bounds = CGRectMake(0, 0, width, view.bounds.size.height);
    view.center = CGPointMake(view.center.x + view.bounds.size.width / 2.0 - oldWidth / 2.0, view.center.y);
    [newProps removeObjectForKey:@"width"];
  }

  bool needsViewPositionUpdate = false;
  double centerX = view.center.x;
  double centerY = view.center.y;
  if (newProps[@"originX"]) {
    needsViewPositionUpdate = true;
    double originX = [self getDoubleOrZero:newProps[@"originX"]];
    [newProps removeObjectForKey:@"originX"];
    centerX = originX + view.bounds.size.width / 2.0;
  }
  if (newProps[@"originY"]) {
    needsViewPositionUpdate = true;
    double originY = [self getDoubleOrZero:newProps[@"originY"]];
    [newProps removeObjectForKey:@"originY"];
    centerY = originY + view.bounds.size.height / 2.0;
  }
  if (needsViewPositionUpdate) {
    CGPoint newCenter = CGPointMake(centerX, centerY);
    if (convertFromAbsolute) {
      UIView *window = UIApplication.sharedApplication.keyWindow;
      CGPoint convertedCenter = [window convertPoint:newCenter toView:view.superview];
      view.center = convertedCenter;
    } else {
      view.center = newCenter;
    }
  }

  if (newProps[@"transformMatrix"]) {
    NSArray *matrix = newProps[@"transformMatrix"];
    CGFloat a = [matrix[0] floatValue];
    CGFloat b = [matrix[1] floatValue];
    CGFloat c = [matrix[3] floatValue];
    CGFloat d = [matrix[4] floatValue];
    CGFloat tx = [matrix[6] floatValue];
    CGFloat ty = [matrix[7] floatValue];
    view.transform = CGAffineTransformMake(a, b, c, d, tx, ty);
    [newProps removeObjectForKey:@"transformMatrix"];
  }

  NSMutableDictionary *componentDataByName = [_uiManager valueForKey:@"_componentDataByName"];
  RCTComponentData *componentData = componentDataByName[@"RCTView"];
  [componentData setProps:newProps forView:view];
}

- (NSDictionary *)prepareDataForAnimatingWorklet:(NSMutableDictionary *)values frameConfig:(FrameConfigType)frameConfig
{
  if (frameConfig == EnteringFrame) {
    NSDictionary *preparedData = @{
      @"targetWidth" : values[@"width"],
      @"targetHeight" : values[@"height"],
      @"targetOriginX" : values[@"originX"],
      @"targetOriginY" : values[@"originY"],
      @"targetGlobalOriginX" : values[@"globalOriginX"],
      @"targetGlobalOriginY" : values[@"globalOriginY"],
      @"windowWidth" : values[@"windowWidth"],
      @"windowHeight" : values[@"windowHeight"]
    };
    return preparedData;
  } else {
    NSDictionary *preparedData = @{
      @"currentWidth" : values[@"width"],
      @"currentHeight" : values[@"height"],
      @"currentOriginX" : values[@"originX"],
      @"currentOriginY" : values[@"originY"],
      @"currentGlobalOriginX" : values[@"globalOriginX"],
      @"currentGlobalOriginY" : values[@"globalOriginY"],
      @"windowWidth" : values[@"windowWidth"],
      @"windowHeight" : values[@"windowHeight"]
    };
    return preparedData;
  }
}

- (NSDictionary *)prepareDataForLayoutAnimatingWorklet:(NSMutableDictionary *)currentValues
                                          targetValues:(NSMutableDictionary *)targetValues
{
  NSMutableDictionary *preparedData = [NSMutableDictionary new];
  preparedData[@"currentWidth"] = currentValues[@"width"];
  preparedData[@"currentHeight"] = currentValues[@"height"];
  preparedData[@"currentOriginX"] = currentValues[@"originX"];
  preparedData[@"currentOriginY"] = currentValues[@"originY"];
  preparedData[@"currentGlobalOriginX"] = currentValues[@"globalOriginX"];
  preparedData[@"currentGlobalOriginY"] = currentValues[@"globalOriginY"];
  preparedData[@"targetWidth"] = targetValues[@"width"];
  preparedData[@"targetHeight"] = targetValues[@"height"];
  preparedData[@"targetOriginX"] = targetValues[@"originX"];
  preparedData[@"targetOriginY"] = targetValues[@"originY"];
  preparedData[@"targetGlobalOriginX"] = targetValues[@"globalOriginX"];
  preparedData[@"targetGlobalOriginY"] = targetValues[@"globalOriginY"];
  preparedData[@"windowWidth"] = currentValues[@"windowWidth"];
  preparedData[@"windowHeight"] = currentValues[@"windowHeight"];
  if (currentValues[@"transformMatrix"] != nil && targetValues[@"transformMatrix"] != nil) {
    preparedData[@"currentTransformMatrix"] = currentValues[@"transformMatrix"];
    preparedData[@"targetTransformMatrix"] = targetValues[@"transformMatrix"];
  }
  return preparedData;
}

- (BOOL)wantsHandleRemovalOfView:(UIView *)view
{
  return REANodeFind(view, ^(id<RCTComponent> view) {
    return [self->_exitingSubviewsCountMap objectForKey:view.reactTag] != nil ||
        self->_hasAnimationForTag(view.reactTag, EXITING);
  });
}

- (void)registerExitingAncestors:(UIView *)child
{
  [self registerExitingAncestors:child exitingSubviewsCount:1];
}

- (void)registerExitingAncestors:(UIView *)child exitingSubviewsCount:(int)exitingSubviewsCount
{
  NSNumber *childTag = child.reactTag;
  UIView *parent = child.superview;

  UIViewController *childController = child.reactViewController;

  // only register ancestors whose `reactViewController` is the same as `child`'s.
  // The idea is that, if a whole ViewController is unmounted, we won't want to run
  // the exiting animation since all the views will disappear immediately anyway
  while (parent != nil && parent.reactViewController == childController &&
         ![parent isKindOfClass:[RCTRootView class]]) {
    NSNumber *parentTag = parent.reactTag;
    if (parentTag != nil) {
      _exitingSubviewsCountMap[parent.reactTag] =
          @([_exitingSubviewsCountMap[parent.reactTag] intValue] + exitingSubviewsCount);
      _exitingParentTags[childTag] = parentTag;
      childTag = parentTag;
    }
    parent = parent.superview;
  }
}

- (void)maybeDropAncestors:(UIView *)child
{
  UIView *parent = child.superview;
  NSNumber *parentTag = _exitingParentTags[child.reactTag];
  [_exitingParentTags removeObjectForKey:child.reactTag];

  while ((parent != nil || parentTag != nil) && ![parent isKindOfClass:[RCTRootView class]]) {
    UIView *view = parent;
    NSNumber *viewTag = parentTag;
    parentTag = _exitingParentTags[viewTag];
    UIView *viewByTag = [self viewForTag:viewTag];
    parent = view.superview;

    if (view == nil) {
      if (viewByTag == nil) {
        // the view was already removed from both native and RN hierarchies
        // we can safely forget that it had any animated children
        [_ancestorsToRemove removeObject:viewTag];
        [_exitingSubviewsCountMap removeObjectForKey:viewTag];
        [_exitingParentTags removeObjectForKey:viewTag];
        continue;
      }
      // the child was dettached from view, but view is still
      // in the native and RN hierarchy
      view = viewByTag;
    }

    if (view.reactTag == nil) {
      // we skip over views with no tag when registering parent tags,
      // so we shouldn't go to the parent of viewTag yet
      parentTag = viewTag;
      continue;
    }

    int trackingCount = [_exitingSubviewsCountMap[view.reactTag] intValue] - 1;
    if (trackingCount <= 0) {
      if ([_ancestorsToRemove containsObject:view.reactTag]) {
        [_ancestorsToRemove removeObject:view.reactTag];
        if (![_exitingViews objectForKey:view.reactTag]) {
          [view removeFromSuperview];
        }
      }
      [_exitingSubviewsCountMap removeObjectForKey:view.reactTag];
      [_exitingParentTags removeObjectForKey:view.reactTag];
    } else {
      _exitingSubviewsCountMap[view.reactTag] = @(trackingCount);
    }
  }
}

- (BOOL)startAnimationsRecursive:(UIView *)view
    shouldRemoveSubviewsWithoutAnimations:(BOOL)shouldRemoveSubviewsWithoutAnimations;
{
  if (!view.reactTag) {
    return NO;
  }

  UIViewController *viewController = view.reactViewController;

  // `startAnimationsRecursive:shouldRemoveSubviewsWithoutAnimations:`
  // is called on a detached view tree, so the `viewController` should be `nil`.
  // If it's not, we're descending into another `UIViewController`.
  // We don't want to run animations inside it (since it causes issues with RNScreens),
  // so instead clean up the subtree and return `NO`.
  if (viewController != nil) {
    [self removeAnimationsFromSubtree:view];
    return NO;
  }

  BOOL hasExitAnimation =
      [self hasAnimationForTag:view.reactTag type:EXITING] || [_exitingViews objectForKey:view.reactTag];
  BOOL hasAnimatedChildren = NO;
  shouldRemoveSubviewsWithoutAnimations = shouldRemoveSubviewsWithoutAnimations && !hasExitAnimation;
  NSMutableArray *toBeRemoved = [[NSMutableArray alloc] init];

  for (UIView *subview in [view.reactSubviews copy]) {
    if ([self startAnimationsRecursive:subview
            shouldRemoveSubviewsWithoutAnimations:shouldRemoveSubviewsWithoutAnimations]) {
      hasAnimatedChildren = YES;
    } else if (shouldRemoveSubviewsWithoutAnimations) {
      [toBeRemoved addObject:subview];
    }
  }

  BOOL wantAnimateExit = hasExitAnimation || hasAnimatedChildren;

  if (!wantAnimateExit) {
    return NO;
  }

  REASnapshot *before;
  if (hasExitAnimation) {
    before = [[REASnapshot alloc] init:view];
  }

  // start exit animation
  if (hasExitAnimation && ![_exitingViews objectForKey:view.reactTag]) {
    NSDictionary *preparedValues = [self prepareDataForAnimatingWorklet:before.values frameConfig:ExitingFrame];
    [_exitingViews setObject:view forKey:view.reactTag];
    [self registerExitingAncestors:view];
    _startAnimationForTag(view.reactTag, EXITING, preparedValues, @(0));
  }

  if (hasAnimatedChildren) {
    [_ancestorsToRemove addObject:view.reactTag];
  }

  for (UIView *child in toBeRemoved) {
    [view removeReactSubview:child];
  }

  // NOTE: even though this view is still visible,
  // since it's removed from the React tree, we won't
  // start new animations for it, and might as well remove
  // the layout animation config now
  _clearAnimationConfigForTag(view.reactTag);

  // we don't want user interaction on exiting views
  view.userInteractionEnabled = NO;

  return YES;
}

- (void)reattachAnimatedChildren:(NSArray<id<RCTComponent>> *)children
                     toContainer:(id<RCTComponent>)container
                       atIndices:(NSArray<NSNumber *> *)indices
{
  if (![container isKindOfClass:[UIView class]]) {
    return;
  }

  // since we reattach only some of the views,
  // we count the views we DIDN'T reattach
  // and shift later views' indices by that number
  // to make sure they appear at correct relative posisitons
  // in the `subviews` array
  int skippedViewsCount = 0;

  for (int i = 0; i < children.count; i++) {
    id<RCTComponent> child = children[i];
    if (![child isKindOfClass:[UIView class]]) {
      skippedViewsCount++;
      continue;
    }
    UIView *childView = (UIView *)child;
    NSNumber *originalIndex = indices[i];
    if ([self startAnimationsRecursive:childView shouldRemoveSubviewsWithoutAnimations:YES]) {
      [(UIView *)container insertSubview:childView atIndex:[originalIndex intValue] - skippedViewsCount];
      int exitingSubviewsCount = [_exitingSubviewsCountMap[childView.reactTag] intValue];
      if ([_exitingViews objectForKey:childView.reactTag] != nil) {
        exitingSubviewsCount++;
      }
      [self registerExitingAncestors:childView exitingSubviewsCount:exitingSubviewsCount];
    } else {
      skippedViewsCount++;
    }
  }
}

- (void)onViewCreate:(UIView *)view after:(REASnapshot *)after
{
  NSMutableDictionary *targetValues = after.values;
  NSDictionary *preparedValues = [self prepareDataForAnimatingWorklet:targetValues frameConfig:EnteringFrame];
  [_enteringViews addObject:view.reactTag];
  _startAnimationForTag(view.reactTag, ENTERING, preparedValues, @(0));
}

- (void)onViewUpdate:(UIView *)view before:(REASnapshot *)before after:(REASnapshot *)after
{
  NSMutableDictionary *targetValues = after.values;
  NSMutableDictionary *currentValues = before.values;

  NSDictionary *preparedValues = [self prepareDataForLayoutAnimatingWorklet:currentValues targetValues:targetValues];
  _startAnimationForTag(view.reactTag, LAYOUT, preparedValues, @(0));
}

- (REASnapshot *)prepareSnapshotBeforeMountForView:(UIView *)view
{
  return [[REASnapshot alloc] init:view];
}

- (void)removeAnimationsFromSubtree:(UIView *)view
{
  REANodeFind(view, ^int(id<RCTComponent> view) {
    if (!self->_hasAnimationForTag(view.reactTag, SHARED_ELEMENT_TRANSITION)) {
      self->_clearAnimationConfigForTag(view.reactTag);
    }
    return false;
  });
}

- (void)viewDidMount:(UIView *)view withBeforeSnapshot:(nonnull REASnapshot *)before withNewFrame:(CGRect)frame
{
  LayoutAnimationType type = before == nil ? ENTERING : LAYOUT;
  NSNumber *viewTag = view.reactTag;
  if (_hasAnimationForTag(viewTag, type)) {
    REASnapshot *after = [[REASnapshot alloc] init:view];
    if (before == nil) {
      [self onViewCreate:view after:after];
    } else {
      [self onViewUpdate:view before:before after:after];
    }
  } else if (type == LAYOUT && [_enteringViews containsObject:[view reactTag]]) {
    _enteringViewTargetValues[[view reactTag]] = [[REASnapshot alloc] init:view];
    [self setNewProps:before.values forView:view];
  }

  if (_hasAnimationForTag(viewTag, SHARED_ELEMENT_TRANSITION)) {
    if (type == ENTERING) {
      [_sharedTransitionManager notifyAboutNewView:view];
    } else {
      [_sharedTransitionManager notifyAboutViewLayout:view withViewFrame:frame];
    }
  }
}

- (void)viewsDidLayout
{
  [_sharedTransitionManager viewsDidLayout];
}

- (void)setFindPrecedingViewTagForTransitionBlock:
    (REAFindPrecedingViewTagForTransitionBlock)findPrecedingViewTagForTransition
{
  [_sharedTransitionManager setFindPrecedingViewTagForTransitionBlock:findPrecedingViewTagForTransition];
}

- (void)setCancelAnimationBlock:(REACancelAnimationBlock)animationCancellingBlock
{
  [_sharedTransitionManager setCancelAnimationBlock:animationCancellingBlock];
}

- (BOOL)hasAnimationForTag:(NSNumber *)tag type:(LayoutAnimationType)type
{
  if (!_hasAnimationForTag) {
    // It can happen during reload.
    return NO;
  }
  return _hasAnimationForTag(tag, type);
}

- (void)clearAnimationConfigForTag:(NSNumber *)tag
{
  _clearAnimationConfigForTag(tag);
}

- (void)startAnimationForTag:(NSNumber *)tag
                        type:(LayoutAnimationType)type
                  yogaValues:(NSDictionary *)yogaValues
                       depth:(NSNumber *)depth;
{
  _startAnimationForTag(tag, type, yogaValues, depth);
}

@end
