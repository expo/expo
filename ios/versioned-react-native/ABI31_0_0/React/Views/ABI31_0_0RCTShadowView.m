/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTShadowView.h"

#import "ABI31_0_0RCTConvert.h"
#import "ABI31_0_0RCTI18nUtil.h"
#import "ABI31_0_0RCTLayout.h"
#import "ABI31_0_0RCTLog.h"
#import "ABI31_0_0RCTShadowView+Layout.h"
#import "ABI31_0_0RCTUtils.h"
#import "ABI31_0_0UIView+Private.h"
#import "UIView+ReactABI31_0_0.h"

typedef void (^ABI31_0_0RCTActionBlock)(ABI31_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI31_0_0RCTResetActionBlock)(ABI31_0_0RCTShadowView *shadowViewSelf);

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

@implementation ABI31_0_0RCTShadowView
{
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI31_0_0RCTShadowView *> *_ReactABI31_0_0Subviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  ABI31_0_0YGValue _paddingMetaProps[META_PROP_COUNT];
  ABI31_0_0YGValue _marginMetaProps[META_PROP_COUNT];
  ABI31_0_0YGValue _borderMetaProps[META_PROP_COUNT];
}

+ (ABI31_0_0YGConfigRef)yogaConfig
{
  static ABI31_0_0YGConfigRef yogaConfig;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    yogaConfig = ABI31_0_0YGConfigNew();
    ABI31_0_0YGConfigSetPointScaleFactor(yogaConfig, ABI31_0_0RCTScreenScale());
    ABI31_0_0YGConfigSetUseLegacyStretchBehaviour(yogaConfig, true);
  });
  return yogaConfig;
}

@synthesize ReactABI31_0_0Tag = _ReactABI31_0_0Tag;

// YogaNode API

static void ABI31_0_0RCTPrint(ABI31_0_0YGNodeRef node)
{
  ABI31_0_0RCTShadowView *shadowView = (__bridge ABI31_0_0RCTShadowView *)ABI31_0_0YGNodeGetContext(node);
  printf("%s(%lld), ", shadowView.viewName.UTF8String, (long long)shadowView.ReactABI31_0_0Tag.integerValue);
}

#define ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(ygvalue, setter, ...)    \
switch (ygvalue.unit) {                          \
  case ABI31_0_0YGUnitAuto:                               \
  case ABI31_0_0YGUnitUndefined:                          \
    setter(__VA_ARGS__, ABI31_0_0YGUndefined);            \
    break;                                       \
  case ABI31_0_0YGUnitPoint:                              \
    setter(__VA_ARGS__, ygvalue.value);          \
    break;                                       \
  case ABI31_0_0YGUnitPercent:                            \
    setter##Percent(__VA_ARGS__, ygvalue.value); \
    break;                                       \
}

#define ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(ygvalue, setter, ...) \
switch (ygvalue.unit) {                            \
  case ABI31_0_0YGUnitAuto:                                 \
    setter##Auto(__VA_ARGS__);                     \
    break;                                         \
  case ABI31_0_0YGUnitUndefined:                            \
    setter(__VA_ARGS__, ABI31_0_0YGUndefined);              \
    break;                                         \
  case ABI31_0_0YGUnitPoint:                                \
    setter(__VA_ARGS__, ygvalue.value);            \
    break;                                         \
  case ABI31_0_0YGUnitPercent:                              \
    setter##Percent(__VA_ARGS__, ygvalue.value);   \
    break;                                         \
}

