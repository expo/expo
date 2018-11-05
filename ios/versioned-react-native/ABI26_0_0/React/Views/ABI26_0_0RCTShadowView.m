/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTShadowView.h"

#import "ABI26_0_0RCTConvert.h"
#import "ABI26_0_0RCTI18nUtil.h"
#import "ABI26_0_0RCTLog.h"
#import "ABI26_0_0RCTUtils.h"
#import "ABI26_0_0UIView+Private.h"
#import "UIView+ReactABI26_0_0.h"

typedef void (^ABI26_0_0RCTActionBlock)(ABI26_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI26_0_0RCTResetActionBlock)(ABI26_0_0RCTShadowView *shadowViewSelf);

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

@implementation ABI26_0_0RCTShadowView
{
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI26_0_0RCTShadowView *> *_ReactABI26_0_0Subviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  ABI26_0_0YGValue _paddingMetaProps[META_PROP_COUNT];
  ABI26_0_0YGValue _marginMetaProps[META_PROP_COUNT];
  ABI26_0_0YGValue _borderMetaProps[META_PROP_COUNT];
}

+ (ABI26_0_0YGConfigRef)yogaConfig
{
  static ABI26_0_0YGConfigRef yogaConfig;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    yogaConfig = ABI26_0_0YGConfigNew();
    ABI26_0_0YGConfigSetPointScaleFactor(yogaConfig, ABI26_0_0RCTScreenScale());
    ABI26_0_0YGConfigSetUseLegacyStretchBehaviour(yogaConfig, true);
  });
  return yogaConfig;
}

@synthesize ReactABI26_0_0Tag = _ReactABI26_0_0Tag;

// YogaNode API

static void ABI26_0_0RCTPrint(ABI26_0_0YGNodeRef node)
{
  ABI26_0_0RCTShadowView *shadowView = (__bridge ABI26_0_0RCTShadowView *)ABI26_0_0YGNodeGetContext(node);
  printf("%s(%lld), ", shadowView.viewName.UTF8String, (long long)shadowView.ReactABI26_0_0Tag.integerValue);
}

#define ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(ygvalue, setter, ...)    \
switch (ygvalue.unit) {                          \
  case ABI26_0_0YGUnitAuto:                               \
  case ABI26_0_0YGUnitUndefined:                          \
    setter(__VA_ARGS__, ABI26_0_0YGUndefined);            \
    break;                                       \
  case ABI26_0_0YGUnitPoint:                              \
    setter(__VA_ARGS__, ygvalue.value);          \
    break;                                       \
  case ABI26_0_0YGUnitPercent:                            \
    setter##Percent(__VA_ARGS__, ygvalue.value); \
    break;                                       \
}

#define ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(ygvalue, setter, ...) \
switch (ygvalue.unit) {                            \
  case ABI26_0_0YGUnitAuto:                                 \
    setter##Auto(__VA_ARGS__);                     \
    break;                                         \
  case ABI26_0_0YGUnitUndefined:                            \
    setter(__VA_ARGS__, ABI26_0_0YGUndefined);              \
    break;                                         \
  case ABI26_0_0YGUnitPoint:                                \
    setter(__VA_ARGS__, ygvalue.value);            \
    break;                                         \
  case ABI26_0_0YGUnitPercent:                              \
    setter##Percent(__VA_ARGS__, ygvalue.value);   \
    break;                                         \
}

