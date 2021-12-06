/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTShadowView.h"

#import "ABI44_0_0RCTConvert.h"
#import "ABI44_0_0RCTI18nUtil.h"
#import "ABI44_0_0RCTLayout.h"
#import "ABI44_0_0RCTLog.h"
#import "ABI44_0_0RCTShadowView+Layout.h"
#import "ABI44_0_0RCTUtils.h"
#import "ABI44_0_0UIView+Private.h"
#import "ABI44_0_0UIView+React.h"

typedef void (^ABI44_0_0RCTActionBlock)(ABI44_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI44_0_0RCTResetActionBlock)(ABI44_0_0RCTShadowView *shadowViewSelf);

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

@implementation ABI44_0_0RCTShadowView {
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI44_0_0RCTShadowView *> *_ABI44_0_0ReactSubviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  ABI44_0_0YGValue _paddingMetaProps[META_PROP_COUNT];
  ABI44_0_0YGValue _marginMetaProps[META_PROP_COUNT];
  ABI44_0_0YGValue _borderMetaProps[META_PROP_COUNT];
}

+ (ABI44_0_0YGConfigRef)yogaConfig
{
  static ABI44_0_0YGConfigRef yogaConfig;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    yogaConfig = ABI44_0_0YGConfigNew();
    ABI44_0_0YGConfigSetPointScaleFactor(yogaConfig, ABI44_0_0RCTScreenScale());
    ABI44_0_0YGConfigSetUseLegacyStretchBehaviour(yogaConfig, true);
  });
  return yogaConfig;
}

@synthesize ABI44_0_0ReactTag = _ABI44_0_0ReactTag;
@synthesize rootTag = _rootTag;

// YogaNode API

static void ABI44_0_0RCTPrint(ABI44_0_0YGNodeRef node)
{
  ABI44_0_0RCTShadowView *shadowView = (__bridge ABI44_0_0RCTShadowView *)ABI44_0_0YGNodeGetContext(node);
  printf("%s(%lld), ", shadowView.viewName.UTF8String, (long long)shadowView.ABI44_0_0ReactTag.integerValue);
}

#define ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(ygvalue, setter, ...)      \
  switch (ygvalue.unit) {                          \
    case ABI44_0_0YGUnitAuto:                               \
    case ABI44_0_0YGUnitUndefined:                          \
      setter(__VA_ARGS__, ABI44_0_0YGUndefined);            \
      break;                                       \
    case ABI44_0_0YGUnitPoint:                              \
      setter(__VA_ARGS__, ygvalue.value);          \
      break;                                       \
    case ABI44_0_0YGUnitPercent:                            \
      setter##Percent(__VA_ARGS__, ygvalue.value); \
      break;                                       \
  }

#define ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(ygvalue, setter, ...) \
  switch (ygvalue.unit) {                          \
    case ABI44_0_0YGUnitAuto:                               \
      setter##Auto(__VA_ARGS__);                   \
      break;                                       \
    case ABI44_0_0YGUnitUndefined:                          \
      setter(__VA_ARGS__, ABI44_0_0YGUndefined);            \
      break;                                       \
    case ABI44_0_0YGUnitPoint:                              \
      setter(__VA_ARGS__, ygvalue.value);          \
      break;                                       \
    case ABI44_0_0YGUnitPercent:                            \
      setter##Percent(__VA_ARGS__, ygvalue.value); \
      break;                                       \
  }