static void ABI31_0_0RCTProcessMetaPropsPadding(const ABI31_0_0YGValue metaProps[META_PROP_COUNT], ABI31_0_0YGNodeRef node) {
  if (![[ABI31_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(metaProps[META_PROP_START], ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeStart);
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(metaProps[META_PROP_END], ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeEnd);
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(metaProps[META_PROP_LEFT], ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeLeft);
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(metaProps[META_PROP_RIGHT], ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeRight);
  } else {
    ABI31_0_0YGValue start = metaProps[META_PROP_START].unit == ABI31_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI31_0_0YGValue end = metaProps[META_PROP_END].unit == ABI31_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(start, ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeStart);
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(end, ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeEnd);
  }
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(metaProps[META_PROP_TOP], ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeTop);
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(metaProps[META_PROP_BOTTOM], ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeBottom);
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(metaProps[META_PROP_HORIZONTAL], ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeHorizontal);
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(metaProps[META_PROP_VERTICAL], ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeVertical);
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(metaProps[META_PROP_ALL], ABI31_0_0YGNodeStyleSetPadding, node, ABI31_0_0YGEdgeAll);
}

static void ABI31_0_0RCTProcessMetaPropsMargin(const ABI31_0_0YGValue metaProps[META_PROP_COUNT], ABI31_0_0YGNodeRef node) {
  if (![[ABI31_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(metaProps[META_PROP_START], ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeStart);
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(metaProps[META_PROP_END], ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeEnd);
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(metaProps[META_PROP_LEFT], ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeLeft);
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(metaProps[META_PROP_RIGHT], ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeRight);
  } else {
    ABI31_0_0YGValue start = metaProps[META_PROP_START].unit == ABI31_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI31_0_0YGValue end = metaProps[META_PROP_END].unit == ABI31_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(start, ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeStart);
    ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(end, ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeEnd);
  }
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(metaProps[META_PROP_TOP], ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeTop);
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(metaProps[META_PROP_BOTTOM], ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeBottom);
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(metaProps[META_PROP_HORIZONTAL], ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeHorizontal);
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(metaProps[META_PROP_VERTICAL], ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeVertical);
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(metaProps[META_PROP_ALL], ABI31_0_0YGNodeStyleSetMargin, node, ABI31_0_0YGEdgeAll);
}

static void ABI31_0_0RCTProcessMetaPropsBorder(const ABI31_0_0YGValue metaProps[META_PROP_COUNT], ABI31_0_0YGNodeRef node) {
  if (![[ABI31_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeStart, metaProps[META_PROP_START].value);
    ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeEnd, metaProps[META_PROP_END].value);
    ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeLeft, metaProps[META_PROP_LEFT].value);
    ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeRight, metaProps[META_PROP_RIGHT].value);
  } else {
    const float start = ABI31_0_0YGFloatIsUndefined(metaProps[META_PROP_START].value) ? metaProps[META_PROP_LEFT].value : metaProps[META_PROP_START].value;
    const float end = ABI31_0_0YGFloatIsUndefined(metaProps[META_PROP_END].value) ? metaProps[META_PROP_RIGHT].value : metaProps[META_PROP_END].value;
    ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeStart, start);
    ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeEnd, end);
  }
  ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeTop, metaProps[META_PROP_TOP].value);
  ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  ABI31_0_0YGNodeStyleSetBorder(node, ABI31_0_0YGEdgeAll, metaProps[META_PROP_ALL].value);
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI31_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  ABI31_0_0RCTShadowView *shadowView = self;
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

