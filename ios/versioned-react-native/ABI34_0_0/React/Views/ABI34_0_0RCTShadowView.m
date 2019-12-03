/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTShadowView.h"

#import "ABI34_0_0RCTConvert.h"
#import "ABI34_0_0RCTI18nUtil.h"
#import "ABI34_0_0RCTLayout.h"
#import "ABI34_0_0RCTLog.h"
#import "ABI34_0_0RCTShadowView+Layout.h"
#import "ABI34_0_0RCTUtils.h"
#import "ABI34_0_0UIView+Private.h"
#import "UIView+ReactABI34_0_0.h"

typedef void (^ABI34_0_0RCTActionBlock)(ABI34_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI34_0_0RCTResetActionBlock)(ABI34_0_0RCTShadowView *shadowViewSelf);

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

@implementation ABI34_0_0RCTShadowView
{
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI34_0_0RCTShadowView *> *_ReactABI34_0_0Subviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  ABI34_0_0YGValue _paddingMetaProps[META_PROP_COUNT];
  ABI34_0_0YGValue _marginMetaProps[META_PROP_COUNT];
  ABI34_0_0YGValue _borderMetaProps[META_PROP_COUNT];
}

+ (ABI34_0_0YGConfigRef)ABI34_0_0yogaConfig
{
  static ABI34_0_0YGConfigRef ABI34_0_0yogaConfig;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI34_0_0yogaConfig = ABI34_0_0YGConfigNew();
    ABI34_0_0YGConfigSetPointScaleFactor(ABI34_0_0yogaConfig, ABI34_0_0RCTScreenScale());
    ABI34_0_0YGConfigSetUseLegacyStretchBehaviour(ABI34_0_0yogaConfig, true);
  });
  return ABI34_0_0yogaConfig;
}

@synthesize ReactABI34_0_0Tag = _ReactABI34_0_0Tag;

// YogaNode API

static void ABI34_0_0RCTPrint(ABI34_0_0YGNodeRef node)
{
  ABI34_0_0RCTShadowView *shadowView = (__bridge ABI34_0_0RCTShadowView *)ABI34_0_0YGNodeGetContext(node);
  printf("%s(%lld), ", shadowView.viewName.UTF8String, (long long)shadowView.ReactABI34_0_0Tag.integerValue);
}

#define ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(ygvalue, setter, ...)    \
switch (ygvalue.unit) {                          \
  case ABI34_0_0YGUnitAuto:                               \
  case ABI34_0_0YGUnitUndefined:                          \
    setter(__VA_ARGS__, ABI34_0_0YGUndefined);            \
    break;                                       \
  case ABI34_0_0YGUnitPoint:                              \
    setter(__VA_ARGS__, ygvalue.value);          \
    break;                                       \
  case ABI34_0_0YGUnitPercent:                            \
    setter##Percent(__VA_ARGS__, ygvalue.value); \
    break;                                       \
}

#define ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(ygvalue, setter, ...) \
switch (ygvalue.unit) {                            \
  case ABI34_0_0YGUnitAuto:                                 \
    setter##Auto(__VA_ARGS__);                     \
    break;                                         \
  case ABI34_0_0YGUnitUndefined:                            \
    setter(__VA_ARGS__, ABI34_0_0YGUndefined);              \
    break;                                         \
  case ABI34_0_0YGUnitPoint:                                \
    setter(__VA_ARGS__, ygvalue.value);            \
    break;                                         \
  case ABI34_0_0YGUnitPercent:                              \
    setter##Percent(__VA_ARGS__, ygvalue.value);   \
    break;                                         \
}

