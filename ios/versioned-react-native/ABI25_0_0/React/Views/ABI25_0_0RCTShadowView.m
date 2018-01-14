/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTShadowView.h"

#import "ABI25_0_0RCTConvert.h"
#import "ABI25_0_0RCTLog.h"
#import "ABI25_0_0RCTUtils.h"
#import "ABI25_0_0UIView+Private.h"
#import "UIView+ReactABI25_0_0.h"
#import "ABI25_0_0RCTI18nUtil.h"

typedef void (^ABI25_0_0RCTActionBlock)(ABI25_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI25_0_0RCTResetActionBlock)(ABI25_0_0RCTShadowView *shadowViewSelf);

static NSString *const ABI25_0_0RCTBackgroundColorProp = @"backgroundColor";

typedef NS_ENUM(unsigned int, meta_prop_t) {
  META_PROP_LEFT,
  META_PROP_TOP,
  META_PROP_RIGHT,
  META_PROP_BOTTOM,
  META_PROP_START,
  META_PROP_END,
  META_PROP_HORIZONTAL,
  META_PROP_VERTICAL,
  META_PROP_ALL,
  META_PROP_COUNT,
};

@implementation ABI25_0_0RCTShadowView
{
  ABI25_0_0RCTUpdateLifecycle _propagationLifecycle;
  ABI25_0_0RCTUpdateLifecycle _textLifecycle;
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI25_0_0RCTShadowView *> *_ReactABI25_0_0Subviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  BOOL _didUpdateSubviews;
  ABI25_0_0YGValue _paddingMetaProps[META_PROP_COUNT];
  ABI25_0_0YGValue _marginMetaProps[META_PROP_COUNT];
  ABI25_0_0YGValue _borderMetaProps[META_PROP_COUNT];
}

+ (ABI25_0_0YGConfigRef)yogaConfig
{
  static ABI25_0_0YGConfigRef yogaConfig;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    yogaConfig = ABI25_0_0YGConfigNew();
    // Turnig off pixel rounding.
    ABI25_0_0YGConfigSetPointScaleFactor(yogaConfig, 0.0);
    ABI25_0_0YGConfigSetUseLegacyStretchBehaviour(yogaConfig, true);
  });
  return yogaConfig;
}

@synthesize ReactABI25_0_0Tag = _ReactABI25_0_0Tag;

// YogaNode API

static void ABI25_0_0RCTPrint(ABI25_0_0YGNodeRef node)
{
  ABI25_0_0RCTShadowView *shadowView = (__bridge ABI25_0_0RCTShadowView *)ABI25_0_0YGNodeGetContext(node);
  printf("%s(%lld), ", shadowView.viewName.UTF8String, (long long)shadowView.ReactABI25_0_0Tag.integerValue);
}

#define ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(ygvalue, setter, ...)    \
switch (ygvalue.unit) {                          \
  case ABI25_0_0YGUnitAuto:                               \
  case ABI25_0_0YGUnitUndefined:                          \
    setter(__VA_ARGS__, ABI25_0_0YGUndefined);            \
    break;                                       \
  case ABI25_0_0YGUnitPoint:                              \
    setter(__VA_ARGS__, ygvalue.value);          \
    break;                                       \
  case ABI25_0_0YGUnitPercent:                            \
    setter##Percent(__VA_ARGS__, ygvalue.value); \
    break;                                       \
}

#define ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(ygvalue, setter, ...) \
switch (ygvalue.unit) {                            \
  case ABI25_0_0YGUnitAuto:                                 \
    setter##Auto(__VA_ARGS__);                     \
    break;                                         \
  case ABI25_0_0YGUnitUndefined:                            \
    setter(__VA_ARGS__, ABI25_0_0YGUndefined);              \
    break;                                         \
  case ABI25_0_0YGUnitPoint:                                \
    setter(__VA_ARGS__, ygvalue.value);            \
    break;                                         \
  case ABI25_0_0YGUnitPercent:                              \
    setter##Percent(__VA_ARGS__, ygvalue.value);   \
    break;                                         \
}