- (BOOL)viewIsDescendantOf:(ABI31_0_0RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  ABI31_0_0RCTShadowView *shadowView = self;
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
      _paddingMetaProps[ii] = ABI31_0_0YGValueUndefined;
      _marginMetaProps[ii] = ABI31_0_0YGValueUndefined;
      _borderMetaProps[ii] = ABI31_0_0YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;

    _ReactABI31_0_0Subviews = [NSMutableArray array];

    _yogaNode = ABI31_0_0YGNodeNewWithConfig([[self class] yogaConfig]);
     ABI31_0_0YGNodeSetContext(_yogaNode, (__bridge void *)self);
     ABI31_0_0YGNodeSetPrintFunc(_yogaNode, ABI31_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isReactABI31_0_0RootView
{
  return ABI31_0_0RCTIsReactABI31_0_0RootView(self.ReactABI31_0_0Tag);
}

- (void)dealloc
{
  ABI31_0_0YGNodeFree(_yogaNode);
}

- (BOOL)canHaveSubviews
{
  return YES;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)insertReactABI31_0_0Subview:(ABI31_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  ABI31_0_0RCTAssert(self.canHaveSubviews, @"Attempt to insert subview inside leaf view.");

  [_ReactABI31_0_0Subviews insertObject:subview atIndex:atIndex];
  if (![self isYogaLeafNode]) {
    ABI31_0_0YGNodeInsertChild(_yogaNode, subview.yogaNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
}

- (void)removeReactABI31_0_0Subview:(ABI31_0_0RCTShadowView *)subview
{
  subview->_superview = nil;
  [_ReactABI31_0_0Subviews removeObject:subview];
  if (![self isYogaLeafNode]) {
    ABI31_0_0YGNodeRemoveChild(_yogaNode, subview.yogaNode);
  }
}

- (NSArray<ABI31_0_0RCTShadowView *> *)ReactABI31_0_0Subviews
{
  return _ReactABI31_0_0Subviews;
}

- (ABI31_0_0RCTShadowView *)ReactABI31_0_0Superview
{
  return _superview;
}

#pragma mark - Layout

- (void)layoutWithMinimumSize:(CGSize)minimumSize
                  maximumSize:(CGSize)maximumSize
              layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
                layoutContext:(ABI31_0_0RCTLayoutContext)layoutContext
{
  ABI31_0_0YGNodeRef yogaNode = _yogaNode;

  CGSize oldMinimumSize = (CGSize){
    ABI31_0_0RCTCoreGraphicsFloatFromYogaValue(ABI31_0_0YGNodeStyleGetMinWidth(yogaNode), 0.0),
    ABI31_0_0RCTCoreGraphicsFloatFromYogaValue(ABI31_0_0YGNodeStyleGetMinHeight(yogaNode), 0.0)
  };

  if (!CGSizeEqualToSize(oldMinimumSize, minimumSize)) {
    ABI31_0_0YGNodeStyleSetMinWidth(yogaNode, ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
    ABI31_0_0YGNodeStyleSetMinHeight(yogaNode, ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  }

  ABI31_0_0YGNodeCalculateLayout(
    yogaNode,
    ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width),
    ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height),
    ABI31_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(layoutDirection)
  );

  ABI31_0_0RCTAssert(!ABI31_0_0YGNodeIsDirty(yogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

  if (!ABI31_0_0YGNodeGetHasNewLayout(yogaNode)) {
    return;
  }

  ABI31_0_0YGNodeSetHasNewLayout(yogaNode, false);

  ABI31_0_0RCTLayoutMetrics layoutMetrics = ABI31_0_0RCTLayoutMetricsFromYogaNode(yogaNode);

  layoutContext.absolutePosition.x += layoutMetrics.frame.origin.x;
  layoutContext.absolutePosition.y += layoutMetrics.frame.origin.y;

  [self layoutWithMetrics:layoutMetrics
            layoutContext:layoutContext];

  [self layoutSubviewsWithContext:layoutContext];
}

- (void)layoutWithMetrics:(ABI31_0_0RCTLayoutMetrics)layoutMetrics
            layoutContext:(ABI31_0_0RCTLayoutContext)layoutContext
{
  if (!ABI31_0_0RCTLayoutMetricsEqualToLayoutMetrics(self.layoutMetrics, layoutMetrics)) {
    self.layoutMetrics = layoutMetrics;
    [layoutContext.affectedShadowViews addObject:self];
  }
}

- (void)layoutSubviewsWithContext:(ABI31_0_0RCTLayoutContext)layoutContext
{
  ABI31_0_0RCTLayoutMetrics layoutMetrics = self.layoutMetrics;

  if (layoutMetrics.displayType == ABI31_0_0RCTDisplayTypeNone) {
    return;
  }

  for (ABI31_0_0RCTShadowView *childShadowView in _ReactABI31_0_0Subviews) {
    ABI31_0_0YGNodeRef childYogaNode = childShadowView.yogaNode;

    ABI31_0_0RCTAssert(!ABI31_0_0YGNodeIsDirty(childYogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

    if (!ABI31_0_0YGNodeGetHasNewLayout(childYogaNode)) {
      continue;
    }

    ABI31_0_0YGNodeSetHasNewLayout(childYogaNode, false);

    ABI31_0_0RCTLayoutMetrics childLayoutMetrics = ABI31_0_0RCTLayoutMetricsFromYogaNode(childYogaNode);

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
  ABI31_0_0YGNodeRef clonedYogaNode = ABI31_0_0YGNodeClone(self.yogaNode);
  ABI31_0_0YGNodeRef constraintYogaNode = ABI31_0_0YGNodeNewWithConfig([[self class] yogaConfig]);

  ABI31_0_0YGNodeInsertChild(constraintYogaNode, clonedYogaNode, 0);

  ABI31_0_0YGNodeStyleSetMinWidth(constraintYogaNode, ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  ABI31_0_0YGNodeStyleSetMinHeight(constraintYogaNode, ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  ABI31_0_0YGNodeStyleSetMaxWidth(constraintYogaNode, ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width));
  ABI31_0_0YGNodeStyleSetMaxHeight(constraintYogaNode, ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height));

  ABI31_0_0YGNodeCalculateLayout(
    constraintYogaNode,
    ABI31_0_0YGUndefined,
    ABI31_0_0YGUndefined,
    ABI31_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(self.layoutMetrics.layoutDirection)
  );

  CGSize measuredSize = (CGSize){
    ABI31_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI31_0_0YGNodeLayoutGetWidth(constraintYogaNode)),
    ABI31_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI31_0_0YGNodeLayoutGetHeight(constraintYogaNode)),
  };

  ABI31_0_0YGNodeRemoveChild(constraintYogaNode, clonedYogaNode);
  ABI31_0_0YGNodeFree(constraintYogaNode);
  ABI31_0_0YGNodeFree(clonedYogaNode);

  return measuredSize;
}

- (NSNumber *)ReactABI31_0_0TagAtPoint:(CGPoint)point
{
  for (ABI31_0_0RCTShadowView *shadowView in _ReactABI31_0_0Subviews) {
    if (CGRectContainsPoint(shadowView.layoutMetrics.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.layoutMetrics.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ReactABI31_0_0TagAtPoint:relativePoint];
    }
  }
  return self.ReactABI31_0_0Tag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; ReactABI31_0_0Tag: %@; frame: %@>", self.viewName, self.ReactABI31_0_0Tag, NSStringFromCGRect(self.layoutMetrics.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI31_0_0RCTShadowView *subview in _ReactABI31_0_0Subviews) {
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

#define ABI31_0_0RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(ABI31_0_0YGValue)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (ABI31_0_0YGValue)margin##prop                           \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

ABI31_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI31_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI31_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI31_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI31_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI31_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI31_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)
ABI31_0_0RCT_MARGIN_PROPERTY(Start, START)
ABI31_0_0RCT_MARGIN_PROPERTY(End, END)

// Padding

#define ABI31_0_0RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(ABI31_0_0YGValue)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (ABI31_0_0YGValue)padding##prop                           \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

ABI31_0_0RCT_PADDING_PROPERTY(, ALL)
ABI31_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI31_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI31_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI31_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI31_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI31_0_0RCT_PADDING_PROPERTY(Right, RIGHT)
ABI31_0_0RCT_PADDING_PROPERTY(Start, START)
ABI31_0_0RCT_PADDING_PROPERTY(End, END)

// Border

#define ABI31_0_0RCT_BORDER_PROPERTY(prop, metaProp)             \
- (void)setBorder##prop##Width:(float)value             \
{                                                       \
  _borderMetaProps[META_PROP_##metaProp].value = value; \
  _recomputeBorder = YES;                               \
}                                                       \
- (float)border##prop##Width                            \
{                                                       \
  return _borderMetaProps[META_PROP_##metaProp].value;  \
}

ABI31_0_0RCT_BORDER_PROPERTY(, ALL)
ABI31_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI31_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI31_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI31_0_0RCT_BORDER_PROPERTY(Right, RIGHT)
ABI31_0_0RCT_BORDER_PROPERTY(Start, START)
ABI31_0_0RCT_BORDER_PROPERTY(End, END)

// Dimensions
#define ABI31_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(ABI31_0_0YGValue)value                                 \
{                                                                   \
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(value, ABI31_0_0YGNodeStyleSet##cssProp, _yogaNode);  \
}                                                                   \
- (ABI31_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI31_0_0YGNodeStyleGet##cssProp(_yogaNode);                        \
}

#define ABI31_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(setProp, getProp, cssProp)   \
- (void)set##setProp:(ABI31_0_0YGValue)value                                 \
{                                                                   \
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(value, ABI31_0_0YGNodeStyleSet##cssProp, _yogaNode);       \
}                                                                   \
- (ABI31_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI31_0_0YGNodeStyleGet##cssProp(_yogaNode);                        \
}

ABI31_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI31_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI31_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI31_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI31_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI31_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI31_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(ABI31_0_0YGValue)value                                 \
{                                                                   \
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(value, ABI31_0_0YGNodeStyleSetPosition, _yogaNode, edge);  \
}                                                                   \
- (ABI31_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI31_0_0YGNodeStyleGetPosition(_yogaNode, edge);                   \
}


ABI31_0_0RCT_POSITION_PROPERTY(Top, top, ABI31_0_0YGEdgeTop)
ABI31_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI31_0_0YGEdgeBottom)
ABI31_0_0RCT_POSITION_PROPERTY(Start, start, ABI31_0_0YGEdgeStart)
ABI31_0_0RCT_POSITION_PROPERTY(End, end, ABI31_0_0YGEdgeEnd)

- (void)setLeft:(ABI31_0_0YGValue)value
{
  ABI31_0_0YGEdge edge = [[ABI31_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI31_0_0YGEdgeStart : ABI31_0_0YGEdgeLeft;
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(value, ABI31_0_0YGNodeStyleSetPosition, _yogaNode, edge);
}
- (ABI31_0_0YGValue)left
{
  ABI31_0_0YGEdge edge = [[ABI31_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI31_0_0YGEdgeStart : ABI31_0_0YGEdgeLeft;
  return ABI31_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

- (void)setRight:(ABI31_0_0YGValue)value
{
  ABI31_0_0YGEdge edge = [[ABI31_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI31_0_0YGEdgeEnd : ABI31_0_0YGEdgeRight;
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE(value, ABI31_0_0YGNodeStyleSetPosition, _yogaNode, edge);
}
- (ABI31_0_0YGValue)right
{
  ABI31_0_0YGEdge edge = [[ABI31_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI31_0_0YGEdgeEnd : ABI31_0_0YGEdgeRight;
  return ABI31_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

// Size

- (CGSize)size
{
  ABI31_0_0YGValue width = ABI31_0_0YGNodeStyleGetWidth(_yogaNode);
  ABI31_0_0YGValue height = ABI31_0_0YGNodeStyleGetHeight(_yogaNode);

  return CGSizeMake(
    width.unit == ABI31_0_0YGUnitPoint ? width.value : NAN,
    height.unit == ABI31_0_0YGUnitPoint ? height.value : NAN
  );
}

- (void)setSize:(CGSize)size
{
  ABI31_0_0YGNodeStyleSetWidth(_yogaNode, size.width);
  ABI31_0_0YGNodeStyleSetHeight(_yogaNode, size.height);
}

// IntrinsicContentSize

static inline ABI31_0_0YGSize ABI31_0_0RCTShadowViewMeasure(ABI31_0_0YGNodeRef node, float width, ABI31_0_0YGMeasureMode widthMode, float height, ABI31_0_0YGMeasureMode heightMode)
{
  ABI31_0_0RCTShadowView *shadowView = (__bridge ABI31_0_0RCTShadowView *)ABI31_0_0YGNodeGetContext(node);

  CGSize intrinsicContentSize = shadowView->_intrinsicContentSize;
  // Replace `UIViewNoIntrinsicMetric` (which equals `-1`) with zero.
  intrinsicContentSize.width = MAX(0, intrinsicContentSize.width);
  intrinsicContentSize.height = MAX(0, intrinsicContentSize.height);

  ABI31_0_0YGSize result;

  switch (widthMode) {
    case ABI31_0_0YGMeasureModeUndefined:
      result.width = intrinsicContentSize.width;
      break;
    case ABI31_0_0YGMeasureModeExactly:
      result.width = width;
      break;
    case ABI31_0_0YGMeasureModeAtMost:
      result.width = MIN(width, intrinsicContentSize.width);
      break;
  }

  switch (heightMode) {
    case ABI31_0_0YGMeasureModeUndefined:
      result.height = intrinsicContentSize.height;
      break;
    case ABI31_0_0YGMeasureModeExactly:
      result.height = height;
      break;
    case ABI31_0_0YGMeasureModeAtMost:
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
    ABI31_0_0YGNodeSetMeasureFunc(_yogaNode, NULL);
  } else {
    ABI31_0_0YGNodeSetMeasureFunc(_yogaNode, ABI31_0_0RCTShadowViewMeasure);
  }

  ABI31_0_0YGNodeMarkDirty(_yogaNode);
}

// Local Data

- (void)setLocalData:(__unused NSObject *)localData
{
  // Do nothing by default.
}

// Flex

- (void)setFlexBasis:(ABI31_0_0YGValue)value
{
  ABI31_0_0RCT_SET_ABI31_0_0YGVALUE_AUTO(value, ABI31_0_0YGNodeStyleSetFlexBasis, _yogaNode);
}

- (ABI31_0_0YGValue)flexBasis
{
  return ABI31_0_0YGNodeStyleGetFlexBasis(_yogaNode);
}

#define ABI31_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  ABI31_0_0YGNodeStyleSet##cssProp(_yogaNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return ABI31_0_0YGNodeStyleGet##cssProp(_yogaNode);                \
}

ABI31_0_0RCT_STYLE_PROPERTY(Flex, flex, Flex, float)
ABI31_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
ABI31_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
ABI31_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI31_0_0YGFlexDirection)
ABI31_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI31_0_0YGJustify)
ABI31_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI31_0_0YGAlign)
ABI31_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI31_0_0YGAlign)
ABI31_0_0RCT_STYLE_PROPERTY(AlignContent, alignContent, AlignContent, ABI31_0_0YGAlign)
ABI31_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI31_0_0YGPositionType)
ABI31_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI31_0_0YGWrap)
ABI31_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI31_0_0YGOverflow)
ABI31_0_0RCT_STYLE_PROPERTY(Display, display, Display, ABI31_0_0YGDisplay)
ABI31_0_0RCT_STYLE_PROPERTY(Direction, direction, Direction, ABI31_0_0YGDirection)
ABI31_0_0RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)didUpdateReactABI31_0_0Subviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI31_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _yogaNode);
  }
  if (_recomputeMargin) {
    ABI31_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _yogaNode);
  }
  if (_recomputeBorder) {
    ABI31_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _yogaNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