static void ABI26_0_0RCTProcessMetaPropsPadding(const ABI26_0_0YGValue metaProps[META_PROP_COUNT], ABI26_0_0YGNodeRef node) {
  if (![[ABI26_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(metaProps[META_PROP_START], ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeStart);
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(metaProps[META_PROP_END], ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeEnd);
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(metaProps[META_PROP_LEFT], ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeLeft);
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(metaProps[META_PROP_RIGHT], ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeRight);
  } else {
    ABI26_0_0YGValue start = metaProps[META_PROP_START].unit == ABI26_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI26_0_0YGValue end = metaProps[META_PROP_END].unit == ABI26_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(start, ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeStart);
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(end, ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeEnd);
  }
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(metaProps[META_PROP_TOP], ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeTop);
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(metaProps[META_PROP_BOTTOM], ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeBottom);
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(metaProps[META_PROP_HORIZONTAL], ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeHorizontal);
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(metaProps[META_PROP_VERTICAL], ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeVertical);
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(metaProps[META_PROP_ALL], ABI26_0_0YGNodeStyleSetPadding, node, ABI26_0_0YGEdgeAll);
}

static void ABI26_0_0RCTProcessMetaPropsMargin(const ABI26_0_0YGValue metaProps[META_PROP_COUNT], ABI26_0_0YGNodeRef node) {
  if (![[ABI26_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(metaProps[META_PROP_START], ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeStart);
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(metaProps[META_PROP_END], ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeEnd);
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(metaProps[META_PROP_LEFT], ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeLeft);
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(metaProps[META_PROP_RIGHT], ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeRight);
  } else {
    ABI26_0_0YGValue start = metaProps[META_PROP_START].unit == ABI26_0_0YGUnitUndefined ? metaProps[META_PROP_LEFT] : metaProps[META_PROP_START];
    ABI26_0_0YGValue end = metaProps[META_PROP_END].unit == ABI26_0_0YGUnitUndefined ? metaProps[META_PROP_RIGHT] : metaProps[META_PROP_END];
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(start, ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeStart);
    ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(end, ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeEnd);
  }
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(metaProps[META_PROP_TOP], ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeTop);
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(metaProps[META_PROP_BOTTOM], ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeBottom);
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(metaProps[META_PROP_HORIZONTAL], ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeHorizontal);
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(metaProps[META_PROP_VERTICAL], ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeVertical);
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(metaProps[META_PROP_ALL], ABI26_0_0YGNodeStyleSetMargin, node, ABI26_0_0YGEdgeAll);
}

static void ABI26_0_0RCTProcessMetaPropsBorder(const ABI26_0_0YGValue metaProps[META_PROP_COUNT], ABI26_0_0YGNodeRef node) {
  if (![[ABI26_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeStart, metaProps[META_PROP_START].value);
    ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeEnd, metaProps[META_PROP_END].value);
    ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeLeft, metaProps[META_PROP_LEFT].value);
    ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeRight, metaProps[META_PROP_RIGHT].value);
  } else {
    const float start = ABI26_0_0YGFloatIsUndefined(metaProps[META_PROP_START].value) ? metaProps[META_PROP_LEFT].value : metaProps[META_PROP_START].value;
    const float end = ABI26_0_0YGFloatIsUndefined(metaProps[META_PROP_END].value) ? metaProps[META_PROP_RIGHT].value : metaProps[META_PROP_END].value;
    ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeStart, start);
    ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeEnd, end);
  }
  ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeTop, metaProps[META_PROP_TOP].value);
  ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeBottom, metaProps[META_PROP_BOTTOM].value);
  ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeHorizontal, metaProps[META_PROP_HORIZONTAL].value);
  ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeVertical, metaProps[META_PROP_VERTICAL].value);
  ABI26_0_0YGNodeStyleSetBorder(node, ABI26_0_0YGEdgeAll, metaProps[META_PROP_ALL].value);
}

- (void)applyLayoutNode:(ABI26_0_0YGNodeRef)node
      viewsWithNewFrame:(NSMutableSet<ABI26_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  if (!ABI26_0_0YGNodeGetHasNewLayout(node)) {
    return;
  }

  ABI26_0_0RCTAssert(!ABI26_0_0YGNodeIsDirty(node), @"Attempt to get layout metrics from dirtied Yoga node.");

  ABI26_0_0YGNodeSetHasNewLayout(node, false);

  if (ABI26_0_0YGNodeStyleGetDisplay(node) == ABI26_0_0YGDisplayNone) {
    // If the node is hidden (has `display: none;`), its (and its descendants)
    // layout metrics are invalid and/or dirtied, so we have to stop here.
    return;
  }

  CGRect frame = CGRectMake(ABI26_0_0YGNodeLayoutGetLeft(node), ABI26_0_0YGNodeLayoutGetTop(node), ABI26_0_0YGNodeLayoutGetWidth(node), ABI26_0_0YGNodeLayoutGetHeight(node));

  // Even if `ABI26_0_0YGNodeLayoutGetDirection` can return `ABI26_0_0YGDirectionInherit` here, it actually means
  // that Yoga will use LTR layout for the view (even if layout process is not finished yet).
  UIUserInterfaceLayoutDirection layoutDirection = ABI26_0_0YGNodeLayoutGetDirection(_yogaNode) == ABI26_0_0YGDirectionRTL ? UIUserInterfaceLayoutDirectionRightToLeft : UIUserInterfaceLayoutDirectionLeftToRight;

  [self applyLayoutWithFrame:frame
             layoutDirection:layoutDirection
      viewsWithUpdatedLayout:viewsWithNewFrame
            absolutePosition:absolutePosition];
}