static void ABI25_0_0RCTProcessMetaPropsPadding(const ABI25_0_0YGValue metaProps[META_PROP_COUNT], ABI25_0_0YGNodeRef node) {
  if (![[ABI25_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(metaProps[META_PROP_START], ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeStart);
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(metaProps[META_PROP_END], ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeEnd);
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(metaProps[META_PROP_LEFT], ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeLeft);
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(metaProps[META_PROP_RIGHT], ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeRight);
  } else {
    ABI25_0_0YGValue start = metaProps[META_PROP_START].unit == ABI25_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI25_0_0YGValue end = metaProps[META_PROP_END].unit == ABI25_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(start, ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeStart);
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(end, ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeEnd);
  }
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(metaProps[META_PROP_TOP], ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeTop);
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(metaProps[META_PROP_BOTTOM], ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeBottom);
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(metaProps[META_PROP_HORIZONTAL], ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeHorizontal);
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(metaProps[META_PROP_VERTICAL], ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeVertical);
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(metaProps[META_PROP_ALL], ABI25_0_0YGNodeStyleSetPadding, node, ABI25_0_0YGEdgeAll);
}

static void ABI25_0_0RCTProcessMetaPropsMargin(const ABI25_0_0YGValue metaProps[META_PROP_COUNT], ABI25_0_0YGNodeRef node) {
  if (![[ABI25_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(metaProps[META_PROP_START], ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeStart);
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(metaProps[META_PROP_END], ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeEnd);
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(metaProps[META_PROP_LEFT], ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeLeft);
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(metaProps[META_PROP_RIGHT], ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeRight);
  } else {
    ABI25_0_0YGValue start = metaProps[META_PROP_START].unit == ABI25_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI25_0_0YGValue end = metaProps[META_PROP_END].unit == ABI25_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(start, ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeStart);
    ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(end, ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeEnd);
  }
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(metaProps[META_PROP_TOP], ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeTop);
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(metaProps[META_PROP_BOTTOM], ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeBottom);
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(metaProps[META_PROP_HORIZONTAL], ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeHorizontal);
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(metaProps[META_PROP_VERTICAL], ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeVertical);
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(metaProps[META_PROP_ALL], ABI25_0_0YGNodeStyleSetMargin, node, ABI25_0_0YGEdgeAll);
}

static void ABI25_0_0RCTProcessMetaPropsBorder(const ABI25_0_0YGValue metaProps[META_PROP_COUNT], ABI25_0_0YGNodeRef node) {
  if (![[ABI25_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeStart, metaProps[META_PROP_START].value);
    ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeEnd, metaProps[META_PROP_END].value);
    ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeLeft, metaProps[META_PROP_LEFT].value);
    ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeRight, metaProps[META_PROP_RIGHT].value);
  } else {
    const float start = ABI25_0_0YGFloatIsUndefined(metaProps[META_PROP_START].value) ? metaProps[META_PROP_LEFT].value : metaProps[META_PROP_START].value;
    const float end = ABI25_0_0YGFloatIsUndefined(metaProps[META_PROP_END].value) ? metaProps[META_PROP_RIGHT].value : metaProps[META_PROP_END].value;
    ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeStart, start);
    ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeEnd, end);
  }
  ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeTop, metaProps[META_PROP_TOP].value);
  ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  ABI25_0_0YGNodeStyleSetBorder(node, ABI25_0_0YGEdgeAll, metaProps[META_PROP_ALL].value);
}

