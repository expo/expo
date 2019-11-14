/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTShadowView.h"

#import "ABI35_0_0RCTConvert.h"
#import "ABI35_0_0RCTI18nUtil.h"
#import "ABI35_0_0RCTLayout.h"
#import "ABI35_0_0RCTLog.h"
#import "ABI35_0_0RCTShadowView+Layout.h"
#import "ABI35_0_0RCTUtils.h"
#import "ABI35_0_0UIView+Private.h"
#import "UIView+ReactABI35_0_0.h"

typedef void (^ABI35_0_0RCTActionBlock)(ABI35_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI35_0_0RCTResetActionBlock)(ABI35_0_0RCTShadowView *shadowViewSelf);

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

@implementation ABI35_0_0RCTShadowView
{
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI35_0_0RCTShadowView *> *_ReactABI35_0_0Subviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  ABI35_0_0YGValue _paddingMetaProps[META_PROP_COUNT];
  ABI35_0_0YGValue _marginMetaProps[META_PROP_COUNT];
  ABI35_0_0YGValue _borderMetaProps[META_PROP_COUNT];
}

+ (ABI35_0_0YGConfigRef)ABI35_0_0yogaConfig
{
  static ABI35_0_0YGConfigRef ABI35_0_0yogaConfig;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI35_0_0yogaConfig = ABI35_0_0YGConfigNew();
    ABI35_0_0YGConfigSetPointScaleFactor(ABI35_0_0yogaConfig, ABI35_0_0RCTScreenScale());
    ABI35_0_0YGConfigSetUseLegacyStretchBehaviour(ABI35_0_0yogaConfig, true);
  });
  return ABI35_0_0yogaConfig;
}

@synthesize ReactABI35_0_0Tag = _ReactABI35_0_0Tag;

// YogaNode API

static void ABI35_0_0RCTPrint(ABI35_0_0YGNodeRef node)
{
  ABI35_0_0RCTShadowView *shadowView = (__bridge ABI35_0_0RCTShadowView *)ABI35_0_0YGNodeGetContext(node);
  printf("%s(%lld), ", shadowView.viewName.UTF8String, (long long)shadowView.ReactABI35_0_0Tag.integerValue);
}

#define ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(ygvalue, setter, ...)    \
switch (ygvalue.unit) {                          \
  case ABI35_0_0YGUnitAuto:                               \
  case ABI35_0_0YGUnitUndefined:                          \
    setter(__VA_ARGS__, ABI35_0_0YGUndefined);            \
    break;                                       \
  case ABI35_0_0YGUnitPoint:                              \
    setter(__VA_ARGS__, ygvalue.value);          \
    break;                                       \
  case ABI35_0_0YGUnitPercent:                            \
    setter##Percent(__VA_ARGS__, ygvalue.value); \
    break;                                       \
}

#define ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(ygvalue, setter, ...) \
switch (ygvalue.unit) {                            \
  case ABI35_0_0YGUnitAuto:                                 \
    setter##Auto(__VA_ARGS__);                     \
    break;                                         \
  case ABI35_0_0YGUnitUndefined:                            \
    setter(__VA_ARGS__, ABI35_0_0YGUndefined);              \
    break;                                         \
  case ABI35_0_0YGUnitPoint:                                \
    setter(__VA_ARGS__, ygvalue.value);            \
    break;                                         \
  case ABI35_0_0YGUnitPercent:                              \
    setter##Percent(__VA_ARGS__, ygvalue.value);   \
    break;                                         \
}

