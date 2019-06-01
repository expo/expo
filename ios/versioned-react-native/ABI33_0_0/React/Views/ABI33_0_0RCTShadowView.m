/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTShadowView.h"

#import "ABI33_0_0RCTConvert.h"
#import "ABI33_0_0RCTI18nUtil.h"
#import "ABI33_0_0RCTLayout.h"
#import "ABI33_0_0RCTLog.h"
#import "ABI33_0_0RCTShadowView+Layout.h"
#import "ABI33_0_0RCTUtils.h"
#import "ABI33_0_0UIView+Private.h"
#import "UIView+ReactABI33_0_0.h"

typedef void (^ABI33_0_0RCTActionBlock)(ABI33_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI33_0_0RCTResetActionBlock)(ABI33_0_0RCTShadowView *shadowViewSelf);

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

@implementation ABI33_0_0RCTShadowView
{
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI33_0_0RCTShadowView *> *_ReactABI33_0_0Subviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  ABI33_0_0YGValue _paddingMetaProps[META_PROP_COUNT];
  ABI33_0_0YGValue _marginMetaProps[META_PROP_COUNT];
  ABI33_0_0YGValue _borderMetaProps[META_PROP_COUNT];
}

+ (ABI33_0_0YGConfigRef)ABI33_0_0yogaConfig
{
  static ABI33_0_0YGConfigRef ABI33_0_0yogaConfig;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI33_0_0yogaConfig = ABI33_0_0YGConfigNew();
    ABI33_0_0YGConfigSetPointScaleFactor(ABI33_0_0yogaConfig, ABI33_0_0RCTScreenScale());
    ABI33_0_0YGConfigSetUseLegacyStretchBehaviour(ABI33_0_0yogaConfig, true);
  });
  return ABI33_0_0yogaConfig;
}

@synthesize ReactABI33_0_0Tag = _ReactABI33_0_0Tag;

// YogaNode API

static void ABI33_0_0RCTPrint(ABI33_0_0YGNodeRef node)
{
  ABI33_0_0RCTShadowView *shadowView = (__bridge ABI33_0_0RCTShadowView *)ABI33_0_0YGNodeGetContext(node);
  printf("%s(%lld), ", shadowView.viewName.UTF8String, (long long)shadowView.ReactABI33_0_0Tag.integerValue);
}

#define ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(ygvalue, setter, ...)    \
switch (ygvalue.unit) {                          \
  case ABI33_0_0YGUnitAuto:                               \
  case ABI33_0_0YGUnitUndefined:                          \
    setter(__VA_ARGS__, ABI33_0_0YGUndefined);            \
    break;                                       \
  case ABI33_0_0YGUnitPoint:                              \
    setter(__VA_ARGS__, ygvalue.value);          \
    break;                                       \
  case ABI33_0_0YGUnitPercent:                            \
    setter##Percent(__VA_ARGS__, ygvalue.value); \
    break;                                       \
}

#define ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(ygvalue, setter, ...) \
switch (ygvalue.unit) {                            \
  case ABI33_0_0YGUnitAuto:                                 \
    setter##Auto(__VA_ARGS__);                     \
    break;                                         \
  case ABI33_0_0YGUnitUndefined:                            \
    setter(__VA_ARGS__, ABI33_0_0YGUndefined);              \
    break;                                         \
  case ABI33_0_0YGUnitPoint:                                \
    setter(__VA_ARGS__, ygvalue.value);            \
    break;                                         \
  case ABI33_0_0YGUnitPercent:                              \
    setter##Percent(__VA_ARGS__, ygvalue.value);   \
    break;                                         \
}