// The absolute stuff is so that we can take into account our absolute position when rounding in order to
// snap to the pixel grid. For example, say you have the following structure:
//
// +--------+---------+--------+
// |        |+-------+|        |
// |        ||       ||        |
// |        |+-------+|        |
// +--------+---------+--------+
//
// Say the screen width is 320 pts so the three big views will get the following x bounds from our layout system:
// {0, 106.667}, {106.667, 213.333}, {213.333, 320}
//
// Assuming screen scale is 2, these numbers must be rounded to the nearest 0.5 to fit the pixel grid:
// {0, 106.5}, {106.5, 213.5}, {213.5, 320}
// You'll notice that the three widths are 106.5, 107, 106.5.
//
// This is great for the parent views but it gets trickier when we consider rounding for the subview.
//
// When we go to round the bounds for the subview in the middle, it's relative bounds are {0, 106.667}
// which gets rounded to {0, 106.5}. This will cause the subview to be one pixel smaller than it should be.
// this is why we need to pass in the absolute position in order to do the rounding relative to the screen's
// grid rather than the view's grid.
//
// After passing in the absolutePosition of {106.667, y}, we do the following calculations:
// absoluteLeft = round(absolutePosition.x + viewPosition.left) = round(106.667 + 0) = 106.5
// absoluteRight = round(absolutePosition.x + viewPosition.left + viewSize.left) + round(106.667 + 0 + 106.667) = 213.5
// width = 213.5 - 106.5 = 107
// You'll notice that this is the same width we calculated for the parent view because we've taken its position into account.