static void ABI44_0_0RCTProcessMetaPropsPadding(const ABI44_0_0YGValue metaProps[META_PROP_COUNT], ABI44_0_0YGNodeRef node)
{
  if (![[ABI44_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(metaProps[META_PROP_START], ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeStart);
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(metaProps[META_PROP_END], ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeEnd);
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(metaProps[META_PROP_LEFT], ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeLeft);
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(metaProps[META_PROP_RIGHT], ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeRight);
  } else {
    ABI44_0_0YGValue start =
        metaProps[META_PROP_START].unit == ABI44_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI44_0_0YGValue end =
        metaProps[META_PROP_END].unit == ABI44_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(start, ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeStart);
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(end, ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeEnd);
  }
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(metaProps[META_PROP_TOP], ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeTop);
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(metaProps[META_PROP_BOTTOM], ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeBottom);
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(metaProps[META_PROP_HORIZONTAL], ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeHorizontal);
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(metaProps[META_PROP_VERTICAL], ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeVertical);
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(metaProps[META_PROP_ALL], ABI44_0_0YGNodeStyleSetPadding, node, ABI44_0_0YGEdgeAll);
}

static void ABI44_0_0RCTProcessMetaPropsMargin(const ABI44_0_0YGValue metaProps[META_PROP_COUNT], ABI44_0_0YGNodeRef node)
{
  if (![[ABI44_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(metaProps[META_PROP_START], ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeStart);
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(metaProps[META_PROP_END], ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeEnd);
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(metaProps[META_PROP_LEFT], ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeLeft);
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(metaProps[META_PROP_RIGHT], ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeRight);
  } else {
    ABI44_0_0YGValue start =
        metaProps[META_PROP_START].unit == ABI44_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI44_0_0YGValue end =
        metaProps[META_PROP_END].unit == ABI44_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(start, ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeStart);
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(end, ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeEnd);
  }
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(metaProps[META_PROP_TOP], ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeTop);
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(metaProps[META_PROP_BOTTOM], ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeBottom);
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(metaProps[META_PROP_HORIZONTAL], ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeHorizontal);
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(metaProps[META_PROP_VERTICAL], ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeVertical);
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(metaProps[META_PROP_ALL], ABI44_0_0YGNodeStyleSetMargin, node, ABI44_0_0YGEdgeAll);
}

static void ABI44_0_0RCTProcessMetaPropsBorder(const ABI44_0_0YGValue metaProps[META_PROP_COUNT], ABI44_0_0YGNodeRef node)
{
  if (![[ABI44_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeStart, metaProps[META_PROP_START].value);
    ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeEnd, metaProps[META_PROP_END].value);
    ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeLeft, metaProps[META_PROP_LEFT].value);
    ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeRight, metaProps[META_PROP_RIGHT].value);
  } else {
    const float start = ABI44_0_0YGFloatIsUndefined(metaProps[META_PROP_START].value) ? metaProps[META_PROP_LEFT].value
                                                                             : metaProps[META_PROP_START].value;
    const float end = ABI44_0_0YGFloatIsUndefined(metaProps[META_PROP_END].value) ? metaProps[META_PROP_RIGHT].value
                                                                         : metaProps[META_PROP_END].value;
    ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeStart, start);
    ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeEnd, end);
  }
  ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeTop, metaProps[META_PROP_TOP].value);
  ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  ABI44_0_0YGNodeStyleSetBorder(node, ABI44_0_0YGEdgeAll, metaProps[META_PROP_ALL].value);
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI44_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  ABI44_0_0RCTShadowView *shadowView = self;
  while (shadowView && shadowView != ancestor) {
    offset.x += shadowView.layoutMetrics.frame.origin.x;
    offset.y += shadowView.layoutMetrics.frame.origin.y;
    shadowView = shadowView->_superview;
  }
  if (ancestor != shadowView) {
    return CGRectNull;
  }
  return (CGRect){offset, self.layoutMetrics.frame.size};
}

- (BOOL)viewIsDescendantOf:(ABI44_0_0RCTShadowView *)ancestor
{
  ABI44_0_0RCTShadowView *shadowView = self;
  while (shadowView && shadowView != ancestor) {
    shadowView = shadowView->_superview;
  }
  return ancestor == shadowView;
}