static void ABI35_0_0RCTProcessMetaPropsPadding(const ABI35_0_0YGValue metaProps[META_PROP_COUNT], ABI35_0_0YGNodeRef node) {
  if (![[ABI35_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(metaProps[META_PROP_START], ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeStart);
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(metaProps[META_PROP_END], ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeEnd);
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(metaProps[META_PROP_LEFT], ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeLeft);
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(metaProps[META_PROP_RIGHT], ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeRight);
  } else {
    ABI35_0_0YGValue start = metaProps[META_PROP_START].unit == ABI35_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI35_0_0YGValue end = metaProps[META_PROP_END].unit == ABI35_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(start, ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeStart);
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(end, ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeEnd);
  }
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(metaProps[META_PROP_TOP], ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeTop);
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(metaProps[META_PROP_BOTTOM], ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeBottom);
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(metaProps[META_PROP_HORIZONTAL], ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeHorizontal);
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(metaProps[META_PROP_VERTICAL], ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeVertical);
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(metaProps[META_PROP_ALL], ABI35_0_0YGNodeStyleSetPadding, node, ABI35_0_0YGEdgeAll);
}

static void ABI35_0_0RCTProcessMetaPropsMargin(const ABI35_0_0YGValue metaProps[META_PROP_COUNT], ABI35_0_0YGNodeRef node) {
  if (![[ABI35_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(metaProps[META_PROP_START], ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeStart);
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(metaProps[META_PROP_END], ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeEnd);
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(metaProps[META_PROP_LEFT], ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeLeft);
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(metaProps[META_PROP_RIGHT], ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeRight);
  } else {
    ABI35_0_0YGValue start = metaProps[META_PROP_START].unit == ABI35_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI35_0_0YGValue end = metaProps[META_PROP_END].unit == ABI35_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(start, ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeStart);
    ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(end, ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeEnd);
  }
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(metaProps[META_PROP_TOP], ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeTop);
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(metaProps[META_PROP_BOTTOM], ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeBottom);
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(metaProps[META_PROP_HORIZONTAL], ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeHorizontal);
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(metaProps[META_PROP_VERTICAL], ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeVertical);
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(metaProps[META_PROP_ALL], ABI35_0_0YGNodeStyleSetMargin, node, ABI35_0_0YGEdgeAll);
}

static void ABI35_0_0RCTProcessMetaPropsBorder(const ABI35_0_0YGValue metaProps[META_PROP_COUNT], ABI35_0_0YGNodeRef node) {
  if (![[ABI35_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeStart, metaProps[META_PROP_START].value);
    ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeEnd, metaProps[META_PROP_END].value);
    ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeLeft, metaProps[META_PROP_LEFT].value);
    ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeRight, metaProps[META_PROP_RIGHT].value);
  } else {
    const float start = ABI35_0_0YGFloatIsUndefined(metaProps[META_PROP_START].value) ? metaProps[META_PROP_LEFT].value : metaProps[META_PROP_START].value;
    const float end = ABI35_0_0YGFloatIsUndefined(metaProps[META_PROP_END].value) ? metaProps[META_PROP_RIGHT].value : metaProps[META_PROP_END].value;
    ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeStart, start);
    ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeEnd, end);
  }
  ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeTop, metaProps[META_PROP_TOP].value);
  ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  ABI35_0_0YGNodeStyleSetBorder(node, ABI35_0_0YGEdgeAll, metaProps[META_PROP_ALL].value);
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI35_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  ABI35_0_0RCTShadowView *shadowView = self;
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