- (void)applyLayoutNode:(ABI25_0_0YGNodeRef)node
      viewsWithNewFrame:(NSMutableSet<ABI25_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  if (!ABI25_0_0YGNodeGetHasNewLayout(node)) {
    return;
  }

  ABI25_0_0RCTAssert(!ABI25_0_0YGNodeIsDirty(node), @"Attempt to get layout metrics from dirtied Yoga node.");

  ABI25_0_0YGNodeSetHasNewLayout(node, false);

  if (ABI25_0_0YGNodeStyleGetDisplay(node) == ABI25_0_0YGDisplayNone) {
    // If the node is hidden (has `display: none;`), its (and its descendants)
    // layout metrics are invalid and/or dirtied, so we have to stop here.
    return;
  }

#if ABI25_0_0RCT_DEBUG
  // This works around a breaking change in Yoga layout where setting flexBasis needs to be set explicitly, instead of relying on flex to propagate.
  // We check for it by seeing if a width/height is provided along with a flexBasis of 0 and the width/height is laid out as 0.
  if (ABI25_0_0YGNodeStyleGetFlexBasis(node).unit == ABI25_0_0YGUnitPoint && ABI25_0_0YGNodeStyleGetFlexBasis(node).value == 0 &&
      ((ABI25_0_0YGNodeStyleGetWidth(node).unit == ABI25_0_0YGUnitPoint && ABI25_0_0YGNodeStyleGetWidth(node).value > 0 && ABI25_0_0YGNodeLayoutGetWidth(node) == 0) ||
      (ABI25_0_0YGNodeStyleGetHeight(node).unit == ABI25_0_0YGUnitPoint && ABI25_0_0YGNodeStyleGetHeight(node).value > 0 && ABI25_0_0YGNodeLayoutGetHeight(node) == 0))) {
    ABI25_0_0RCTLogError(@"View was rendered with explicitly set width/height but with a 0 flexBasis. (This might be fixed by changing flex: to flexGrow:) View: %@", self);
  }
#endif

  CGPoint absoluteTopLeft = {
    absolutePosition.x + ABI25_0_0YGNodeLayoutGetLeft(node),
    absolutePosition.y + ABI25_0_0YGNodeLayoutGetTop(node)
  };

  CGPoint absoluteBottomRight = {
    absolutePosition.x + ABI25_0_0YGNodeLayoutGetLeft(node) + ABI25_0_0YGNodeLayoutGetWidth(node),
    absolutePosition.y + ABI25_0_0YGNodeLayoutGetTop(node) + ABI25_0_0YGNodeLayoutGetHeight(node)
  };

  CGRect frame = {{
    ABI25_0_0RCTRoundPixelValue(ABI25_0_0YGNodeLayoutGetLeft(node)),
    ABI25_0_0RCTRoundPixelValue(ABI25_0_0YGNodeLayoutGetTop(node)),
  }, {
    ABI25_0_0RCTRoundPixelValue(absoluteBottomRight.x - absoluteTopLeft.x),
    ABI25_0_0RCTRoundPixelValue(absoluteBottomRight.y - absoluteTopLeft.y)
  }};

  // Even if `ABI25_0_0YGNodeLayoutGetDirection` can return `ABI25_0_0YGDirectionInherit` here, it actually means
  // that Yoga will use LTR layout for the view (even if layout process is not finished yet).
  UIUserInterfaceLayoutDirection updatedLayoutDirection = ABI25_0_0YGNodeLayoutGetDirection(_yogaNode) == ABI25_0_0YGDirectionRTL ? UIUserInterfaceLayoutDirectionRightToLeft : UIUserInterfaceLayoutDirectionLeftToRight;

  if (!CGRectEqualToRect(frame, _frame) || _layoutDirection != updatedLayoutDirection) {
    _frame = frame;
    _layoutDirection = updatedLayoutDirection;
    [viewsWithNewFrame addObject:self];
  }

  absolutePosition.x += ABI25_0_0YGNodeLayoutGetLeft(node);
  absolutePosition.y += ABI25_0_0YGNodeLayoutGetTop(node);

  [self applyLayoutToChildren:node viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
}

- (void)applyLayoutToChildren:(ABI25_0_0YGNodeRef)node
            viewsWithNewFrame:(NSMutableSet<ABI25_0_0RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition
{
  for (unsigned int i = 0; i < ABI25_0_0YGNodeGetChildCount(node); ++i) {
    ABI25_0_0RCTShadowView *child = (ABI25_0_0RCTShadowView *)_ReactABI25_0_0Subviews[i];
    [child applyLayoutNode:ABI25_0_0YGNodeGetChild(node, i)
         viewsWithNewFrame:viewsWithNewFrame
          absolutePosition:absolutePosition];
  }
}

- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<ABI25_0_0RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  // TODO: we always refresh all propagated properties when propagation is
  // dirtied, but really we should track which properties have changed and
  // only update those.

  if (_didUpdateSubviews) {
    _didUpdateSubviews = NO;
    [self didUpdateReactABI25_0_0Subviews];
    [applierBlocks addObject:^(NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      UIView *view = viewRegistry[self->_ReactABI25_0_0Tag];
      [view didUpdateReactABI25_0_0Subviews];
    }];
  }

  if (!_backgroundColor) {
    UIColor *parentBackgroundColor = parentProperties[ABI25_0_0RCTBackgroundColorProp];
    if (parentBackgroundColor) {
      [applierBlocks addObject:^(NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[self->_ReactABI25_0_0Tag];
        [view ReactABI25_0_0SetInheritedBackgroundColor:parentBackgroundColor];
      }];
    }
  } else {
    // Update parent properties for children
    NSMutableDictionary<NSString *, id> *properties = [NSMutableDictionary dictionaryWithDictionary:parentProperties];
    CGFloat alpha = CGColorGetAlpha(_backgroundColor.CGColor);
    if (alpha < 1.0) {
      // If bg is non-opaque, don't propagate further
      properties[ABI25_0_0RCTBackgroundColorProp] = [UIColor clearColor];
    } else {
      properties[ABI25_0_0RCTBackgroundColorProp] = _backgroundColor;
    }
    return properties;
  }
  return parentProperties;
}

- (void)collectUpdatedProperties:(NSMutableSet<ABI25_0_0RCTApplierBlock> *)applierBlocks
                parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  if (_propagationLifecycle == ABI25_0_0RCTUpdateLifecycleComputed && [parentProperties isEqualToDictionary:_lastParentProperties]) {
    return;
  }
  _propagationLifecycle = ABI25_0_0RCTUpdateLifecycleComputed;
  _lastParentProperties = parentProperties;
  NSDictionary<NSString *, id> *nextProps = [self processUpdatedProperties:applierBlocks parentProperties:parentProperties];
  for (ABI25_0_0RCTShadowView *child in _ReactABI25_0_0Subviews) {
    [child collectUpdatedProperties:applierBlocks parentProperties:nextProps];
  }
}