static void ABI34_0_0RCTProcessMetaPropsPadding(const ABI34_0_0YGValue metaProps[META_PROP_COUNT], ABI34_0_0YGNodeRef node) {
  if (![[ABI34_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(metaProps[META_PROP_START], ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeStart);
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(metaProps[META_PROP_END], ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeEnd);
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(metaProps[META_PROP_LEFT], ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeLeft);
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(metaProps[META_PROP_RIGHT], ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeRight);
  } else {
    ABI34_0_0YGValue start = metaProps[META_PROP_START].unit == ABI34_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI34_0_0YGValue end = metaProps[META_PROP_END].unit == ABI34_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(start, ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeStart);
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(end, ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeEnd);
  }
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(metaProps[META_PROP_TOP], ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeTop);
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(metaProps[META_PROP_BOTTOM], ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeBottom);
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(metaProps[META_PROP_HORIZONTAL], ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeHorizontal);
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(metaProps[META_PROP_VERTICAL], ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeVertical);
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(metaProps[META_PROP_ALL], ABI34_0_0YGNodeStyleSetPadding, node, ABI34_0_0YGEdgeAll);
}

static void ABI34_0_0RCTProcessMetaPropsMargin(const ABI34_0_0YGValue metaProps[META_PROP_COUNT], ABI34_0_0YGNodeRef node) {
  if (![[ABI34_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(metaProps[META_PROP_START], ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeStart);
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(metaProps[META_PROP_END], ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeEnd);
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(metaProps[META_PROP_LEFT], ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeLeft);
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(metaProps[META_PROP_RIGHT], ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeRight);
  } else {
    ABI34_0_0YGValue start = metaProps[META_PROP_START].unit == ABI34_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI34_0_0YGValue end = metaProps[META_PROP_END].unit == ABI34_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(start, ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeStart);
    ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(end, ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeEnd);
  }
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(metaProps[META_PROP_TOP], ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeTop);
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(metaProps[META_PROP_BOTTOM], ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeBottom);
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(metaProps[META_PROP_HORIZONTAL], ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeHorizontal);
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(metaProps[META_PROP_VERTICAL], ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeVertical);
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(metaProps[META_PROP_ALL], ABI34_0_0YGNodeStyleSetMargin, node, ABI34_0_0YGEdgeAll);
}

static void ABI34_0_0RCTProcessMetaPropsBorder(const ABI34_0_0YGValue metaProps[META_PROP_COUNT], ABI34_0_0YGNodeRef node) {
  if (![[ABI34_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeStart, metaProps[META_PROP_START].value);
    ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeEnd, metaProps[META_PROP_END].value);
    ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeLeft, metaProps[META_PROP_LEFT].value);
    ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeRight, metaProps[META_PROP_RIGHT].value);
  } else {
    const float start = ABI34_0_0YGFloatIsUndefined(metaProps[META_PROP_START].value) ? metaProps[META_PROP_LEFT].value : metaProps[META_PROP_START].value;
    const float end = ABI34_0_0YGFloatIsUndefined(metaProps[META_PROP_END].value) ? metaProps[META_PROP_RIGHT].value : metaProps[META_PROP_END].value;
    ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeStart, start);
    ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeEnd, end);
  }
  ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeTop, metaProps[META_PROP_TOP].value);
  ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  ABI34_0_0YGNodeStyleSetBorder(node, ABI34_0_0YGEdgeAll, metaProps[META_PROP_ALL].value);
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI34_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  ABI34_0_0RCTShadowView *shadowView = self;
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