- (BOOL)viewIsDescendantOf:(ABI35_0_0RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  ABI35_0_0RCTShadowView *shadowView = self;
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
      _paddingMetaProps[ii] = ABI35_0_0YGValueUndefined;
      _marginMetaProps[ii] = ABI35_0_0YGValueUndefined;
      _borderMetaProps[ii] = ABI35_0_0YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;

    _ReactABI35_0_0Subviews = [NSMutableArray array];

    _ABI35_0_0yogaNode = ABI35_0_0YGNodeNewWithConfig([[self class] ABI35_0_0yogaConfig]);
     ABI35_0_0YGNodeSetContext(_ABI35_0_0yogaNode, (__bridge void *)self);
     ABI35_0_0YGNodeSetPrintFunc(_ABI35_0_0yogaNode, ABI35_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isReactABI35_0_0RootView
{
  return ABI35_0_0RCTIsReactABI35_0_0RootView(self.ReactABI35_0_0Tag);
}

- (void)dealloc
{
  ABI35_0_0YGNodeFree(_ABI35_0_0yogaNode);
}

- (BOOL)canHaveSubviews
{
  return YES;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)insertReactABI35_0_0Subview:(ABI35_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  ABI35_0_0RCTAssert(self.canHaveSubviews, @"Attempt to insert subview inside leaf view.");

  [_ReactABI35_0_0Subviews insertObject:subview atIndex:atIndex];
  if (![self isYogaLeafNode]) {
    ABI35_0_0YGNodeInsertChild(_ABI35_0_0yogaNode, subview.ABI35_0_0yogaNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
}

- (void)removeReactABI35_0_0Subview:(ABI35_0_0RCTShadowView *)subview
{
  subview->_superview = nil;
  [_ReactABI35_0_0Subviews removeObject:subview];
  if (![self isYogaLeafNode]) {
    ABI35_0_0YGNodeRemoveChild(_ABI35_0_0yogaNode, subview.ABI35_0_0yogaNode);
  }
}

- (NSArray<ABI35_0_0RCTShadowView *> *)ReactABI35_0_0Subviews
{
  return _ReactABI35_0_0Subviews;
}

- (ABI35_0_0RCTShadowView *)ReactABI35_0_0Superview
{
  return _superview;
}

#pragma mark - Layout

- (void)layoutWithMinimumSize:(CGSize)minimumSize
                  maximumSize:(CGSize)maximumSize
              layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
                layoutContext:(ABI35_0_0RCTLayoutContext)layoutContext
{
  ABI35_0_0YGNodeRef ABI35_0_0yogaNode = _ABI35_0_0yogaNode;

  CGSize oldMinimumSize = (CGSize){
    ABI35_0_0RCTCoreGraphicsFloatFromYogaValue(ABI35_0_0YGNodeStyleGetMinWidth(ABI35_0_0yogaNode), 0.0),
    ABI35_0_0RCTCoreGraphicsFloatFromYogaValue(ABI35_0_0YGNodeStyleGetMinHeight(ABI35_0_0yogaNode), 0.0)
  };

  if (!CGSizeEqualToSize(oldMinimumSize, minimumSize)) {
    ABI35_0_0YGNodeStyleSetMinWidth(ABI35_0_0yogaNode, ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
    ABI35_0_0YGNodeStyleSetMinHeight(ABI35_0_0yogaNode, ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  }

  ABI35_0_0YGNodeCalculateLayout(
    ABI35_0_0yogaNode,
    ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width),
    ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height),
    ABI35_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(layoutDirection)
  );

  ABI35_0_0RCTAssert(!ABI35_0_0YGNodeIsDirty(ABI35_0_0yogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

  if (!ABI35_0_0YGNodeGetHasNewLayout(ABI35_0_0yogaNode)) {
    return;
  }

  ABI35_0_0YGNodeSetHasNewLayout(ABI35_0_0yogaNode, false);

  ABI35_0_0RCTLayoutMetrics layoutMetrics = ABI35_0_0RCTLayoutMetricsFromYogaNode(ABI35_0_0yogaNode);

  layoutContext.absolutePosition.x += layoutMetrics.frame.origin.x;
  layoutContext.absolutePosition.y += layoutMetrics.frame.origin.y;

  [self layoutWithMetrics:layoutMetrics
            layoutContext:layoutContext];

  [self layoutSubviewsWithContext:layoutContext];
}

- (void)layoutWithMetrics:(ABI35_0_0RCTLayoutMetrics)layoutMetrics
            layoutContext:(ABI35_0_0RCTLayoutContext)layoutContext
{
  if (!ABI35_0_0RCTLayoutMetricsEqualToLayoutMetrics(self.layoutMetrics, layoutMetrics)) {
    self.layoutMetrics = layoutMetrics;
    [layoutContext.affectedShadowViews addObject:self];
  }
}

- (void)layoutSubviewsWithContext:(ABI35_0_0RCTLayoutContext)layoutContext
{
  ABI35_0_0RCTLayoutMetrics layoutMetrics = self.layoutMetrics;

  if (layoutMetrics.displayType == ABI35_0_0RCTDisplayTypeNone) {
    return;
  }

  for (ABI35_0_0RCTShadowView *childShadowView in _ReactABI35_0_0Subviews) {
    ABI35_0_0YGNodeRef childYogaNode = childShadowView.ABI35_0_0yogaNode;

    ABI35_0_0RCTAssert(!ABI35_0_0YGNodeIsDirty(childYogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

    if (!ABI35_0_0YGNodeGetHasNewLayout(childYogaNode)) {
      continue;
    }

    ABI35_0_0YGNodeSetHasNewLayout(childYogaNode, false);

    ABI35_0_0RCTLayoutMetrics childLayoutMetrics = ABI35_0_0RCTLayoutMetricsFromYogaNode(childYogaNode);

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
  ABI35_0_0YGNodeRef clonedYogaNode = ABI35_0_0YGNodeClone(self.ABI35_0_0yogaNode);
  ABI35_0_0YGNodeRef constraintYogaNode = ABI35_0_0YGNodeNewWithConfig([[self class] ABI35_0_0yogaConfig]);

  ABI35_0_0YGNodeInsertChild(constraintYogaNode, clonedYogaNode, 0);

  ABI35_0_0YGNodeStyleSetMinWidth(constraintYogaNode, ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  ABI35_0_0YGNodeStyleSetMinHeight(constraintYogaNode, ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  ABI35_0_0YGNodeStyleSetMaxWidth(constraintYogaNode, ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width));
  ABI35_0_0YGNodeStyleSetMaxHeight(constraintYogaNode, ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height));

  ABI35_0_0YGNodeCalculateLayout(
    constraintYogaNode,
    ABI35_0_0YGUndefined,
    ABI35_0_0YGUndefined,
    ABI35_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(self.layoutMetrics.layoutDirection)
  );

  CGSize measuredSize = (CGSize){
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetWidth(constraintYogaNode)),
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetHeight(constraintYogaNode)),
  };

  ABI35_0_0YGNodeRemoveChild(constraintYogaNode, clonedYogaNode);
  ABI35_0_0YGNodeFree(constraintYogaNode);
  ABI35_0_0YGNodeFree(clonedYogaNode);

  return measuredSize;
}

- (NSNumber *)ReactABI35_0_0TagAtPoint:(CGPoint)point
{
  for (ABI35_0_0RCTShadowView *shadowView in _ReactABI35_0_0Subviews) {
    if (CGRectContainsPoint(shadowView.layoutMetrics.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.layoutMetrics.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ReactABI35_0_0TagAtPoint:relativePoint];
    }
  }
  return self.ReactABI35_0_0Tag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; ReactABI35_0_0Tag: %@; frame: %@>", self.viewName, self.ReactABI35_0_0Tag, NSStringFromCGRect(self.layoutMetrics.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI35_0_0RCTShadowView *subview in _ReactABI35_0_0Subviews) {
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

#define ABI35_0_0RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(ABI35_0_0YGValue)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (ABI35_0_0YGValue)margin##prop                           \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

ABI35_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI35_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI35_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI35_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI35_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI35_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI35_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)
ABI35_0_0RCT_MARGIN_PROPERTY(Start, START)
ABI35_0_0RCT_MARGIN_PROPERTY(End, END)

// Padding

#define ABI35_0_0RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(ABI35_0_0YGValue)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (ABI35_0_0YGValue)padding##prop                           \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

ABI35_0_0RCT_PADDING_PROPERTY(, ALL)
ABI35_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI35_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI35_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI35_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI35_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI35_0_0RCT_PADDING_PROPERTY(Right, RIGHT)
ABI35_0_0RCT_PADDING_PROPERTY(Start, START)
ABI35_0_0RCT_PADDING_PROPERTY(End, END)

// Border

#define ABI35_0_0RCT_BORDER_PROPERTY(prop, metaProp)             \
- (void)setBorder##prop##Width:(float)value             \
{                                                       \
  _borderMetaProps[META_PROP_##metaProp].value = value; \
  _recomputeBorder = YES;                               \
}                                                       \
- (float)border##prop##Width                            \
{                                                       \
  return _borderMetaProps[META_PROP_##metaProp].value;  \
}

ABI35_0_0RCT_BORDER_PROPERTY(, ALL)
ABI35_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI35_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI35_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI35_0_0RCT_BORDER_PROPERTY(Right, RIGHT)
ABI35_0_0RCT_BORDER_PROPERTY(Start, START)
ABI35_0_0RCT_BORDER_PROPERTY(End, END)

// Dimensions
#define ABI35_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(ABI35_0_0YGValue)value                                 \
{                                                                   \
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(value, ABI35_0_0YGNodeStyleSet##cssProp, _ABI35_0_0yogaNode);  \
}                                                                   \
- (ABI35_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI35_0_0YGNodeStyleGet##cssProp(_ABI35_0_0yogaNode);                        \
}

#define ABI35_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(setProp, getProp, cssProp)   \
- (void)set##setProp:(ABI35_0_0YGValue)value                                 \
{                                                                   \
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(value, ABI35_0_0YGNodeStyleSet##cssProp, _ABI35_0_0yogaNode);       \
}                                                                   \
- (ABI35_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI35_0_0YGNodeStyleGet##cssProp(_ABI35_0_0yogaNode);                        \
}

ABI35_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI35_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI35_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI35_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI35_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI35_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI35_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(ABI35_0_0YGValue)value                                 \
{                                                                   \
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(value, ABI35_0_0YGNodeStyleSetPosition, _ABI35_0_0yogaNode, edge);  \
}                                                                   \
- (ABI35_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI35_0_0YGNodeStyleGetPosition(_ABI35_0_0yogaNode, edge);                   \
}


ABI35_0_0RCT_POSITION_PROPERTY(Top, top, ABI35_0_0YGEdgeTop)
ABI35_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI35_0_0YGEdgeBottom)
ABI35_0_0RCT_POSITION_PROPERTY(Start, start, ABI35_0_0YGEdgeStart)
ABI35_0_0RCT_POSITION_PROPERTY(End, end, ABI35_0_0YGEdgeEnd)

- (void)setLeft:(ABI35_0_0YGValue)value
{
  ABI35_0_0YGEdge edge = [[ABI35_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI35_0_0YGEdgeStart : ABI35_0_0YGEdgeLeft;
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(value, ABI35_0_0YGNodeStyleSetPosition, _ABI35_0_0yogaNode, edge);
}
- (ABI35_0_0YGValue)left
{
  ABI35_0_0YGEdge edge = [[ABI35_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI35_0_0YGEdgeStart : ABI35_0_0YGEdgeLeft;
  return ABI35_0_0YGNodeStyleGetPosition(_ABI35_0_0yogaNode, edge);
}

- (void)setRight:(ABI35_0_0YGValue)value
{
  ABI35_0_0YGEdge edge = [[ABI35_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI35_0_0YGEdgeEnd : ABI35_0_0YGEdgeRight;
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE(value, ABI35_0_0YGNodeStyleSetPosition, _ABI35_0_0yogaNode, edge);
}
- (ABI35_0_0YGValue)right
{
  ABI35_0_0YGEdge edge = [[ABI35_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI35_0_0YGEdgeEnd : ABI35_0_0YGEdgeRight;
  return ABI35_0_0YGNodeStyleGetPosition(_ABI35_0_0yogaNode, edge);
}

// Size

- (CGSize)size
{
  ABI35_0_0YGValue width = ABI35_0_0YGNodeStyleGetWidth(_ABI35_0_0yogaNode);
  ABI35_0_0YGValue height = ABI35_0_0YGNodeStyleGetHeight(_ABI35_0_0yogaNode);

  return CGSizeMake(
    width.unit == ABI35_0_0YGUnitPoint ? width.value : NAN,
    height.unit == ABI35_0_0YGUnitPoint ? height.value : NAN
  );
}

- (void)setSize:(CGSize)size
{
  ABI35_0_0YGNodeStyleSetWidth(_ABI35_0_0yogaNode, size.width);
  ABI35_0_0YGNodeStyleSetHeight(_ABI35_0_0yogaNode, size.height);
}

// IntrinsicContentSize

static inline ABI35_0_0YGSize ABI35_0_0RCTShadowViewMeasure(ABI35_0_0YGNodeRef node, float width, ABI35_0_0YGMeasureMode widthMode, float height, ABI35_0_0YGMeasureMode heightMode)
{
  ABI35_0_0RCTShadowView *shadowView = (__bridge ABI35_0_0RCTShadowView *)ABI35_0_0YGNodeGetContext(node);

  CGSize intrinsicContentSize = shadowView->_intrinsicContentSize;
  // Replace `UIViewNoIntrinsicMetric` (which equals `-1`) with zero.
  intrinsicContentSize.width = MAX(0, intrinsicContentSize.width);
  intrinsicContentSize.height = MAX(0, intrinsicContentSize.height);

  ABI35_0_0YGSize result;

  switch (widthMode) {
    case ABI35_0_0YGMeasureModeUndefined:
      result.width = intrinsicContentSize.width;
      break;
    case ABI35_0_0YGMeasureModeExactly:
      result.width = width;
      break;
    case ABI35_0_0YGMeasureModeAtMost:
      result.width = MIN(width, intrinsicContentSize.width);
      break;
  }

  switch (heightMode) {
    case ABI35_0_0YGMeasureModeUndefined:
      result.height = intrinsicContentSize.height;
      break;
    case ABI35_0_0YGMeasureModeExactly:
      result.height = height;
      break;
    case ABI35_0_0YGMeasureModeAtMost:
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
    ABI35_0_0YGNodeSetMeasureFunc(_ABI35_0_0yogaNode, NULL);
  } else {
    ABI35_0_0YGNodeSetMeasureFunc(_ABI35_0_0yogaNode, ABI35_0_0RCTShadowViewMeasure);
  }

  ABI35_0_0YGNodeMarkDirty(_ABI35_0_0yogaNode);
}

// Local Data

- (void)setLocalData:(__unused NSObject *)localData
{
  // Do nothing by default.
}

// Flex

- (void)setFlexBasis:(ABI35_0_0YGValue)value
{
  ABI35_0_0RCT_SET_ABI35_0_0YGVALUE_AUTO(value, ABI35_0_0YGNodeStyleSetFlexBasis, _ABI35_0_0yogaNode);
}

- (ABI35_0_0YGValue)flexBasis
{
  return ABI35_0_0YGNodeStyleGetFlexBasis(_ABI35_0_0yogaNode);
}

#define ABI35_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  ABI35_0_0YGNodeStyleSet##cssProp(_ABI35_0_0yogaNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return ABI35_0_0YGNodeStyleGet##cssProp(_ABI35_0_0yogaNode);                \
}

ABI35_0_0RCT_STYLE_PROPERTY(Flex, flex, Flex, float)
ABI35_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
ABI35_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
ABI35_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI35_0_0YGFlexDirection)
ABI35_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI35_0_0YGJustify)
ABI35_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI35_0_0YGAlign)
ABI35_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI35_0_0YGAlign)
ABI35_0_0RCT_STYLE_PROPERTY(AlignContent, alignContent, AlignContent, ABI35_0_0YGAlign)
ABI35_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI35_0_0YGPositionType)
ABI35_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI35_0_0YGWrap)
ABI35_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI35_0_0YGOverflow)
ABI35_0_0RCT_STYLE_PROPERTY(Display, display, Display, ABI35_0_0YGDisplay)
ABI35_0_0RCT_STYLE_PROPERTY(Direction, direction, Direction, ABI35_0_0YGDirection)
ABI35_0_0RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)didUpdateReactABI35_0_0Subviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI35_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _ABI35_0_0yogaNode);
  }
  if (_recomputeMargin) {
    ABI35_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _ABI35_0_0yogaNode);
  }
  if (_recomputeBorder) {
    ABI35_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _ABI35_0_0yogaNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