- (void)collectUpdatedFrames:(NSMutableSet<ABI25_0_0RCTShadowView *> *)viewsWithNewFrame
                   withFrame:(CGRect)frame
                      hidden:(BOOL)hidden
            absolutePosition:(CGPoint)absolutePosition
{
  // This is not the core layout method. It is only used by ABI25_0_0RCTShadowText to layout
  // nested views.

  if (_hidden != hidden) {
    // The hidden state has changed. Even if the frame hasn't changed, add
    // this ShadowView to viewsWithNewFrame so the UIManager will process
    // this ShadowView's UIView and update its hidden state.
    _hidden = hidden;
    [viewsWithNewFrame addObject:self];
  }

  if (!CGRectEqualToRect(frame, _frame)) {
    ABI25_0_0YGNodeStyleSetPositionType(_yogaNode, ABI25_0_0YGPositionTypeAbsolute);
    ABI25_0_0YGNodeStyleSetWidth(_yogaNode, frame.size.width);
    ABI25_0_0YGNodeStyleSetHeight(_yogaNode, frame.size.height);
    ABI25_0_0YGNodeStyleSetPosition(_yogaNode, ABI25_0_0YGEdgeLeft, frame.origin.x);
    ABI25_0_0YGNodeStyleSetPosition(_yogaNode, ABI25_0_0YGEdgeTop, frame.origin.y);
  }

  ABI25_0_0YGNodeCalculateLayout(_yogaNode, frame.size.width, frame.size.height, ABI25_0_0YGDirectionInherit);
  [self applyLayoutNode:_yogaNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI25_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  ABI25_0_0RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    offset.x += shadowView.frame.origin.x;
    offset.y += shadowView.frame.origin.y;
    shadowView = shadowView->_superview;
    depth--;
  }
  if (ancestor != shadowView) {
    return CGRectNull;
  }
  return (CGRect){offset, self.frame.size};
}