static void ABI33_0_0RCTProcessMetaPropsPadding(const ABI33_0_0YGValue metaProps[META_PROP_COUNT], ABI33_0_0YGNodeRef node) {
  if (![[ABI33_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(metaProps[META_PROP_START], ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeStart);
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(metaProps[META_PROP_END], ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeEnd);
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(metaProps[META_PROP_LEFT], ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeLeft);
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(metaProps[META_PROP_RIGHT], ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeRight);
  } else {
    ABI33_0_0YGValue start = metaProps[META_PROP_START].unit == ABI33_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI33_0_0YGValue end = metaProps[META_PROP_END].unit == ABI33_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(start, ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeStart);
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(end, ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeEnd);
  }
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(metaProps[META_PROP_TOP], ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeTop);
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(metaProps[META_PROP_BOTTOM], ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeBottom);
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(metaProps[META_PROP_HORIZONTAL], ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeHorizontal);
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(metaProps[META_PROP_VERTICAL], ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeVertical);
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(metaProps[META_PROP_ALL], ABI33_0_0YGNodeStyleSetPadding, node, ABI33_0_0YGEdgeAll);
}

static void ABI33_0_0RCTProcessMetaPropsMargin(const ABI33_0_0YGValue metaProps[META_PROP_COUNT], ABI33_0_0YGNodeRef node) {
  if (![[ABI33_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(metaProps[META_PROP_START], ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeStart);
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(metaProps[META_PROP_END], ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeEnd);
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(metaProps[META_PROP_LEFT], ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeLeft);
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(metaProps[META_PROP_RIGHT], ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeRight);
  } else {
    ABI33_0_0YGValue start = metaProps[META_PROP_START].unit == ABI33_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI33_0_0YGValue end = metaProps[META_PROP_END].unit == ABI33_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(start, ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeStart);
    ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(end, ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeEnd);
  }
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(metaProps[META_PROP_TOP], ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeTop);
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(metaProps[META_PROP_BOTTOM], ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeBottom);
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(metaProps[META_PROP_HORIZONTAL], ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeHorizontal);
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(metaProps[META_PROP_VERTICAL], ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeVertical);
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(metaProps[META_PROP_ALL], ABI33_0_0YGNodeStyleSetMargin, node, ABI33_0_0YGEdgeAll);
}

static void ABI33_0_0RCTProcessMetaPropsBorder(const ABI33_0_0YGValue metaProps[META_PROP_COUNT], ABI33_0_0YGNodeRef node) {
  if (![[ABI33_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeStart, metaProps[META_PROP_START].value);
    ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeEnd, metaProps[META_PROP_END].value);
    ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeLeft, metaProps[META_PROP_LEFT].value);
    ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeRight, metaProps[META_PROP_RIGHT].value);
  } else {
    const float start = ABI33_0_0YGFloatIsUndefined(metaProps[META_PROP_START].value) ? metaProps[META_PROP_LEFT].value : metaProps[META_PROP_START].value;
    const float end = ABI33_0_0YGFloatIsUndefined(metaProps[META_PROP_END].value) ? metaProps[META_PROP_RIGHT].value : metaProps[META_PROP_END].value;
    ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeStart, start);
    ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeEnd, end);
  }
  ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeTop, metaProps[META_PROP_TOP].value);
  ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  ABI33_0_0YGNodeStyleSetBorder(node, ABI33_0_0YGEdgeAll, metaProps[META_PROP_ALL].value);
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI33_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  ABI33_0_0RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    offset.x += shadowView.layoutMetrics.frame.origin.x;
    offset.y += shadowView.layoutMetrics.frame.origin.y;
    shadowView = shadowView->_superview;
    depth--;
  }
  if (ancestor != shadowView) {
    return CGRectNull;
  }
  return (CGRect){offset, self.layoutMetrics.frame.size};
}

- (BOOL)viewIsDescendantOf:(ABI33_0_0RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  ABI33_0_0RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    shadowView = shadowView->_superview;
    depth--;
  }
  return ancestor == shadowView;
}