- (void)applyLayoutWithFrame:(CGRect)frame
             layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
      viewsWithUpdatedLayout:(NSMutableSet<ABI26_0_0RCTShadowView *> *)viewsWithUpdatedLayout
            absolutePosition:(CGPoint)absolutePosition
{
  if (!CGRectEqualToRect(_frame, frame) || _layoutDirection != layoutDirection) {
    _frame = frame;
    _layoutDirection = layoutDirection;
    [viewsWithUpdatedLayout addObject:self];
  }

  absolutePosition.x += frame.origin.x;
  absolutePosition.y += frame.origin.y;

  [self applyLayoutToChildren:_yogaNode
            viewsWithNewFrame:viewsWithUpdatedLayout
             absolutePosition:absolutePosition];
}

- (void)applyLayoutToChildren:(ABI26_0_0YGNodeRef)node
            viewsWithNewFrame:(NSMutableSet<ABI26_0_0RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition
{
  for (unsigned int i = 0; i < ABI26_0_0YGNodeGetChildCount(node); ++i) {
    ABI26_0_0RCTShadowView *child = (ABI26_0_0RCTShadowView *)_ReactABI26_0_0Subviews[i];
    [child applyLayoutNode:ABI26_0_0YGNodeGetChild(node, i)
         viewsWithNewFrame:viewsWithNewFrame
          absolutePosition:absolutePosition];
  }
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI26_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  ABI26_0_0RCTShadowView *shadowView = self;
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

- (BOOL)viewIsDescendantOf:(ABI26_0_0RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  ABI26_0_0RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    shadowView = shadowView->_superview;
    depth--;
  }
  return ancestor == shadowView;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _frame = CGRectMake(0, 0, ABI26_0_0YGUndefined, ABI26_0_0YGUndefined);

    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = ABI26_0_0YGValueUndefined;
      _marginMetaProps[ii] = ABI26_0_0YGValueUndefined;
      _borderMetaProps[ii] = ABI26_0_0YGValueUndefined;
    }

    _intrinsicContentSize = CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);

    _newView = YES;

    _ReactABI26_0_0Subviews = [NSMutableArray array];

    _yogaNode = ABI26_0_0YGNodeNewWithConfig([[self class] yogaConfig]);
     ABI26_0_0YGNodeSetContext(_yogaNode, (__bridge void *)self);
     ABI26_0_0YGNodeSetPrintFunc(_yogaNode, ABI26_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isReactABI26_0_0RootView
{
  return ABI26_0_0RCTIsReactABI26_0_0RootView(self.ReactABI26_0_0Tag);
}

- (void)dealloc
{
  ABI26_0_0YGNodeFree(_yogaNode);
}

- (BOOL)canHaveSubviews
{
  return YES;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)insertReactABI26_0_0Subview:(ABI26_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  ABI26_0_0RCTAssert(self.canHaveSubviews, @"Attempt to insert subview inside leaf view.");

  [_ReactABI26_0_0Subviews insertObject:subview atIndex:atIndex];
  if (![self isYogaLeafNode]) {
    ABI26_0_0YGNodeInsertChild(_yogaNode, subview.yogaNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
}

- (void)removeReactABI26_0_0Subview:(ABI26_0_0RCTShadowView *)subview
{
  subview->_superview = nil;
  [_ReactABI26_0_0Subviews removeObject:subview];
  if (![self isYogaLeafNode]) {
    ABI26_0_0YGNodeRemoveChild(_yogaNode, subview.yogaNode);
  }
}

- (NSArray<ABI26_0_0RCTShadowView *> *)ReactABI26_0_0Subviews
{
  return _ReactABI26_0_0Subviews;
}

- (ABI26_0_0RCTShadowView *)ReactABI26_0_0Superview
{
  return _superview;
}

- (NSNumber *)ReactABI26_0_0TagAtPoint:(CGPoint)point
{
  for (ABI26_0_0RCTShadowView *shadowView in _ReactABI26_0_0Subviews) {
    if (CGRectContainsPoint(shadowView.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ReactABI26_0_0TagAtPoint:relativePoint];
    }
  }
  return self.ReactABI26_0_0Tag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; ReactABI26_0_0Tag: %@; frame: %@>", self.viewName, self.ReactABI26_0_0Tag, NSStringFromCGRect(self.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI26_0_0RCTShadowView *subview in _ReactABI26_0_0Subviews) {
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

#define ABI26_0_0RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(ABI26_0_0YGValue)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (ABI26_0_0YGValue)margin##prop                           \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

ABI26_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI26_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI26_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI26_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI26_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI26_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI26_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)
ABI26_0_0RCT_MARGIN_PROPERTY(Start, START)
ABI26_0_0RCT_MARGIN_PROPERTY(End, END)

// Padding

#define ABI26_0_0RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(ABI26_0_0YGValue)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (ABI26_0_0YGValue)padding##prop                           \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

ABI26_0_0RCT_PADDING_PROPERTY(, ALL)
ABI26_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI26_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI26_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI26_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI26_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI26_0_0RCT_PADDING_PROPERTY(Right, RIGHT)
ABI26_0_0RCT_PADDING_PROPERTY(Start, START)
ABI26_0_0RCT_PADDING_PROPERTY(End, END)

// Border

#define ABI26_0_0RCT_BORDER_PROPERTY(prop, metaProp)             \
- (void)setBorder##prop##Width:(float)value             \
{                                                       \
  _borderMetaProps[META_PROP_##metaProp].value = value; \
  _recomputeBorder = YES;                               \
}                                                       \
- (float)border##prop##Width                            \
{                                                       \
  return _borderMetaProps[META_PROP_##metaProp].value;  \
}

ABI26_0_0RCT_BORDER_PROPERTY(, ALL)
ABI26_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI26_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI26_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI26_0_0RCT_BORDER_PROPERTY(Right, RIGHT)
ABI26_0_0RCT_BORDER_PROPERTY(Start, START)
ABI26_0_0RCT_BORDER_PROPERTY(End, END)

// Dimensions
#define ABI26_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(ABI26_0_0YGValue)value                                 \
{                                                                   \
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(value, ABI26_0_0YGNodeStyleSet##cssProp, _yogaNode);  \
}                                                                   \
- (ABI26_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI26_0_0YGNodeStyleGet##cssProp(_yogaNode);                        \
}

#define ABI26_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(setProp, getProp, cssProp)   \
- (void)set##setProp:(ABI26_0_0YGValue)value                                 \
{                                                                   \
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(value, ABI26_0_0YGNodeStyleSet##cssProp, _yogaNode);       \
}                                                                   \
- (ABI26_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI26_0_0YGNodeStyleGet##cssProp(_yogaNode);                        \
}

ABI26_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI26_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI26_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI26_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI26_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI26_0_0RCT_MIN_MAX_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI26_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(ABI26_0_0YGValue)value                                 \
{                                                                   \
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(value, ABI26_0_0YGNodeStyleSetPosition, _yogaNode, edge);  \
}                                                                   \
- (ABI26_0_0YGValue)getProp                                                  \
{                                                                   \
  return ABI26_0_0YGNodeStyleGetPosition(_yogaNode, edge);                   \
}


ABI26_0_0RCT_POSITION_PROPERTY(Top, top, ABI26_0_0YGEdgeTop)
ABI26_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI26_0_0YGEdgeBottom)
ABI26_0_0RCT_POSITION_PROPERTY(Start, start, ABI26_0_0YGEdgeStart)
ABI26_0_0RCT_POSITION_PROPERTY(End, end, ABI26_0_0YGEdgeEnd)

- (void)setLeft:(ABI26_0_0YGValue)value
{
  ABI26_0_0YGEdge edge = [[ABI26_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI26_0_0YGEdgeStart : ABI26_0_0YGEdgeLeft;
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(value, ABI26_0_0YGNodeStyleSetPosition, _yogaNode, edge);
}
- (ABI26_0_0YGValue)left
{
  ABI26_0_0YGEdge edge = [[ABI26_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI26_0_0YGEdgeStart : ABI26_0_0YGEdgeLeft;
  return ABI26_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

- (void)setRight:(ABI26_0_0YGValue)value
{
  ABI26_0_0YGEdge edge = [[ABI26_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI26_0_0YGEdgeEnd : ABI26_0_0YGEdgeRight;
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE(value, ABI26_0_0YGNodeStyleSetPosition, _yogaNode, edge);
}
- (ABI26_0_0YGValue)right
{
  ABI26_0_0YGEdge edge = [[ABI26_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL] ? ABI26_0_0YGEdgeEnd : ABI26_0_0YGEdgeRight;
  return ABI26_0_0YGNodeStyleGetPosition(_yogaNode, edge);
}

// Size

- (CGSize)size
{
  ABI26_0_0YGValue width = ABI26_0_0YGNodeStyleGetWidth(_yogaNode);
  ABI26_0_0YGValue height = ABI26_0_0YGNodeStyleGetHeight(_yogaNode);

  return CGSizeMake(
    width.unit == ABI26_0_0YGUnitPoint ? width.value : NAN,
    height.unit == ABI26_0_0YGUnitPoint ? height.value : NAN
  );
}

- (void)setSize:(CGSize)size
{
  ABI26_0_0YGNodeStyleSetWidth(_yogaNode, size.width);
  ABI26_0_0YGNodeStyleSetHeight(_yogaNode, size.height);
}

// IntrinsicContentSize

static inline ABI26_0_0YGSize ABI26_0_0RCTShadowViewMeasure(ABI26_0_0YGNodeRef node, float width, ABI26_0_0YGMeasureMode widthMode, float height, ABI26_0_0YGMeasureMode heightMode)
{
  ABI26_0_0RCTShadowView *shadowView = (__bridge ABI26_0_0RCTShadowView *)ABI26_0_0YGNodeGetContext(node);

  CGSize intrinsicContentSize = shadowView->_intrinsicContentSize;
  // Replace `UIViewNoIntrinsicMetric` (which equals `-1`) with zero.
  intrinsicContentSize.width = MAX(0, intrinsicContentSize.width);
  intrinsicContentSize.height = MAX(0, intrinsicContentSize.height);

  ABI26_0_0YGSize result;

  switch (widthMode) {
    case ABI26_0_0YGMeasureModeUndefined:
      result.width = intrinsicContentSize.width;
      break;
    case ABI26_0_0YGMeasureModeExactly:
      result.width = width;
      break;
    case ABI26_0_0YGMeasureModeAtMost:
      result.width = MIN(width, intrinsicContentSize.width);
      break;
  }

  switch (heightMode) {
    case ABI26_0_0YGMeasureModeUndefined:
      result.height = intrinsicContentSize.height;
      break;
    case ABI26_0_0YGMeasureModeExactly:
      result.height = height;
      break;
    case ABI26_0_0YGMeasureModeAtMost:
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
    ABI26_0_0YGNodeSetMeasureFunc(_yogaNode, NULL);
  } else {
    ABI26_0_0YGNodeSetMeasureFunc(_yogaNode, ABI26_0_0RCTShadowViewMeasure);
  }

  ABI26_0_0YGNodeMarkDirty(_yogaNode);
}

// Local Data

- (void)setLocalData:(__unused NSObject *)localData
{
  // Do nothing by default.
}

// Flex

- (void)setFlexBasis:(ABI26_0_0YGValue)value
{
  ABI26_0_0RCT_SET_ABI26_0_0YGVALUE_AUTO(value, ABI26_0_0YGNodeStyleSetFlexBasis, _yogaNode);
}

- (ABI26_0_0YGValue)flexBasis
{
  return ABI26_0_0YGNodeStyleGetFlexBasis(_yogaNode);
}

#define ABI26_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  ABI26_0_0YGNodeStyleSet##cssProp(_yogaNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return ABI26_0_0YGNodeStyleGet##cssProp(_yogaNode);                \
}

ABI26_0_0RCT_STYLE_PROPERTY(Flex, flex, Flex, float)
ABI26_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
ABI26_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
ABI26_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI26_0_0YGFlexDirection)
ABI26_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI26_0_0YGJustify)
ABI26_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI26_0_0YGAlign)
ABI26_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI26_0_0YGAlign)
ABI26_0_0RCT_STYLE_PROPERTY(AlignContent, alignContent, AlignContent, ABI26_0_0YGAlign)
ABI26_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI26_0_0YGPositionType)
ABI26_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI26_0_0YGWrap)
ABI26_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI26_0_0YGOverflow)
ABI26_0_0RCT_STYLE_PROPERTY(Display, display, Display, ABI26_0_0YGDisplay)
ABI26_0_0RCT_STYLE_PROPERTY(Direction, direction, Direction, ABI26_0_0YGDirection)
ABI26_0_0RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

- (void)didUpdateReactABI26_0_0Subviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI26_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _yogaNode);
  }
  if (_recomputeMargin) {
    ABI26_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _yogaNode);
  }
  if (_recomputeBorder) {
    ABI26_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _yogaNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