- (BOOL)viewIsDescendantOf:(ABI25_0_0RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  ABI25_0_0RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    shadowView = shadowView->_superview;
    depth--;
  }
  return ancestor == shadowView;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _frame = CGRectMake(0, 0, ABI25_0_0YGUndefined, ABI25_0_0YGUndefined);

    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = ABI25_0_0YGValueUndefined;
      _marginMetaProps[ii] = ABI25_0_0YGValueUndefined;
      _borderMetaProps[ii] = ABI25_0_0YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;
    _propagationLifecycle = ABI25_0_0RCTUpdateLifecycleUninitialized;
    _textLifecycle = ABI25_0_0RCTUpdateLifecycleUninitialized;

    _ReactABI25_0_0Subviews = [NSMutableArray array];

    _yogaNode = ABI25_0_0YGNodeNewWithConfig([[self class] yogaConfig]);
    ABI25_0_0YGNodeSetContext(_yogaNode, (__bridge void *)self);
    ABI25_0_0YGNodeSetPrintFunc(_yogaNode, ABI25_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isReactABI25_0_0RootView
{
  return ABI25_0_0RCTIsReactABI25_0_0RootView(self.ReactABI25_0_0Tag);
}

- (void)dealloc
{
  ABI25_0_0YGNodeFree(_yogaNode);
}

- (BOOL)canHaveSubviews
{
  return YES;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)dirtyPropagation
{
  if (_propagationLifecycle != ABI25_0_0RCTUpdateLifecycleDirtied) {
    _propagationLifecycle = ABI25_0_0RCTUpdateLifecycleDirtied;
    [_superview dirtyPropagation];
  }
}

- (BOOL)isPropagationDirty
{
  return _propagationLifecycle != ABI25_0_0RCTUpdateLifecycleComputed;
}

- (void)dirtyText
{
  if (_textLifecycle != ABI25_0_0RCTUpdateLifecycleDirtied) {
    _textLifecycle = ABI25_0_0RCTUpdateLifecycleDirtied;
    [_superview dirtyText];
  }
}

- (BOOL)isTextDirty
{
  return _textLifecycle != ABI25_0_0RCTUpdateLifecycleComputed;
}

- (void)setTextComputed
{
  _textLifecycle = ABI25_0_0RCTUpdateLifecycleComputed;
}

- (void)insertReactABI25_0_0Subview:(ABI25_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  ABI25_0_0RCTAssert(self.canHaveSubviews, @"Attempt to insert subview inside leaf view.");

  [_ReactABI25_0_0Subviews insertObject:subview atIndex:atIndex];
  if (![self isYogaLeafNode]) {
    ABI25_0_0YGNodeInsertChild(_yogaNode, subview.yogaNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
  _didUpdateSubviews = YES;
  [self dirtyText];
  [self dirtyPropagation];
}

- (void)removeReactABI25_0_0Subview:(ABI25_0_0RCTShadowView *)subview
{
  [subview dirtyText];
  [subview dirtyPropagation];
  _didUpdateSubviews = YES;
  subview->_superview = nil;
  [_ReactABI25_0_0Subviews removeObject:subview];
  if (![self isYogaLeafNode]) {
    ABI25_0_0YGNodeRemoveChild(_yogaNode, subview.yogaNode);
  }
}

- (NSArray<ABI25_0_0RCTShadowView *> *)ReactABI25_0_0Subviews
{
  return _ReactABI25_0_0Subviews;
}

- (ABI25_0_0RCTShadowView *)ReactABI25_0_0Superview
{
  return _superview;
}

- (NSNumber *)ReactABI25_0_0TagAtPoint:(CGPoint)point
{
  for (ABI25_0_0RCTShadowView *shadowView in _ReactABI25_0_0Subviews) {
    if (CGRectContainsPoint(shadowView.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ReactABI25_0_0TagAtPoint:relativePoint];
    }
  }
  return self.ReactABI25_0_0Tag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; ReactABI25_0_0Tag: %@; frame: %@>", self.viewName, self.ReactABI25_0_0Tag, NSStringFromCGRect(self.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI25_0_0RCTShadowView *subview in _ReactABI25_0_0Subviews) {
    [subview addRecursiveDescriptionToString:string atLevel:level + 1];
  }
}

- (NSString *)recursiveDescription
{
  NSMutableString *description = [NSMutableString string];
  [self addRecursiveDescriptionToString:description atLevel:0];
  return description;
}

// Margin

#define ABI25_0_0RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(ABI25_0_0YGValue)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (ABI25_0_0YGValue)margin##prop                           \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

ABI25_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI25_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI25_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI25_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI25_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI25_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI25_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)
ABI25_0_0RCT_MARGIN_PROPERTY(Start, START)
ABI25_0_0RCT_MARGIN_PROPERTY(End, END)

// Padding

#define ABI25_0_0RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(ABI25_0_0YGValue)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (ABI25_0_0YGValue)padding##prop                           \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

ABI25_0_0RCT_PADDING_PROPERTY(, ALL)
ABI25_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI25_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI25_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI25_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI25_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI25_0_0RCT_PADDING_PROPERTY(Right, RIGHT)
ABI25_0_0RCT_PADDING_PROPERTY(Start, START)
ABI25_0_0RCT_PADDING_PROPERTY(End, END)

// Border

#define ABI25_0_0RCT_BORDER_PROPERTY(prop, metaProp)             \
- (void)setBorder##prop##Width:(float)value             \
{                                                       \
  _borderMetaProps[META_PROP_##metaProp].value = value; \
  _recomputeBorder = YES;                               \
}                                                       \
- (float)border##prop##Width                            \
{                                                       \
  return _borderMetaProps[META_PROP_##metaProp].value;  \
}

ABI25_0_0RCT_BORDER_PROPERTY(, ALL)
ABI25_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI25_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI25_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI25_0_0RCT_BORDER_PROPERTY(Right, RIGHT)
ABI25_0_0RCT_BORDER_PROPERTY(Start, START)
ABI25_0_0RCT_BORDER_PROPERTY(End, END)

// Dimensions
#define ABI25_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(ABI25_0_0YGValue)value                                 \
{                                                                   \
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(value, ABI25_0_0YGNodeStyleSet##cssProp, _yogaNode);  \
  [self dirtyText];                                                 \
}                                                                   \
- (ABI25_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI25_0_0YGNodeStyleGet##cssProp(_yogaNode);                        \
}

#define ABI25_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(setProp, getProp, cssProp)   \
- (void)set##setProp:(ABI25_0_0YGValue)value                                 \
{                                                                   \
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(value, ABI25_0_0YGNodeStyleSet##cssProp, _yogaNode);       \
  [self dirtyText];                                                 \
}                                                                   \
- (ABI25_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI25_0_0YGNodeStyleGet##cssProp(_yogaNode);                        \
}

ABI25_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI25_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI25_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI25_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI25_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI25_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI25_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(ABI25_0_0YGValue)value                                 \
{                                                                   \
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(value, ABI25_0_0YGNodeStyleSetPosition, _yogaNode, edge);  \
  [self dirtyText];                                                 \
}                                                                   \
- (ABI25_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI25_0_0YGNodeStyleGetPosition(_yogaNode, edge);                   \
}


ABI25_0_0RCT_POSITION_PROPERTY(Top, top, ABI25_0_0YGEdgeTop)
ABI25_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI25_0_0YGEdgeBottom)
ABI25_0_0RCT_POSITION_PROPERTY(Start, start, ABI25_0_0YGEdgeStart)
ABI25_0_0RCT_POSITION_PROPERTY(End, end, ABI25_0_0YGEdgeEnd)

- (void)setLeft:(ABI25_0_0YGValue)value
{
  ABI25_0_0YGEdge edge = [[ABI25_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI25_0_0YGEdgeStart : ABI25_0_0YGEdgeLeft;
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(value, ABI25_0_0YGNodeStyleSetPosition, _yogaNode, edge);
  [self dirtyText];
}
- (ABI25_0_0YGValue)left
{
  ABI25_0_0YGEdge edge = [[ABI25_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI25_0_0YGEdgeStart : ABI25_0_0YGEdgeLeft;
  return ABI25_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

- (void)setRight:(ABI25_0_0YGValue)value
{
  ABI25_0_0YGEdge edge = [[ABI25_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI25_0_0YGEdgeEnd : ABI25_0_0YGEdgeRight;
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE(value, ABI25_0_0YGNodeStyleSetPosition, _yogaNode, edge);
  [self dirtyText];
}
- (ABI25_0_0YGValue)right
{
  ABI25_0_0YGEdge edge = [[ABI25_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI25_0_0YGEdgeEnd : ABI25_0_0YGEdgeRight;
  return ABI25_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

// Size

- (CGSize)size
{
  ABI25_0_0YGValue width = ABI25_0_0YGNodeStyleGetWidth(_yogaNode);
  ABI25_0_0YGValue height = ABI25_0_0YGNodeStyleGetHeight(_yogaNode);

  return CGSizeMake(
    width.unit == ABI25_0_0YGUnitPoint ? width.value : NAN,
    height.unit == ABI25_0_0YGUnitPoint ? height.value : NAN
  );
}

- (void)setSize:(CGSize)size
{
  ABI25_0_0YGNodeStyleSetWidth(_yogaNode, size.width);
  ABI25_0_0YGNodeStyleSetHeight(_yogaNode, size.height);
}

// IntrinsicContentSize

static inline ABI25_0_0YGSize ABI25_0_0RCTShadowViewMeasure(ABI25_0_0YGNodeRef node, float width, ABI25_0_0YGMeasureMode widthMode, float height, ABI25_0_0YGMeasureMode heightMode)
{
  ABI25_0_0RCTShadowView *shadowView = (__bridge ABI25_0_0RCTShadowView *)ABI25_0_0YGNodeGetContext(node);

  CGSize intrinsicContentSize = shadowView->_intrinsicContentSize;
  // Replace `UIViewNoIntrinsicMetric` (which equals `-1`) with zero.
  intrinsicContentSize.width = MAX(0, intrinsicContentSize.width);
  intrinsicContentSize.height = MAX(0, intrinsicContentSize.height);

  ABI25_0_0YGSize result;

  switch (widthMode) {
    case ABI25_0_0YGMeasureModeUndefined:
      result.width = intrinsicContentSize.width;
      break;
    case ABI25_0_0YGMeasureModeExactly:
      result.width = width;
      break;
    case ABI25_0_0YGMeasureModeAtMost:
      result.width = MIN(width, intrinsicContentSize.width);
      break;
  }

  switch (heightMode) {
    case ABI25_0_0YGMeasureModeUndefined:
      result.height = intrinsicContentSize.height;
      break;
    case ABI25_0_0YGMeasureModeExactly:
      result.height = height;
      break;
    case ABI25_0_0YGMeasureModeAtMost:
      result.height = MIN(height, intrinsicContentSize.height);
      break;
  }

  return result;
}

- (void)setIntrinsicContentSize:(CGSize)intrinsicContentSize
{
  if (CGSizeEqualToSize(_intrinsicContentSize, intrinsicContentSize)) {
    return;
  }

  _intrinsicContentSize = intrinsicContentSize;

  if (CGSizeEqualToSize(_intrinsicContentSize, CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric))) {
    ABI25_0_0YGNodeSetMeasureFunc(_yogaNode, NULL);
  } else {
    ABI25_0_0YGNodeSetMeasureFunc(_yogaNode, ABI25_0_0RCTShadowViewMeasure);
  }

  ABI25_0_0YGNodeMarkDirty(_yogaNode);
}

// Local Data

- (void)setLocalData:(__unused NSObject *)localData
{
  // Do nothing by default.
}

// Flex

- (void)setFlexBasis:(ABI25_0_0YGValue)value
{
  ABI25_0_0RCT_SET_ABI25_0_0YGVALUE_AUTO(value, ABI25_0_0YGNodeStyleSetFlexBasis, _yogaNode);
}

- (ABI25_0_0YGValue)flexBasis
{
  return ABI25_0_0YGNodeStyleGetFlexBasis(_yogaNode);
}

#define ABI25_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  ABI25_0_0YGNodeStyleSet##cssProp(_yogaNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return ABI25_0_0YGNodeStyleGet##cssProp(_yogaNode);                \
}

ABI25_0_0RCT_STYLE_PROPERTY(Flex, flex, Flex, float)
ABI25_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
ABI25_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
ABI25_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI25_0_0YGFlexDirection)
ABI25_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI25_0_0YGJustify)
ABI25_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI25_0_0YGAlign)
ABI25_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI25_0_0YGAlign)
ABI25_0_0RCT_STYLE_PROPERTY(AlignContent, alignContent, AlignContent, ABI25_0_0YGAlign)
ABI25_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI25_0_0YGPositionType)
ABI25_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI25_0_0YGWrap)
ABI25_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI25_0_0YGOverflow)
ABI25_0_0RCT_STYLE_PROPERTY(Display, display, Display, ABI25_0_0YGDisplay)
ABI25_0_0RCT_STYLE_PROPERTY(Direction, direction, Direction, ABI25_0_0YGDirection)
ABI25_0_0RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)setBackgroundColor:(UIColor *)color
{
  _backgroundColor = color;
  [self dirtyPropagation];
}

- (void)setZIndex:(NSInteger)zIndex
{
  _zIndex = zIndex;
  if (_superview) {
    // Changing zIndex means the subview order of the parent needs updating
    _superview->_didUpdateSubviews = YES;
    [_superview dirtyPropagation];
  }
}

- (void)didUpdateReactABI25_0_0Subviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI25_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _yogaNode);
  }
  if (_recomputeMargin) {
    ABI25_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _yogaNode);
  }
  if (_recomputeBorder) {
    ABI25_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _yogaNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