- (instancetype)init
{
  if (self = [super init]) {
    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = ABI33_0_0YGValueUndefined;
      _marginMetaProps[ii] = ABI33_0_0YGValueUndefined;
      _borderMetaProps[ii] = ABI33_0_0YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;

    _ReactABI33_0_0Subviews = [NSMutableArray array];

    _ABI33_0_0yogaNode = ABI33_0_0YGNodeNewWithConfig([[self class] ABI33_0_0yogaConfig]);
     ABI33_0_0YGNodeSetContext(_ABI33_0_0yogaNode, (__bridge void *)self);
     ABI33_0_0YGNodeSetPrintFunc(_ABI33_0_0yogaNode, ABI33_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isReactABI33_0_0RootView
{
  return ABI33_0_0RCTIsReactABI33_0_0RootView(self.ReactABI33_0_0Tag);
}

- (void)dealloc
{
  ABI33_0_0YGNodeFree(_ABI33_0_0yogaNode);
}

- (BOOL)canHaveSubviews
{
  return YES;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)insertReactABI33_0_0Subview:(ABI33_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  ABI33_0_0RCTAssert(self.canHaveSubviews, @"Attempt to insert subview inside leaf view.");

  [_ReactABI33_0_0Subviews insertObject:subview atIndex:atIndex];
  if (![self isYogaLeafNode]) {
    ABI33_0_0YGNodeInsertChild(_ABI33_0_0yogaNode, subview.ABI33_0_0yogaNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
}

- (void)removeReactABI33_0_0Subview:(ABI33_0_0RCTShadowView *)subview
{
  subview->_superview = nil;
  [_ReactABI33_0_0Subviews removeObject:subview];
  if (![self isYogaLeafNode]) {
    ABI33_0_0YGNodeRemoveChild(_ABI33_0_0yogaNode, subview.ABI33_0_0yogaNode);
  }
}

- (NSArray<ABI33_0_0RCTShadowView *> *)ReactABI33_0_0Subviews
{
  return _ReactABI33_0_0Subviews;
}

- (ABI33_0_0RCTShadowView *)ReactABI33_0_0Superview
{
  return _superview;
}

#pragma mark - Layout

- (void)layoutWithMinimumSize:(CGSize)minimumSize
                  maximumSize:(CGSize)maximumSize
              layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
                layoutContext:(ABI33_0_0RCTLayoutContext)layoutContext
{
  ABI33_0_0YGNodeRef ABI33_0_0yogaNode = _ABI33_0_0yogaNode;

  CGSize oldMinimumSize = (CGSize){
    ABI33_0_0RCTCoreGraphicsFloatFromYogaValue(ABI33_0_0YGNodeStyleGetMinWidth(ABI33_0_0yogaNode), 0.0),
    ABI33_0_0RCTCoreGraphicsFloatFromYogaValue(ABI33_0_0YGNodeStyleGetMinHeight(ABI33_0_0yogaNode), 0.0)
  };

  if (!CGSizeEqualToSize(oldMinimumSize, minimumSize)) {
    ABI33_0_0YGNodeStyleSetMinWidth(ABI33_0_0yogaNode, ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
    ABI33_0_0YGNodeStyleSetMinHeight(ABI33_0_0yogaNode, ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  }

  ABI33_0_0YGNodeCalculateLayout(
    ABI33_0_0yogaNode,
    ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width),
    ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height),
    ABI33_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(layoutDirection)
  );

  ABI33_0_0RCTAssert(!ABI33_0_0YGNodeIsDirty(ABI33_0_0yogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

  if (!ABI33_0_0YGNodeGetHasNewLayout(ABI33_0_0yogaNode)) {
    return;
  }

  ABI33_0_0YGNodeSetHasNewLayout(ABI33_0_0yogaNode, false);

  ABI33_0_0RCTLayoutMetrics layoutMetrics = ABI33_0_0RCTLayoutMetricsFromYogaNode(ABI33_0_0yogaNode);

  layoutContext.absolutePosition.x += layoutMetrics.frame.origin.x;
  layoutContext.absolutePosition.y += layoutMetrics.frame.origin.y;

  [self layoutWithMetrics:layoutMetrics
            layoutContext:layoutContext];

  [self layoutSubviewsWithContext:layoutContext];
}

- (void)layoutWithMetrics:(ABI33_0_0RCTLayoutMetrics)layoutMetrics
            layoutContext:(ABI33_0_0RCTLayoutContext)layoutContext
{
  if (!ABI33_0_0RCTLayoutMetricsEqualToLayoutMetrics(self.layoutMetrics, layoutMetrics)) {
    self.layoutMetrics = layoutMetrics;
    [layoutContext.affectedShadowViews addObject:self];
  }
}

- (void)layoutSubviewsWithContext:(ABI33_0_0RCTLayoutContext)layoutContext
{
  ABI33_0_0RCTLayoutMetrics layoutMetrics = self.layoutMetrics;

  if (layoutMetrics.displayType == ABI33_0_0RCTDisplayTypeNone) {
    return;
  }

  for (ABI33_0_0RCTShadowView *childShadowView in _ReactABI33_0_0Subviews) {
    ABI33_0_0YGNodeRef childYogaNode = childShadowView.ABI33_0_0yogaNode;

    ABI33_0_0RCTAssert(!ABI33_0_0YGNodeIsDirty(childYogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

    if (!ABI33_0_0YGNodeGetHasNewLayout(childYogaNode)) {
      continue;
    }

    ABI33_0_0YGNodeSetHasNewLayout(childYogaNode, false);

    ABI33_0_0RCTLayoutMetrics childLayoutMetrics = ABI33_0_0RCTLayoutMetricsFromYogaNode(childYogaNode);

    layoutContext.absolutePosition.x += childLayoutMetrics.frame.origin.x;
    layoutContext.absolutePosition.y += childLayoutMetrics.frame.origin.y;

    [childShadowView layoutWithMetrics:childLayoutMetrics
                         layoutContext:layoutContext];

    // Recursive call.
    [childShadowView layoutSubviewsWithContext:layoutContext];
  }
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  ABI33_0_0YGNodeRef clonedYogaNode = ABI33_0_0YGNodeClone(self.ABI33_0_0yogaNode);
  ABI33_0_0YGNodeRef constraintYogaNode = ABI33_0_0YGNodeNewWithConfig([[self class] ABI33_0_0yogaConfig]);

  ABI33_0_0YGNodeInsertChild(constraintYogaNode, clonedYogaNode, 0);

  ABI33_0_0YGNodeStyleSetMinWidth(constraintYogaNode, ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  ABI33_0_0YGNodeStyleSetMinHeight(constraintYogaNode, ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  ABI33_0_0YGNodeStyleSetMaxWidth(constraintYogaNode, ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width));
  ABI33_0_0YGNodeStyleSetMaxHeight(constraintYogaNode, ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height));

  ABI33_0_0YGNodeCalculateLayout(
    constraintYogaNode,
    ABI33_0_0YGUndefined,
    ABI33_0_0YGUndefined,
    ABI33_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(self.layoutMetrics.layoutDirection)
  );

  CGSize measuredSize = (CGSize){
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetWidth(constraintYogaNode)),
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetHeight(constraintYogaNode)),
  };

  ABI33_0_0YGNodeRemoveChild(constraintYogaNode, clonedYogaNode);
  ABI33_0_0YGNodeFree(constraintYogaNode);
  ABI33_0_0YGNodeFree(clonedYogaNode);

  return measuredSize;
}

- (NSNumber *)ReactABI33_0_0TagAtPoint:(CGPoint)point
{
  for (ABI33_0_0RCTShadowView *shadowView in _ReactABI33_0_0Subviews) {
    if (CGRectContainsPoint(shadowView.layoutMetrics.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.layoutMetrics.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ReactABI33_0_0TagAtPoint:relativePoint];
    }
  }
  return self.ReactABI33_0_0Tag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; ReactABI33_0_0Tag: %@; frame: %@>", self.viewName, self.ReactABI33_0_0Tag, NSStringFromCGRect(self.layoutMetrics.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI33_0_0RCTShadowView *subview in _ReactABI33_0_0Subviews) {
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

#define ABI33_0_0RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(ABI33_0_0YGValue)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (ABI33_0_0YGValue)margin##prop                           \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

ABI33_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI33_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI33_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI33_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI33_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI33_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI33_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)
ABI33_0_0RCT_MARGIN_PROPERTY(Start, START)
ABI33_0_0RCT_MARGIN_PROPERTY(End, END)

// Padding

#define ABI33_0_0RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(ABI33_0_0YGValue)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (ABI33_0_0YGValue)padding##prop                           \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

ABI33_0_0RCT_PADDING_PROPERTY(, ALL)
ABI33_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI33_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI33_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI33_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI33_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI33_0_0RCT_PADDING_PROPERTY(Right, RIGHT)
ABI33_0_0RCT_PADDING_PROPERTY(Start, START)
ABI33_0_0RCT_PADDING_PROPERTY(End, END)

// Border

#define ABI33_0_0RCT_BORDER_PROPERTY(prop, metaProp)             \
- (void)setBorder##prop##Width:(float)value             \
{                                                       \
  _borderMetaProps[META_PROP_##metaProp].value = value; \
  _recomputeBorder = YES;                               \
}                                                       \
- (float)border##prop##Width                            \
{                                                       \
  return _borderMetaProps[META_PROP_##metaProp].value;  \
}

ABI33_0_0RCT_BORDER_PROPERTY(, ALL)
ABI33_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI33_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI33_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI33_0_0RCT_BORDER_PROPERTY(Right, RIGHT)
ABI33_0_0RCT_BORDER_PROPERTY(Start, START)
ABI33_0_0RCT_BORDER_PROPERTY(End, END)

// Dimensions
#define ABI33_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(ABI33_0_0YGValue)value                                 \
{                                                                   \
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(value, ABI33_0_0YGNodeStyleSet##cssProp, _ABI33_0_0yogaNode);  \
}                                                                   \
- (ABI33_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI33_0_0YGNodeStyleGet##cssProp(_ABI33_0_0yogaNode);                        \
}

#define ABI33_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(setProp, getProp, cssProp)   \
- (void)set##setProp:(ABI33_0_0YGValue)value                                 \
{                                                                   \
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(value, ABI33_0_0YGNodeStyleSet##cssProp, _ABI33_0_0yogaNode);       \
}                                                                   \
- (ABI33_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI33_0_0YGNodeStyleGet##cssProp(_ABI33_0_0yogaNode);                        \
}

ABI33_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI33_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI33_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI33_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI33_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI33_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI33_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(ABI33_0_0YGValue)value                                 \
{                                                                   \
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(value, ABI33_0_0YGNodeStyleSetPosition, _ABI33_0_0yogaNode, edge);  \
}                                                                   \
- (ABI33_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI33_0_0YGNodeStyleGetPosition(_ABI33_0_0yogaNode, edge);                   \
}


ABI33_0_0RCT_POSITION_PROPERTY(Top, top, ABI33_0_0YGEdgeTop)
ABI33_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI33_0_0YGEdgeBottom)
ABI33_0_0RCT_POSITION_PROPERTY(Start, start, ABI33_0_0YGEdgeStart)
ABI33_0_0RCT_POSITION_PROPERTY(End, end, ABI33_0_0YGEdgeEnd)

- (void)setLeft:(ABI33_0_0YGValue)value
{
  ABI33_0_0YGEdge edge = [[ABI33_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI33_0_0YGEdgeStart : ABI33_0_0YGEdgeLeft;
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(value, ABI33_0_0YGNodeStyleSetPosition, _ABI33_0_0yogaNode, edge);
}
- (ABI33_0_0YGValue)left
{
  ABI33_0_0YGEdge edge = [[ABI33_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI33_0_0YGEdgeStart : ABI33_0_0YGEdgeLeft;
  return ABI33_0_0YGNodeStyleGetPosition(_ABI33_0_0yogaNode, edge);
}

- (void)setRight:(ABI33_0_0YGValue)value
{
  ABI33_0_0YGEdge edge = [[ABI33_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI33_0_0YGEdgeEnd : ABI33_0_0YGEdgeRight;
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE(value, ABI33_0_0YGNodeStyleSetPosition, _ABI33_0_0yogaNode, edge);
}
- (ABI33_0_0YGValue)right
{
  ABI33_0_0YGEdge edge = [[ABI33_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI33_0_0YGEdgeEnd : ABI33_0_0YGEdgeRight;
  return ABI33_0_0YGNodeStyleGetPosition(_ABI33_0_0yogaNode, edge);
}

// Size

- (CGSize)size
{
  ABI33_0_0YGValue width = ABI33_0_0YGNodeStyleGetWidth(_ABI33_0_0yogaNode);
  ABI33_0_0YGValue height = ABI33_0_0YGNodeStyleGetHeight(_ABI33_0_0yogaNode);

  return CGSizeMake(
    width.unit == ABI33_0_0YGUnitPoint ? width.value : NAN,
    height.unit == ABI33_0_0YGUnitPoint ? height.value : NAN
  );
}

- (void)setSize:(CGSize)size
{
  ABI33_0_0YGNodeStyleSetWidth(_ABI33_0_0yogaNode, size.width);
  ABI33_0_0YGNodeStyleSetHeight(_ABI33_0_0yogaNode, size.height);
}

// IntrinsicContentSize

static inline ABI33_0_0YGSize ABI33_0_0RCTShadowViewMeasure(ABI33_0_0YGNodeRef node, float width, ABI33_0_0YGMeasureMode widthMode, float height, ABI33_0_0YGMeasureMode heightMode)
{
  ABI33_0_0RCTShadowView *shadowView = (__bridge ABI33_0_0RCTShadowView *)ABI33_0_0YGNodeGetContext(node);

  CGSize intrinsicContentSize = shadowView->_intrinsicContentSize;
  // Replace `UIViewNoIntrinsicMetric` (which equals `-1`) with zero.
  intrinsicContentSize.width = MAX(0, intrinsicContentSize.width);
  intrinsicContentSize.height = MAX(0, intrinsicContentSize.height);

  ABI33_0_0YGSize result;

  switch (widthMode) {
    case ABI33_0_0YGMeasureModeUndefined:
      result.width = intrinsicContentSize.width;
      break;
    case ABI33_0_0YGMeasureModeExactly:
      result.width = width;
      break;
    case ABI33_0_0YGMeasureModeAtMost:
      result.width = MIN(width, intrinsicContentSize.width);
      break;
  }

  switch (heightMode) {
    case ABI33_0_0YGMeasureModeUndefined:
      result.height = intrinsicContentSize.height;
      break;
    case ABI33_0_0YGMeasureModeExactly:
      result.height = height;
      break;
    case ABI33_0_0YGMeasureModeAtMost:
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
    ABI33_0_0YGNodeSetMeasureFunc(_ABI33_0_0yogaNode, NULL);
  } else {
    ABI33_0_0YGNodeSetMeasureFunc(_ABI33_0_0yogaNode, ABI33_0_0RCTShadowViewMeasure);
  }

  ABI33_0_0YGNodeMarkDirty(_ABI33_0_0yogaNode);
}

// Local Data

- (void)setLocalData:(__unused NSObject *)localData
{
  // Do nothing by default.
}

// Flex

- (void)setFlexBasis:(ABI33_0_0YGValue)value
{
  ABI33_0_0RCT_SET_ABI33_0_0YGVALUE_AUTO(value, ABI33_0_0YGNodeStyleSetFlexBasis, _ABI33_0_0yogaNode);
}

- (ABI33_0_0YGValue)flexBasis
{
  return ABI33_0_0YGNodeStyleGetFlexBasis(_ABI33_0_0yogaNode);
}

#define ABI33_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  ABI33_0_0YGNodeStyleSet##cssProp(_ABI33_0_0yogaNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return ABI33_0_0YGNodeStyleGet##cssProp(_ABI33_0_0yogaNode);                \
}

ABI33_0_0RCT_STYLE_PROPERTY(Flex, flex, Flex, float)
ABI33_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
ABI33_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
ABI33_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI33_0_0YGFlexDirection)
ABI33_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI33_0_0YGJustify)
ABI33_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI33_0_0YGAlign)
ABI33_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI33_0_0YGAlign)
ABI33_0_0RCT_STYLE_PROPERTY(AlignContent, alignContent, AlignContent, ABI33_0_0YGAlign)
ABI33_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI33_0_0YGPositionType)
ABI33_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI33_0_0YGWrap)
ABI33_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI33_0_0YGOverflow)
ABI33_0_0RCT_STYLE_PROPERTY(Display, display, Display, ABI33_0_0YGDisplay)
ABI33_0_0RCT_STYLE_PROPERTY(Direction, direction, Direction, ABI33_0_0YGDirection)
ABI33_0_0RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)didUpdateReactABI33_0_0Subviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI33_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _ABI33_0_0yogaNode);
  }
  if (_recomputeMargin) {
    ABI33_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _ABI33_0_0yogaNode);
  }
  if (_recomputeBorder) {
    ABI33_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _ABI33_0_0yogaNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
