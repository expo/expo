/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTShadowView.h"

#import "ABI30_0_0RCTConvert.h"
#import "ABI30_0_0RCTI18nUtil.h"
#import "ABI30_0_0RCTLog.h"
#import "ABI30_0_0RCTShadowView+Layout.h"
#import "ABI30_0_0RCTUtils.h"
#import "ABI30_0_0UIView+Private.h"
#import "UIView+ReactABI30_0_0.h"

typedef void (^ABI30_0_0RCTActionBlock)(ABI30_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI30_0_0RCTResetActionBlock)(ABI30_0_0RCTShadowView *shadowViewSelf);

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

@implementation ABI30_0_0RCTShadowView
{
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI30_0_0RCTShadowView *> *_ReactABI30_0_0Subviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  ABI30_0_0YGValue _paddingMetaProps[META_PROP_COUNT];
  ABI30_0_0YGValue _marginMetaProps[META_PROP_COUNT];
  ABI30_0_0YGValue _borderMetaProps[META_PROP_COUNT];
}

+ (ABI30_0_0YGConfigRef)yogaConfig
{
  static ABI30_0_0YGConfigRef yogaConfig;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    yogaConfig = ABI30_0_0YGConfigNew();
    ABI30_0_0YGConfigSetPointScaleFactor(yogaConfig, ABI30_0_0RCTScreenScale());
    ABI30_0_0YGConfigSetUseLegacyStretchBehaviour(yogaConfig, true);
  });
  return yogaConfig;
}

@synthesize ReactABI30_0_0Tag = _ReactABI30_0_0Tag;

// YogaNode API

static void ABI30_0_0RCTPrint(ABI30_0_0YGNodeRef node)
{
  ABI30_0_0RCTShadowView *shadowView = (__bridge ABI30_0_0RCTShadowView *)ABI30_0_0YGNodeGetContext(node);
  printf("%s(%lld), ", shadowView.viewName.UTF8String, (long long)shadowView.ReactABI30_0_0Tag.integerValue);
}

#define ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(ygvalue, setter, ...)    \
switch (ygvalue.unit) {                          \
  case ABI30_0_0YGUnitAuto:                               \
  case ABI30_0_0YGUnitUndefined:                          \
    setter(__VA_ARGS__, ABI30_0_0YGUndefined);            \
    break;                                       \
  case ABI30_0_0YGUnitPoint:                              \
    setter(__VA_ARGS__, ygvalue.value);          \
    break;                                       \
  case ABI30_0_0YGUnitPercent:                            \
    setter##Percent(__VA_ARGS__, ygvalue.value); \
    break;                                       \
}

#define ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(ygvalue, setter, ...) \
switch (ygvalue.unit) {                            \
  case ABI30_0_0YGUnitAuto:                                 \
    setter##Auto(__VA_ARGS__);                     \
    break;                                         \
  case ABI30_0_0YGUnitUndefined:                            \
    setter(__VA_ARGS__, ABI30_0_0YGUndefined);              \
    break;                                         \
  case ABI30_0_0YGUnitPoint:                                \
    setter(__VA_ARGS__, ygvalue.value);            \
    break;                                         \
  case ABI30_0_0YGUnitPercent:                              \
    setter##Percent(__VA_ARGS__, ygvalue.value);   \
    break;                                         \
}