- (BOOL)viewIsDescendantOf:(ABI34_0_0RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  ABI34_0_0RCTShadowView *shadowView = self;
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
      _paddingMetaProps[ii] = ABI34_0_0YGValueUndefined;
      _marginMetaProps[ii] = ABI34_0_0YGValueUndefined;
      _borderMetaProps[ii] = ABI34_0_0YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;

    _ReactABI34_0_0Subviews = [NSMutableArray array];

    _ABI34_0_0yogaNode = ABI34_0_0YGNodeNewWithConfig([[self class] ABI34_0_0yogaConfig]);
     ABI34_0_0YGNodeSetContext(_ABI34_0_0yogaNode, (__bridge void *)self);
     ABI34_0_0YGNodeSetPrintFunc(_ABI34_0_0yogaNode, ABI34_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isReactABI34_0_0RootView
{
  return ABI34_0_0RCTIsReactABI34_0_0RootView(self.ReactABI34_0_0Tag);
}

- (void)dealloc
{
  ABI34_0_0YGNodeFree(_ABI34_0_0yogaNode);
}

- (BOOL)canHaveSubviews
{
  return YES;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)insertReactABI34_0_0Subview:(ABI34_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  ABI34_0_0RCTAssert(self.canHaveSubviews, @"Attempt to insert subview inside leaf view.");

  [_ReactABI34_0_0Subviews insertObject:subview atIndex:atIndex];
  if (![self isYogaLeafNode]) {
    ABI34_0_0YGNodeInsertChild(_ABI34_0_0yogaNode, subview.ABI34_0_0yogaNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
}

- (void)removeReactABI34_0_0Subview:(ABI34_0_0RCTShadowView *)subview
{
  subview->_superview = nil;
  [_ReactABI34_0_0Subviews removeObject:subview];
  if (![self isYogaLeafNode]) {
    ABI34_0_0YGNodeRemoveChild(_ABI34_0_0yogaNode, subview.ABI34_0_0yogaNode);
  }
}

- (NSArray<ABI34_0_0RCTShadowView *> *)ReactABI34_0_0Subviews
{
  return _ReactABI34_0_0Subviews;
}

- (ABI34_0_0RCTShadowView *)ReactABI34_0_0Superview
{
  return _superview;
}

#pragma mark - Layout

- (void)layoutWithMinimumSize:(CGSize)minimumSize
                  maximumSize:(CGSize)maximumSize
              layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
                layoutContext:(ABI34_0_0RCTLayoutContext)layoutContext
{
  ABI34_0_0YGNodeRef ABI34_0_0yogaNode = _ABI34_0_0yogaNode;

  CGSize oldMinimumSize = (CGSize){
    ABI34_0_0RCTCoreGraphicsFloatFromYogaValue(ABI34_0_0YGNodeStyleGetMinWidth(ABI34_0_0yogaNode), 0.0),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaValue(ABI34_0_0YGNodeStyleGetMinHeight(ABI34_0_0yogaNode), 0.0)
  };

  if (!CGSizeEqualToSize(oldMinimumSize, minimumSize)) {
    ABI34_0_0YGNodeStyleSetMinWidth(ABI34_0_0yogaNode, ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
    ABI34_0_0YGNodeStyleSetMinHeight(ABI34_0_0yogaNode, ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  }

  ABI34_0_0YGNodeCalculateLayout(
    ABI34_0_0yogaNode,
    ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width),
    ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height),
    ABI34_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(layoutDirection)
  );

  ABI34_0_0RCTAssert(!ABI34_0_0YGNodeIsDirty(ABI34_0_0yogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

  if (!ABI34_0_0YGNodeGetHasNewLayout(ABI34_0_0yogaNode)) {
    return;
  }

  ABI34_0_0YGNodeSetHasNewLayout(ABI34_0_0yogaNode, false);

  ABI34_0_0RCTLayoutMetrics layoutMetrics = ABI34_0_0RCTLayoutMetricsFromYogaNode(ABI34_0_0yogaNode);

  layoutContext.absolutePosition.x += layoutMetrics.frame.origin.x;
  layoutContext.absolutePosition.y += layoutMetrics.frame.origin.y;

  [self layoutWithMetrics:layoutMetrics
            layoutContext:layoutContext];

  [self layoutSubviewsWithContext:layoutContext];
}

- (void)layoutWithMetrics:(ABI34_0_0RCTLayoutMetrics)layoutMetrics
            layoutContext:(ABI34_0_0RCTLayoutContext)layoutContext
{
  if (!ABI34_0_0RCTLayoutMetricsEqualToLayoutMetrics(self.layoutMetrics, layoutMetrics)) {
    self.layoutMetrics = layoutMetrics;
    [layoutContext.affectedShadowViews addObject:self];
  }
}

- (void)layoutSubviewsWithContext:(ABI34_0_0RCTLayoutContext)layoutContext
{
  ABI34_0_0RCTLayoutMetrics layoutMetrics = self.layoutMetrics;

  if (layoutMetrics.displayType == ABI34_0_0RCTDisplayTypeNone) {
    return;
  }

  for (ABI34_0_0RCTShadowView *childShadowView in _ReactABI34_0_0Subviews) {
    ABI34_0_0YGNodeRef childYogaNode = childShadowView.ABI34_0_0yogaNode;

    ABI34_0_0RCTAssert(!ABI34_0_0YGNodeIsDirty(childYogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

    if (!ABI34_0_0YGNodeGetHasNewLayout(childYogaNode)) {
      continue;
    }

    ABI34_0_0YGNodeSetHasNewLayout(childYogaNode, false);

    ABI34_0_0RCTLayoutMetrics childLayoutMetrics = ABI34_0_0RCTLayoutMetricsFromYogaNode(childYogaNode);

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
  ABI34_0_0YGNodeRef clonedYogaNode = ABI34_0_0YGNodeClone(self.ABI34_0_0yogaNode);
  ABI34_0_0YGNodeRef constraintYogaNode = ABI34_0_0YGNodeNewWithConfig([[self class] ABI34_0_0yogaConfig]);

  ABI34_0_0YGNodeInsertChild(constraintYogaNode, clonedYogaNode, 0);

  ABI34_0_0YGNodeStyleSetMinWidth(constraintYogaNode, ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  ABI34_0_0YGNodeStyleSetMinHeight(constraintYogaNode, ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  ABI34_0_0YGNodeStyleSetMaxWidth(constraintYogaNode, ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width));
  ABI34_0_0YGNodeStyleSetMaxHeight(constraintYogaNode, ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height));

  ABI34_0_0YGNodeCalculateLayout(
    constraintYogaNode,
    ABI34_0_0YGUndefined,
    ABI34_0_0YGUndefined,
    ABI34_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(self.layoutMetrics.layoutDirection)
  );

  CGSize measuredSize = (CGSize){
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetWidth(constraintYogaNode)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetHeight(constraintYogaNode)),
  };

  ABI34_0_0YGNodeRemoveChild(constraintYogaNode, clonedYogaNode);
  ABI34_0_0YGNodeFree(constraintYogaNode);
  ABI34_0_0YGNodeFree(clonedYogaNode);

  return measuredSize;
}

- (NSNumber *)ReactABI34_0_0TagAtPoint:(CGPoint)point
{
  for (ABI34_0_0RCTShadowView *shadowView in _ReactABI34_0_0Subviews) {
    if (CGRectContainsPoint(shadowView.layoutMetrics.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.layoutMetrics.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ReactABI34_0_0TagAtPoint:relativePoint];
    }
  }
  return self.ReactABI34_0_0Tag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; ReactABI34_0_0Tag: %@; frame: %@>", self.viewName, self.ReactABI34_0_0Tag, NSStringFromCGRect(self.layoutMetrics.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI34_0_0RCTShadowView *subview in _ReactABI34_0_0Subviews) {
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

#define ABI34_0_0RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(ABI34_0_0YGValue)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (ABI34_0_0YGValue)margin##prop                           \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

ABI34_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI34_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI34_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI34_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI34_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI34_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI34_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)
ABI34_0_0RCT_MARGIN_PROPERTY(Start, START)
ABI34_0_0RCT_MARGIN_PROPERTY(End, END)

// Padding

#define ABI34_0_0RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(ABI34_0_0YGValue)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (ABI34_0_0YGValue)padding##prop                           \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

ABI34_0_0RCT_PADDING_PROPERTY(, ALL)
ABI34_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI34_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI34_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI34_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI34_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI34_0_0RCT_PADDING_PROPERTY(Right, RIGHT)
ABI34_0_0RCT_PADDING_PROPERTY(Start, START)
ABI34_0_0RCT_PADDING_PROPERTY(End, END)

// Border

#define ABI34_0_0RCT_BORDER_PROPERTY(prop, metaProp)             \
- (void)setBorder##prop##Width:(float)value             \
{                                                       \
  _borderMetaProps[META_PROP_##metaProp].value = value; \
  _recomputeBorder = YES;                               \
}                                                       \
- (float)border##prop##Width                            \
{                                                       \
  return _borderMetaProps[META_PROP_##metaProp].value;  \
}

ABI34_0_0RCT_BORDER_PROPERTY(, ALL)
ABI34_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI34_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI34_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI34_0_0RCT_BORDER_PROPERTY(Right, RIGHT)
ABI34_0_0RCT_BORDER_PROPERTY(Start, START)
ABI34_0_0RCT_BORDER_PROPERTY(End, END)

// Dimensions
#define ABI34_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(ABI34_0_0YGValue)value                                 \
{                                                                   \
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(value, ABI34_0_0YGNodeStyleSet##cssProp, _ABI34_0_0yogaNode);  \
}                                                                   \
- (ABI34_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI34_0_0YGNodeStyleGet##cssProp(_ABI34_0_0yogaNode);                        \
}

#define ABI34_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(setProp, getProp, cssProp)   \
- (void)set##setProp:(ABI34_0_0YGValue)value                                 \
{                                                                   \
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(value, ABI34_0_0YGNodeStyleSet##cssProp, _ABI34_0_0yogaNode);       \
}                                                                   \
- (ABI34_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI34_0_0YGNodeStyleGet##cssProp(_ABI34_0_0yogaNode);                        \
}

ABI34_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI34_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI34_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI34_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI34_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI34_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI34_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(ABI34_0_0YGValue)value                                 \
{                                                                   \
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(value, ABI34_0_0YGNodeStyleSetPosition, _ABI34_0_0yogaNode, edge);  \
}                                                                   \
- (ABI34_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI34_0_0YGNodeStyleGetPosition(_ABI34_0_0yogaNode, edge);                   \
}


ABI34_0_0RCT_POSITION_PROPERTY(Top, top, ABI34_0_0YGEdgeTop)
ABI34_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI34_0_0YGEdgeBottom)
ABI34_0_0RCT_POSITION_PROPERTY(Start, start, ABI34_0_0YGEdgeStart)
ABI34_0_0RCT_POSITION_PROPERTY(End, end, ABI34_0_0YGEdgeEnd)

- (void)setLeft:(ABI34_0_0YGValue)value
{
  ABI34_0_0YGEdge edge = [[ABI34_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI34_0_0YGEdgeStart : ABI34_0_0YGEdgeLeft;
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(value, ABI34_0_0YGNodeStyleSetPosition, _ABI34_0_0yogaNode, edge);
}
- (ABI34_0_0YGValue)left
{
  ABI34_0_0YGEdge edge = [[ABI34_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI34_0_0YGEdgeStart : ABI34_0_0YGEdgeLeft;
  return ABI34_0_0YGNodeStyleGetPosition(_ABI34_0_0yogaNode, edge);
}

- (void)setRight:(ABI34_0_0YGValue)value
{
  ABI34_0_0YGEdge edge = [[ABI34_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI34_0_0YGEdgeEnd : ABI34_0_0YGEdgeRight;
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE(value, ABI34_0_0YGNodeStyleSetPosition, _ABI34_0_0yogaNode, edge);
}
- (ABI34_0_0YGValue)right
{
  ABI34_0_0YGEdge edge = [[ABI34_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI34_0_0YGEdgeEnd : ABI34_0_0YGEdgeRight;
  return ABI34_0_0YGNodeStyleGetPosition(_ABI34_0_0yogaNode, edge);
}

// Size

- (CGSize)size
{
  ABI34_0_0YGValue width = ABI34_0_0YGNodeStyleGetWidth(_ABI34_0_0yogaNode);
  ABI34_0_0YGValue height = ABI34_0_0YGNodeStyleGetHeight(_ABI34_0_0yogaNode);

  return CGSizeMake(
    width.unit == ABI34_0_0YGUnitPoint ? width.value : NAN,
    height.unit == ABI34_0_0YGUnitPoint ? height.value : NAN
  );
}

- (void)setSize:(CGSize)size
{
  ABI34_0_0YGNodeStyleSetWidth(_ABI34_0_0yogaNode, size.width);
  ABI34_0_0YGNodeStyleSetHeight(_ABI34_0_0yogaNode, size.height);
}

// IntrinsicContentSize

static inline ABI34_0_0YGSize ABI34_0_0RCTShadowViewMeasure(ABI34_0_0YGNodeRef node, float width, ABI34_0_0YGMeasureMode widthMode, float height, ABI34_0_0YGMeasureMode heightMode)
{
  ABI34_0_0RCTShadowView *shadowView = (__bridge ABI34_0_0RCTShadowView *)ABI34_0_0YGNodeGetContext(node);

  CGSize intrinsicContentSize = shadowView->_intrinsicContentSize;
  // Replace `UIViewNoIntrinsicMetric` (which equals `-1`) with zero.
  intrinsicContentSize.width = MAX(0, intrinsicContentSize.width);
  intrinsicContentSize.height = MAX(0, intrinsicContentSize.height);

  ABI34_0_0YGSize result;

  switch (widthMode) {
    case ABI34_0_0YGMeasureModeUndefined:
      result.width = intrinsicContentSize.width;
      break;
    case ABI34_0_0YGMeasureModeExactly:
      result.width = width;
      break;
    case ABI34_0_0YGMeasureModeAtMost:
      result.width = MIN(width, intrinsicContentSize.width);
      break;
  }

  switch (heightMode) {
    case ABI34_0_0YGMeasureModeUndefined:
      result.height = intrinsicContentSize.height;
      break;
    case ABI34_0_0YGMeasureModeExactly:
      result.height = height;
      break;
    case ABI34_0_0YGMeasureModeAtMost:
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
    ABI34_0_0YGNodeSetMeasureFunc(_ABI34_0_0yogaNode, NULL);
  } else {
    ABI34_0_0YGNodeSetMeasureFunc(_ABI34_0_0yogaNode, ABI34_0_0RCTShadowViewMeasure);
  }

  ABI34_0_0YGNodeMarkDirty(_ABI34_0_0yogaNode);
}

// Local Data

- (void)setLocalData:(__unused NSObject *)localData
{
  // Do nothing by default.
}

// Flex

- (void)setFlexBasis:(ABI34_0_0YGValue)value
{
  ABI34_0_0RCT_SET_ABI34_0_0YGVALUE_AUTO(value, ABI34_0_0YGNodeStyleSetFlexBasis, _ABI34_0_0yogaNode);
}

- (ABI34_0_0YGValue)flexBasis
{
  return ABI34_0_0YGNodeStyleGetFlexBasis(_ABI34_0_0yogaNode);
}

#define ABI34_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  ABI34_0_0YGNodeStyleSet##cssProp(_ABI34_0_0yogaNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return ABI34_0_0YGNodeStyleGet##cssProp(_ABI34_0_0yogaNode);                \
}

ABI34_0_0RCT_STYLE_PROPERTY(Flex, flex, Flex, float)
ABI34_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
ABI34_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
ABI34_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI34_0_0YGFlexDirection)
ABI34_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI34_0_0YGJustify)
ABI34_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI34_0_0YGAlign)
ABI34_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI34_0_0YGAlign)
ABI34_0_0RCT_STYLE_PROPERTY(AlignContent, alignContent, AlignContent, ABI34_0_0YGAlign)
ABI34_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI34_0_0YGPositionType)
ABI34_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI34_0_0YGWrap)
ABI34_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI34_0_0YGOverflow)
ABI34_0_0RCT_STYLE_PROPERTY(Display, display, Display, ABI34_0_0YGDisplay)
ABI34_0_0RCT_STYLE_PROPERTY(Direction, direction, Direction, ABI34_0_0YGDirection)
ABI34_0_0RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)didUpdateReactABI34_0_0Subviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI34_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _ABI34_0_0yogaNode);
  }
  if (_recomputeMargin) {
    ABI34_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _ABI34_0_0yogaNode);
  }
  if (_recomputeBorder) {
    ABI34_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _ABI34_0_0yogaNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