- (instancetype)init
{
  if (self = [super init]) {
    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = ABI44_0_0YGValueUndefined;
      _marginMetaProps[ii] = ABI44_0_0YGValueUndefined;
      _borderMetaProps[ii] = ABI44_0_0YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;

    _ABI44_0_0ReactSubviews = [NSMutableArray array];

    _yogaNode = ABI44_0_0YGNodeNewWithConfig([[self class] yogaConfig]);
    ABI44_0_0YGNodeSetContext(_yogaNode, (__bridge void *)self);
    ABI44_0_0YGNodeSetPrintFunc(_yogaNode, ABI44_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isABI44_0_0ReactRootView
{
  return ABI44_0_0RCTIsABI44_0_0ReactRootView(self.ABI44_0_0ReactTag);
}

- (void)dealloc
{
  ABI44_0_0YGNodeFree(_yogaNode);
}

- (BOOL)canHaveSubviews
{
  return YES;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)insertABI44_0_0ReactSubview:(ABI44_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  ABI44_0_0RCTAssert(self.canHaveSubviews, @"Attempt to insert subview inside leaf view.");

  [_ABI44_0_0ReactSubviews insertObject:subview atIndex:atIndex];
  if (![self isYogaLeafNode]) {
    ABI44_0_0YGNodeInsertChild(_yogaNode, subview.yogaNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
}

- (void)removeABI44_0_0ReactSubview:(ABI44_0_0RCTShadowView *)subview
{
  subview->_superview = nil;
  [_ABI44_0_0ReactSubviews removeObject:subview];
  if (![self isYogaLeafNode]) {
    ABI44_0_0YGNodeRemoveChild(_yogaNode, subview.yogaNode);
  }
}

- (NSArray<ABI44_0_0RCTShadowView *> *)ABI44_0_0ReactSubviews
{
  return _ABI44_0_0ReactSubviews;
}

- (ABI44_0_0RCTShadowView *)ABI44_0_0ReactSuperview
{
  return _superview;
}

#pragma mark - Layout

- (void)layoutWithMinimumSize:(CGSize)minimumSize
                  maximumSize:(CGSize)maximumSize
              layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
                layoutContext:(ABI44_0_0RCTLayoutContext)layoutContext
{
  ABI44_0_0YGNodeRef yogaNode = _yogaNode;

  CGSize oldMinimumSize = (CGSize){ABI44_0_0RCTCoreGraphicsFloatFromYogaValue(ABI44_0_0YGNodeStyleGetMinWidth(yogaNode), 0.0),
                                   ABI44_0_0RCTCoreGraphicsFloatFromYogaValue(ABI44_0_0YGNodeStyleGetMinHeight(yogaNode), 0.0)};

  if (!CGSizeEqualToSize(oldMinimumSize, minimumSize)) {
    ABI44_0_0YGNodeStyleSetMinWidth(yogaNode, ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
    ABI44_0_0YGNodeStyleSetMinHeight(yogaNode, ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  }

  ABI44_0_0YGNodeCalculateLayout(
      yogaNode,
      ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width),
      ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height),
      ABI44_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(layoutDirection));

  ABI44_0_0RCTAssert(!ABI44_0_0YGNodeIsDirty(yogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

  if (!ABI44_0_0YGNodeGetHasNewLayout(yogaNode)) {
    return;
  }

  ABI44_0_0YGNodeSetHasNewLayout(yogaNode, false);

  ABI44_0_0RCTLayoutMetrics layoutMetrics = ABI44_0_0RCTLayoutMetricsFromYogaNode(yogaNode);

  layoutContext.absolutePosition.x += layoutMetrics.frame.origin.x;
  layoutContext.absolutePosition.y += layoutMetrics.frame.origin.y;

  [self layoutWithMetrics:layoutMetrics layoutContext:layoutContext];

  [self layoutSubviewsWithContext:layoutContext];
}

- (void)layoutWithMetrics:(ABI44_0_0RCTLayoutMetrics)layoutMetrics layoutContext:(ABI44_0_0RCTLayoutContext)layoutContext
{
  if (!ABI44_0_0RCTLayoutMetricsEqualToLayoutMetrics(self.layoutMetrics, layoutMetrics)) {
    self.layoutMetrics = layoutMetrics;
    [layoutContext.affectedShadowViews addObject:self];
  }
}

- (void)layoutSubviewsWithContext:(ABI44_0_0RCTLayoutContext)layoutContext
{
  ABI44_0_0RCTLayoutMetrics layoutMetrics = self.layoutMetrics;

  if (layoutMetrics.displayType == ABI44_0_0RCTDisplayTypeNone) {
    return;
  }

  for (ABI44_0_0RCTShadowView *childShadowView in _ABI44_0_0ReactSubviews) {
    ABI44_0_0YGNodeRef childYogaNode = childShadowView.yogaNode;

    ABI44_0_0RCTAssert(!ABI44_0_0YGNodeIsDirty(childYogaNode), @"Attempt to get layout metrics from dirtied Yoga node.");

    if (!ABI44_0_0YGNodeGetHasNewLayout(childYogaNode)) {
      continue;
    }

    ABI44_0_0YGNodeSetHasNewLayout(childYogaNode, false);

    ABI44_0_0RCTLayoutMetrics childLayoutMetrics = ABI44_0_0RCTLayoutMetricsFromYogaNode(childYogaNode);

    layoutContext.absolutePosition.x += childLayoutMetrics.frame.origin.x;
    layoutContext.absolutePosition.y += childLayoutMetrics.frame.origin.y;

    [childShadowView layoutWithMetrics:childLayoutMetrics layoutContext:layoutContext];

    // Recursive call.
    [childShadowView layoutSubviewsWithContext:layoutContext];
  }
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  ABI44_0_0YGNodeRef clonedYogaNode = ABI44_0_0YGNodeClone(self.yogaNode);
  ABI44_0_0YGNodeRef constraintYogaNode = ABI44_0_0YGNodeNewWithConfig([[self class] yogaConfig]);

  ABI44_0_0YGNodeInsertChild(constraintYogaNode, clonedYogaNode, 0);

  ABI44_0_0YGNodeStyleSetMinWidth(constraintYogaNode, ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  ABI44_0_0YGNodeStyleSetMinHeight(constraintYogaNode, ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  ABI44_0_0YGNodeStyleSetMaxWidth(constraintYogaNode, ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width));
  ABI44_0_0YGNodeStyleSetMaxHeight(constraintYogaNode, ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height));

  ABI44_0_0YGNodeCalculateLayout(
      constraintYogaNode,
      ABI44_0_0YGUndefined,
      ABI44_0_0YGUndefined,
      ABI44_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(self.layoutMetrics.layoutDirection));

  CGSize measuredSize = (CGSize){
      ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetWidth(constraintYogaNode)),
      ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetHeight(constraintYogaNode)),
  };

  ABI44_0_0YGNodeRemoveChild(constraintYogaNode, clonedYogaNode);
  ABI44_0_0YGNodeFree(constraintYogaNode);
  ABI44_0_0YGNodeFree(clonedYogaNode);

  return measuredSize;
}

- (NSNumber *)ABI44_0_0ReactTagAtPoint:(CGPoint)point
{
  for (ABI44_0_0RCTShadowView *shadowView in _ABI44_0_0ReactSubviews) {
    if (CGRectContainsPoint(shadowView.layoutMetrics.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.layoutMetrics.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ABI44_0_0ReactTagAtPoint:relativePoint];
    }
  }
  return self.ABI44_0_0ReactTag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1]
      stringByAppendingFormat:@"; viewName: %@; ABI44_0_0ReactTag: %@; frame: %@>",
                              self.viewName,
                              self.ABI44_0_0ReactTag,
                              NSStringFromCGRect(self.layoutMetrics.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI44_0_0RCTShadowView *subview in _ABI44_0_0ReactSubviews) {
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

#define ABI44_0_0RCT_MARGIN_PROPERTY(prop, metaProp)         \
  -(void)setMargin##prop : (ABI44_0_0YGValue)value           \
  {                                                 \
    _marginMetaProps[META_PROP_##metaProp] = value; \
    _recomputeMargin = YES;                         \
  }                                                 \
  -(ABI44_0_0YGValue)margin##prop                            \
  {                                                 \
    return _marginMetaProps[META_PROP_##metaProp];  \
  }

ABI44_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI44_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI44_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI44_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI44_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI44_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI44_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)
ABI44_0_0RCT_MARGIN_PROPERTY(Start, START)
ABI44_0_0RCT_MARGIN_PROPERTY(End, END)

// Padding

#define ABI44_0_0RCT_PADDING_PROPERTY(prop, metaProp)         \
  -(void)setPadding##prop : (ABI44_0_0YGValue)value           \
  {                                                  \
    _paddingMetaProps[META_PROP_##metaProp] = value; \
    _recomputePadding = YES;                         \
  }                                                  \
  -(ABI44_0_0YGValue)padding##prop                            \
  {                                                  \
    return _paddingMetaProps[META_PROP_##metaProp];  \
  }

ABI44_0_0RCT_PADDING_PROPERTY(, ALL)
ABI44_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI44_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI44_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI44_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI44_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI44_0_0RCT_PADDING_PROPERTY(Right, RIGHT)
ABI44_0_0RCT_PADDING_PROPERTY(Start, START)
ABI44_0_0RCT_PADDING_PROPERTY(End, END)

// Border

#define ABI44_0_0RCT_BORDER_PROPERTY(prop, metaProp)               \
  -(void)setBorder##prop##Width : (float)value            \
  {                                                       \
    _borderMetaProps[META_PROP_##metaProp].value = value; \
    _recomputeBorder = YES;                               \
  }                                                       \
  -(float)border##prop##Width                             \
  {                                                       \
    return _borderMetaProps[META_PROP_##metaProp].value;  \
  }

ABI44_0_0RCT_BORDER_PROPERTY(, ALL)
ABI44_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI44_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI44_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI44_0_0RCT_BORDER_PROPERTY(Right, RIGHT)
ABI44_0_0RCT_BORDER_PROPERTY(Start, START)
ABI44_0_0RCT_BORDER_PROPERTY(End, END)

// Dimensions
#define ABI44_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)            \
  -(void)set##setProp : (ABI44_0_0YGValue)value                               \
  {                                                                  \
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(value, ABI44_0_0YGNodeStyleSet##cssProp, _yogaNode); \
  }                                                                  \
  -(ABI44_0_0YGValue)getProp                                                  \
  {                                                                  \
    return ABI44_0_0YGNodeStyleGet##cssProp(_yogaNode);                       \
  }

#define ABI44_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(setProp, getProp, cssProp) \
  -(void)set##setProp : (ABI44_0_0YGValue)value                            \
  {                                                               \
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(value, ABI44_0_0YGNodeStyleSet##cssProp, _yogaNode);   \
  }                                                               \
  -(ABI44_0_0YGValue)getProp                                               \
  {                                                               \
    return ABI44_0_0YGNodeStyleGet##cssProp(_yogaNode);                    \
  }

ABI44_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI44_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI44_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI44_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI44_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI44_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI44_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)                \
  -(void)set##setProp : (ABI44_0_0YGValue)value                               \
  {                                                                  \
    ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(value, ABI44_0_0YGNodeStyleSetPosition, _yogaNode, edge); \
  }                                                                  \
  -(ABI44_0_0YGValue)getProp                                                  \
  {                                                                  \
    return ABI44_0_0YGNodeStyleGetPosition(_yogaNode, edge);                  \
  }

ABI44_0_0RCT_POSITION_PROPERTY(Top, top, ABI44_0_0YGEdgeTop)
ABI44_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI44_0_0YGEdgeBottom)
ABI44_0_0RCT_POSITION_PROPERTY(Start, start, ABI44_0_0YGEdgeStart)
ABI44_0_0RCT_POSITION_PROPERTY(End, end, ABI44_0_0YGEdgeEnd)

- (void)setLeft:(ABI44_0_0YGValue)value
{
  ABI44_0_0YGEdge edge = [[ABI44_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI44_0_0YGEdgeStart : ABI44_0_0YGEdgeLeft;
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(value, ABI44_0_0YGNodeStyleSetPosition, _yogaNode, edge);
}
- (ABI44_0_0YGValue)left
{
  ABI44_0_0YGEdge edge = [[ABI44_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI44_0_0YGEdgeStart : ABI44_0_0YGEdgeLeft;
  return ABI44_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

- (void)setRight:(ABI44_0_0YGValue)value
{
  ABI44_0_0YGEdge edge = [[ABI44_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI44_0_0YGEdgeEnd : ABI44_0_0YGEdgeRight;
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE(value, ABI44_0_0YGNodeStyleSetPosition, _yogaNode, edge);
}
- (ABI44_0_0YGValue)right
{
  ABI44_0_0YGEdge edge = [[ABI44_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI44_0_0YGEdgeEnd : ABI44_0_0YGEdgeRight;
  return ABI44_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

// Size

- (CGSize)size
{
  ABI44_0_0YGValue width = ABI44_0_0YGNodeStyleGetWidth(_yogaNode);
  ABI44_0_0YGValue height = ABI44_0_0YGNodeStyleGetHeight(_yogaNode);

  return CGSizeMake(width.unit == ABI44_0_0YGUnitPoint ? width.value : NAN, height.unit == ABI44_0_0YGUnitPoint ? height.value : NAN);
}

- (void)setSize:(CGSize)size
{
  ABI44_0_0YGNodeStyleSetWidth(_yogaNode, size.width);
  ABI44_0_0YGNodeStyleSetHeight(_yogaNode, size.height);
}

// IntrinsicContentSize

static inline ABI44_0_0YGSize
ABI44_0_0RCTShadowViewMeasure(ABI44_0_0YGNodeRef node, float width, ABI44_0_0YGMeasureMode widthMode, float height, ABI44_0_0YGMeasureMode heightMode)
{
  ABI44_0_0RCTShadowView *shadowView = (__bridge ABI44_0_0RCTShadowView *)ABI44_0_0YGNodeGetContext(node);

  CGSize intrinsicContentSize = shadowView->_intrinsicContentSize;
  // Replace `UIViewNoIntrinsicMetric` (which equals `-1`) with zero.
  intrinsicContentSize.width = MAX(0, intrinsicContentSize.width);
  intrinsicContentSize.height = MAX(0, intrinsicContentSize.height);

  ABI44_0_0YGSize result;

  switch (widthMode) {
    case ABI44_0_0YGMeasureModeUndefined:
      result.width = intrinsicContentSize.width;
      break;
    case ABI44_0_0YGMeasureModeExactly:
      result.width = width;
      break;
    case ABI44_0_0YGMeasureModeAtMost:
      result.width = MIN(width, intrinsicContentSize.width);
      break;
  }

  switch (heightMode) {
    case ABI44_0_0YGMeasureModeUndefined:
      result.height = intrinsicContentSize.height;
      break;
    case ABI44_0_0YGMeasureModeExactly:
      result.height = height;
      break;
    case ABI44_0_0YGMeasureModeAtMost:
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
    ABI44_0_0YGNodeSetMeasureFunc(_yogaNode, NULL);
  } else {
    ABI44_0_0YGNodeSetMeasureFunc(_yogaNode, ABI44_0_0RCTShadowViewMeasure);
  }

  ABI44_0_0YGNodeMarkDirty(_yogaNode);
}

// Local Data

- (void)setLocalData:(__unused NSObject *)localData
{
  // Do nothing by default.
}

// Flex

- (void)setFlexBasis:(ABI44_0_0YGValue)value
{
  ABI44_0_0RCT_SET_ABI44_0_0YGVALUE_AUTO(value, ABI44_0_0YGNodeStyleSetFlexBasis, _yogaNode);
}

- (ABI44_0_0YGValue)flexBasis
{
  return ABI44_0_0YGNodeStyleGetFlexBasis(_yogaNode);
}

#define ABI44_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
  -(void)set##setProp : (type)value                         \
  {                                                         \
    ABI44_0_0YGNodeStyleSet##cssProp(_yogaNode, value);              \
  }                                                         \
  -(type)getProp                                            \
  {                                                         \
    return ABI44_0_0YGNodeStyleGet##cssProp(_yogaNode);              \
  }

ABI44_0_0RCT_STYLE_PROPERTY(Flex, flex, Flex, float)
ABI44_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
ABI44_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
ABI44_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI44_0_0YGFlexDirection)
ABI44_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI44_0_0YGJustify)
ABI44_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI44_0_0YGAlign)
ABI44_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI44_0_0YGAlign)
ABI44_0_0RCT_STYLE_PROPERTY(AlignContent, alignContent, AlignContent, ABI44_0_0YGAlign)
ABI44_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI44_0_0YGPositionType)
ABI44_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI44_0_0YGWrap)
ABI44_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI44_0_0YGOverflow)
ABI44_0_0RCT_STYLE_PROPERTY(Display, display, Display, ABI44_0_0YGDisplay)
ABI44_0_0RCT_STYLE_PROPERTY(Direction, direction, Direction, ABI44_0_0YGDirection)
ABI44_0_0RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)didUpdateABI44_0_0ReactSubviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI44_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _yogaNode);
  }
  if (_recomputeMargin) {
    ABI44_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _yogaNode);
  }
  if (_recomputeBorder) {
    ABI44_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _yogaNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