static void ABI30_0_0RCTProcessMetaPropsPadding(const ABI30_0_0YGValue metaProps[META_PROP_COUNT], ABI30_0_0YGNodeRef node) {
  if (![[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(metaProps[META_PROP_START], ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeStart);
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(metaProps[META_PROP_END], ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeEnd);
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(metaProps[META_PROP_LEFT], ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeLeft);
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(metaProps[META_PROP_RIGHT], ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeRight);
  } else {
    ABI30_0_0YGValue start = metaProps[META_PROP_START].unit == ABI30_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI30_0_0YGValue end = metaProps[META_PROP_END].unit == ABI30_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(start, ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeStart);
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(end, ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeEnd);
  }
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(metaProps[META_PROP_TOP], ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeTop);
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(metaProps[META_PROP_BOTTOM], ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeBottom);
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(metaProps[META_PROP_HORIZONTAL], ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeHorizontal);
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(metaProps[META_PROP_VERTICAL], ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeVertical);
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(metaProps[META_PROP_ALL], ABI30_0_0YGNodeStyleSetPadding, node, ABI30_0_0YGEdgeAll);
}

static void ABI30_0_0RCTProcessMetaPropsMargin(const ABI30_0_0YGValue metaProps[META_PROP_COUNT], ABI30_0_0YGNodeRef node) {
  if (![[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(metaProps[META_PROP_START], ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeStart);
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(metaProps[META_PROP_END], ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeEnd);
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(metaProps[META_PROP_LEFT], ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeLeft);
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(metaProps[META_PROP_RIGHT], ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeRight);
  } else {
    ABI30_0_0YGValue start = metaProps[META_PROP_START].unit == ABI30_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI30_0_0YGValue end = metaProps[META_PROP_END].unit == ABI30_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(start, ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeStart);
    ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(end, ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeEnd);
  }
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(metaProps[META_PROP_TOP], ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeTop);
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(metaProps[META_PROP_BOTTOM], ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeBottom);
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(metaProps[META_PROP_HORIZONTAL], ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeHorizontal);
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(metaProps[META_PROP_VERTICAL], ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeVertical);
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(metaProps[META_PROP_ALL], ABI30_0_0YGNodeStyleSetMargin, node, ABI30_0_0YGEdgeAll);
}

static void ABI30_0_0RCTProcessMetaPropsBorder(const ABI30_0_0YGValue metaProps[META_PROP_COUNT], ABI30_0_0YGNodeRef node) {
  if (![[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeStart, metaProps[META_PROP_START].value);
    ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeEnd, metaProps[META_PROP_END].value);
    ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeLeft, metaProps[META_PROP_LEFT].value);
    ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeRight, metaProps[META_PROP_RIGHT].value);
  } else {
    const float start = ABI30_0_0YGFloatIsUndefined(metaProps[META_PROP_START].value) ? metaProps[META_PROP_LEFT].value : metaProps[META_PROP_START].value;
    const float end = ABI30_0_0YGFloatIsUndefined(metaProps[META_PROP_END].value) ? metaProps[META_PROP_RIGHT].value : metaProps[META_PROP_END].value;
    ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeStart, start);
    ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeEnd, end);
  }
  ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeTop, metaProps[META_PROP_TOP].value);
  ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  ABI30_0_0YGNodeStyleSetBorder(node, ABI30_0_0YGEdgeAll, metaProps[META_PROP_ALL].value);
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI30_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  ABI30_0_0RCTShadowView *shadowView = self;
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

- (BOOL)viewIsDescendantOf:(ABI30_0_0RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  ABI30_0_0RCTShadowView *shadowView = self;
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
      _paddingMetaProps[ii] = ABI30_0_0YGValueUndefined;
      _marginMetaProps[ii] = ABI30_0_0YGValueUndefined;
      _borderMetaProps[ii] = ABI30_0_0YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;

    _ReactABI30_0_0Subviews = [NSMutableArray array];

    _yogaNode = ABI30_0_0YGNodeNewWithConfig([[self class] yogaConfig]);
     ABI30_0_0YGNodeSetContext(_yogaNode, (__bridge void *)self);
     ABI30_0_0YGNodeSetPrintFunc(_yogaNode, ABI30_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isReactABI30_0_0RootView
{
  return ABI30_0_0RCTIsReactABI30_0_0RootView(self.ReactABI30_0_0Tag);
}

- (void)dealloc
{
  ABI30_0_0YGNodeFree(_yogaNode);
}

- (BOOL)canHaveSubviews
{
  return YES;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)insertReactABI30_0_0Subview:(ABI30_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  ABI30_0_0RCTAssert(self.canHaveSubviews, @"Attempt to insert subview inside leaf view.");

  [_ReactABI30_0_0Subviews insertObject:subview atIndex:atIndex];
  if (![self isYogaLeafNode]) {
    ABI30_0_0YGNodeInsertChild(_yogaNode, subview.yogaNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
}

- (void)removeReactABI30_0_0Subview:(ABI30_0_0RCTShadowView *)subview
{
  subview->_superview = nil;
  [_ReactABI30_0_0Subviews removeObject:subview];
  if (![self isYogaLeafNode]) {
    ABI30_0_0YGNodeRemoveChild(_yogaNode, subview.yogaNode);
  }
}

- (NSArray<ABI30_0_0RCTShadowView *> *)ReactABI30_0_0Subviews
{
  return _ReactABI30_0_0Subviews;
}

- (ABI30_0_0RCTShadowView *)ReactABI30_0_0Superview
{
  return _superview;
}

#pragma mark - Layout

- (void)layoutWithMinimumSize:(CGSize)minimumSize
                  maximumSize:(CGSize)maximumSize
              layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
                layoutContext:(ABI30_0_0RCTLayoutContext)layoutContext
{
  ABI30_0_0YGNodeRef yogaNode = _yogaNode;

  CGSize oldMinimumSize = (CGSize){
    ABI30_0_0RCTCoreGraphicsFloatFromYogaValue(ABI30_0_0YGNodeStyleGetMinWidth(yogaNode), 0.0),
    ABI30_0_0RCTCoreGraphicsFloatFromYogaValue(ABI30_0_0YGNodeStyleGetMinHeight(yogaNode), 0.0)
  };

  if (!CGSizeEqualToSize(oldMinimumSize, minimumSize)) {
    ABI30_0_0YGNodeStyleSetMinWidth(yogaNode, ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
    ABI30_0_0YGNodeStyleSetMinHeight(yogaNode, ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  }

  ABI30_0_0YGNodeCalculateLayout(
    yogaNode,
    ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width),
    ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height),
    ABI30_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(layoutDirection)
  );

  ABI30_0_0RCTAssert(!ABI30_0_0YGNodeIsDirty(yogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

  if (!ABI30_0_0YGNodeGetHasNewLayout(yogaNode)) {
    return;
  }

  ABI30_0_0RCTLayoutMetrics layoutMetrics = ABI30_0_0RCTLayoutMetricsFromYogaNode(yogaNode);

  layoutContext.absolutePosition.x += layoutMetrics.frame.origin.x;
  layoutContext.absolutePosition.y += layoutMetrics.frame.origin.y;

  [self layoutWithMetrics:layoutMetrics
            layoutContext:layoutContext];

  [self layoutSubviewsWithContext:layoutContext];
}

- (void)layoutWithMetrics:(ABI30_0_0RCTLayoutMetrics)layoutMetrics
            layoutContext:(ABI30_0_0RCTLayoutContext)layoutContext
{
  if (!ABI30_0_0RCTLayoutMetricsEqualToLayoutMetrics(self.layoutMetrics, layoutMetrics)) {
    self.layoutMetrics = layoutMetrics;
    [layoutContext.affectedShadowViews addObject:self];
  }
}

- (void)layoutSubviewsWithContext:(ABI30_0_0RCTLayoutContext)layoutContext
{
  ABI30_0_0RCTLayoutMetrics layoutMetrics = self.layoutMetrics;

  if (layoutMetrics.displayType == ABI30_0_0RCTDisplayTypeNone) {
    return;
  }

  for (ABI30_0_0RCTShadowView *childShadowView in _ReactABI30_0_0Subviews) {
    ABI30_0_0YGNodeRef childYogaNode = childShadowView.yogaNode;

    ABI30_0_0RCTAssert(!ABI30_0_0YGNodeIsDirty(childYogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

    if (!ABI30_0_0YGNodeGetHasNewLayout(childYogaNode)) {
      continue;
    }

    ABI30_0_0RCTLayoutMetrics childLayoutMetrics = ABI30_0_0RCTLayoutMetricsFromYogaNode(childYogaNode);

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
  ABI30_0_0YGNodeRef clonnedYogaNode = ABI30_0_0YGNodeClone(self.yogaNode);
  ABI30_0_0YGNodeRef constraintYogaNode = ABI30_0_0YGNodeNewWithConfig([[self class] yogaConfig]);

  ABI30_0_0YGNodeInsertChild(constraintYogaNode, clonnedYogaNode, 0);

  ABI30_0_0YGNodeStyleSetMinWidth(constraintYogaNode, ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  ABI30_0_0YGNodeStyleSetMinHeight(constraintYogaNode, ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  ABI30_0_0YGNodeStyleSetMaxWidth(constraintYogaNode, ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width));
  ABI30_0_0YGNodeStyleSetMaxHeight(constraintYogaNode, ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height));

  ABI30_0_0YGNodeCalculateLayout(
    constraintYogaNode,
    ABI30_0_0YGUndefined,
    ABI30_0_0YGUndefined,
    self.layoutMetrics.layoutDirection
  );

  CGSize measuredSize = (CGSize){
    ABI30_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI30_0_0YGNodeLayoutGetWidth(constraintYogaNode)),
    ABI30_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI30_0_0YGNodeLayoutGetHeight(constraintYogaNode)),
  };

  ABI30_0_0YGNodeRemoveChild(constraintYogaNode, clonnedYogaNode);
  ABI30_0_0YGNodeFree(constraintYogaNode);
  ABI30_0_0YGNodeFree(clonnedYogaNode);

  return measuredSize;
}

- (NSNumber *)ReactABI30_0_0TagAtPoint:(CGPoint)point
{
  for (ABI30_0_0RCTShadowView *shadowView in _ReactABI30_0_0Subviews) {
    if (CGRectContainsPoint(shadowView.layoutMetrics.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.layoutMetrics.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ReactABI30_0_0TagAtPoint:relativePoint];
    }
  }
  return self.ReactABI30_0_0Tag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; ReactABI30_0_0Tag: %@; frame: %@>", self.viewName, self.ReactABI30_0_0Tag, NSStringFromCGRect(self.layoutMetrics.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI30_0_0RCTShadowView *subview in _ReactABI30_0_0Subviews) {
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

#define ABI30_0_0RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(ABI30_0_0YGValue)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (ABI30_0_0YGValue)margin##prop                           \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

ABI30_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI30_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI30_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI30_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI30_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI30_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI30_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)
ABI30_0_0RCT_MARGIN_PROPERTY(Start, START)
ABI30_0_0RCT_MARGIN_PROPERTY(End, END)

// Padding

#define ABI30_0_0RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(ABI30_0_0YGValue)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (ABI30_0_0YGValue)padding##prop                           \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

ABI30_0_0RCT_PADDING_PROPERTY(, ALL)
ABI30_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI30_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI30_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI30_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI30_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI30_0_0RCT_PADDING_PROPERTY(Right, RIGHT)
ABI30_0_0RCT_PADDING_PROPERTY(Start, START)
ABI30_0_0RCT_PADDING_PROPERTY(End, END)

// Border

#define ABI30_0_0RCT_BORDER_PROPERTY(prop, metaProp)             \
- (void)setBorder##prop##Width:(float)value             \
{                                                       \
  _borderMetaProps[META_PROP_##metaProp].value = value; \
  _recomputeBorder = YES;                               \
}                                                       \
- (float)border##prop##Width                            \
{                                                       \
  return _borderMetaProps[META_PROP_##metaProp].value;  \
}

ABI30_0_0RCT_BORDER_PROPERTY(, ALL)
ABI30_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI30_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI30_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI30_0_0RCT_BORDER_PROPERTY(Right, RIGHT)
ABI30_0_0RCT_BORDER_PROPERTY(Start, START)
ABI30_0_0RCT_BORDER_PROPERTY(End, END)

// Dimensions
#define ABI30_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(ABI30_0_0YGValue)value                                 \
{                                                                   \
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(value, ABI30_0_0YGNodeStyleSet##cssProp, _yogaNode);  \
}                                                                   \
- (ABI30_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI30_0_0YGNodeStyleGet##cssProp(_yogaNode);                        \
}

#define ABI30_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(setProp, getProp, cssProp)   \
- (void)set##setProp:(ABI30_0_0YGValue)value                                 \
{                                                                   \
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(value, ABI30_0_0YGNodeStyleSet##cssProp, _yogaNode);       \
}                                                                   \
- (ABI30_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI30_0_0YGNodeStyleGet##cssProp(_yogaNode);                        \
}

ABI30_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI30_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI30_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI30_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI30_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI30_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI30_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(ABI30_0_0YGValue)value                                 \
{                                                                   \
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(value, ABI30_0_0YGNodeStyleSetPosition, _yogaNode, edge);  \
}                                                                   \
- (ABI30_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI30_0_0YGNodeStyleGetPosition(_yogaNode, edge);                   \
}


ABI30_0_0RCT_POSITION_PROPERTY(Top, top, ABI30_0_0YGEdgeTop)
ABI30_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI30_0_0YGEdgeBottom)
ABI30_0_0RCT_POSITION_PROPERTY(Start, start, ABI30_0_0YGEdgeStart)
ABI30_0_0RCT_POSITION_PROPERTY(End, end, ABI30_0_0YGEdgeEnd)

- (void)setLeft:(ABI30_0_0YGValue)value
{
  ABI30_0_0YGEdge edge = [[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI30_0_0YGEdgeStart : ABI30_0_0YGEdgeLeft;
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(value, ABI30_0_0YGNodeStyleSetPosition, _yogaNode, edge);
}
- (ABI30_0_0YGValue)left
{
  ABI30_0_0YGEdge edge = [[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI30_0_0YGEdgeStart : ABI30_0_0YGEdgeLeft;
  return ABI30_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

- (void)setRight:(ABI30_0_0YGValue)value
{
  ABI30_0_0YGEdge edge = [[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI30_0_0YGEdgeEnd : ABI30_0_0YGEdgeRight;
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE(value, ABI30_0_0YGNodeStyleSetPosition, _yogaNode, edge);
}
- (ABI30_0_0YGValue)right
{
  ABI30_0_0YGEdge edge = [[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI30_0_0YGEdgeEnd : ABI30_0_0YGEdgeRight;
  return ABI30_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

// Size

- (CGSize)size
{
  ABI30_0_0YGValue width = ABI30_0_0YGNodeStyleGetWidth(_yogaNode);
  ABI30_0_0YGValue height = ABI30_0_0YGNodeStyleGetHeight(_yogaNode);

  return CGSizeMake(
    width.unit == ABI30_0_0YGUnitPoint ? width.value : NAN,
    height.unit == ABI30_0_0YGUnitPoint ? height.value : NAN
  );
}

- (void)setSize:(CGSize)size
{
  ABI30_0_0YGNodeStyleSetWidth(_yogaNode, size.width);
  ABI30_0_0YGNodeStyleSetHeight(_yogaNode, size.height);
}

// IntrinsicContentSize

static inline ABI30_0_0YGSize ABI30_0_0RCTShadowViewMeasure(ABI30_0_0YGNodeRef node, float width, ABI30_0_0YGMeasureMode widthMode, float height, ABI30_0_0YGMeasureMode heightMode)
{
  ABI30_0_0RCTShadowView *shadowView = (__bridge ABI30_0_0RCTShadowView *)ABI30_0_0YGNodeGetContext(node);

  CGSize intrinsicContentSize = shadowView->_intrinsicContentSize;
  // Replace `UIViewNoIntrinsicMetric` (which equals `-1`) with zero.
  intrinsicContentSize.width = MAX(0, intrinsicContentSize.width);
  intrinsicContentSize.height = MAX(0, intrinsicContentSize.height);

  ABI30_0_0YGSize result;

  switch (widthMode) {
    case ABI30_0_0YGMeasureModeUndefined:
      result.width = intrinsicContentSize.width;
      break;
    case ABI30_0_0YGMeasureModeExactly:
      result.width = width;
      break;
    case ABI30_0_0YGMeasureModeAtMost:
      result.width = MIN(width, intrinsicContentSize.width);
      break;
  }

  switch (heightMode) {
    case ABI30_0_0YGMeasureModeUndefined:
      result.height = intrinsicContentSize.height;
      break;
    case ABI30_0_0YGMeasureModeExactly:
      result.height = height;
      break;
    case ABI30_0_0YGMeasureModeAtMost:
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
    ABI30_0_0YGNodeSetMeasureFunc(_yogaNode, NULL);
  } else {
    ABI30_0_0YGNodeSetMeasureFunc(_yogaNode, ABI30_0_0RCTShadowViewMeasure);
  }

  ABI30_0_0YGNodeMarkDirty(_yogaNode);
}

// Local Data

- (void)setLocalData:(__unused NSObject *)localData
{
  // Do nothing by default.
}

// Flex

- (void)setFlexBasis:(ABI30_0_0YGValue)value
{
  ABI30_0_0RCT_SET_ABI30_0_0YGVALUE_AUTO(value, ABI30_0_0YGNodeStyleSetFlexBasis, _yogaNode);
}

- (ABI30_0_0YGValue)flexBasis
{
  return ABI30_0_0YGNodeStyleGetFlexBasis(_yogaNode);
}

#define ABI30_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  ABI30_0_0YGNodeStyleSet##cssProp(_yogaNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return ABI30_0_0YGNodeStyleGet##cssProp(_yogaNode);                \
}

ABI30_0_0RCT_STYLE_PROPERTY(Flex, flex, Flex, float)
ABI30_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
ABI30_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
ABI30_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI30_0_0YGFlexDirection)
ABI30_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI30_0_0YGJustify)
ABI30_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI30_0_0YGAlign)
ABI30_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI30_0_0YGAlign)
ABI30_0_0RCT_STYLE_PROPERTY(AlignContent, alignContent, AlignContent, ABI30_0_0YGAlign)
ABI30_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI30_0_0YGPositionType)
ABI30_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI30_0_0YGWrap)
ABI30_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI30_0_0YGOverflow)
ABI30_0_0RCT_STYLE_PROPERTY(Display, display, Display, ABI30_0_0YGDisplay)
ABI30_0_0RCT_STYLE_PROPERTY(Direction, direction, Direction, ABI30_0_0YGDirection)
ABI30_0_0RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)didUpdateReactABI30_0_0Subviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI30_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _yogaNode);
  }
  if (_recomputeMargin) {
    ABI30_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _yogaNode);
  }
  if (_recomputeBorder) {
    ABI30_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _yogaNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
