/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTShadowView.h"

#import "ABI12_0_0RCTConvert.h"
#import "ABI12_0_0RCTLog.h"
#import "ABI12_0_0RCTUtils.h"
#import "UIView+ReactABI12_0_0.h"
#import "ABI12_0_0UIView+Private.h"

typedef void (^ABI12_0_0RCTActionBlock)(ABI12_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI12_0_0RCTResetActionBlock)(ABI12_0_0RCTShadowView *shadowViewSelf);

static NSString *const ABI12_0_0RCTBackgroundColorProp = @"backgroundColor";

typedef NS_ENUM(unsigned int, meta_prop_t) {
  META_PROP_LEFT,
  META_PROP_TOP,
  META_PROP_RIGHT,
  META_PROP_BOTTOM,
  META_PROP_HORIZONTAL,
  META_PROP_VERTICAL,
  META_PROP_ALL,
  META_PROP_COUNT,
};

@implementation ABI12_0_0RCTShadowView
{
  ABI12_0_0RCTUpdateLifecycle _propagationLifecycle;
  ABI12_0_0RCTUpdateLifecycle _textLifecycle;
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI12_0_0RCTShadowView *> *_ReactABI12_0_0Subviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  BOOL _didUpdateSubviews;
  float _paddingMetaProps[META_PROP_COUNT];
  float _marginMetaProps[META_PROP_COUNT];
  float _borderMetaProps[META_PROP_COUNT];
}

@synthesize ReactABI12_0_0Tag = _ReactABI12_0_0Tag;

// cssNode api

static void ABI12_0_0RCTPrint(void *context)
{
  ABI12_0_0RCTShadowView *shadowView = (__bridge ABI12_0_0RCTShadowView *)context;
  printf("%s(%zd), ", shadowView.viewName.UTF8String, shadowView.ReactABI12_0_0Tag.integerValue);
}

// Enforces precedence rules, e.g. marginLeft > marginHorizontal > margin.
#define DEFINE_PROCESS_META_PROPS(type)                                                            \
static void ABI12_0_0RCTProcessMetaProps##type(const float metaProps[META_PROP_COUNT], ABI12_0_0CSSNodeRef node) {   \
  if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_LEFT])) {                                           \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeStart, metaProps[META_PROP_LEFT]);                          \
  } else if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_HORIZONTAL])) {                              \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeStart, metaProps[META_PROP_HORIZONTAL]);                    \
  } else if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeStart, metaProps[META_PROP_ALL]);                           \
  } else {                                                                                         \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeStart, 0);                                                  \
  }                                                                                                \
                                                                                                   \
  if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_RIGHT])) {                                          \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeEnd, metaProps[META_PROP_RIGHT]);                           \
  } else if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_HORIZONTAL])) {                              \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeEnd, metaProps[META_PROP_HORIZONTAL]);                      \
  } else if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeEnd, metaProps[META_PROP_ALL]);                             \
  } else {                                                                                         \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeEnd, 0);                                                    \
  }                                                                                                \
                                                                                                   \
  if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_TOP])) {                                            \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeTop, metaProps[META_PROP_TOP]);                             \
  } else if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_VERTICAL])) {                                \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeTop, metaProps[META_PROP_VERTICAL]);                        \
  } else if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeTop, metaProps[META_PROP_ALL]);                             \
  } else {                                                                                         \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeTop, 0);                                                    \
  }                                                                                                \
                                                                                                   \
  if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_BOTTOM])) {                                         \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeBottom, metaProps[META_PROP_BOTTOM]);                       \
  } else if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_VERTICAL])) {                                \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeBottom, metaProps[META_PROP_VERTICAL]);                     \
  } else if (!ABI12_0_0CSSValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeBottom, metaProps[META_PROP_ALL]);                          \
  } else {                                                                                         \
    ABI12_0_0CSSNodeStyleSet##type(node, ABI12_0_0CSSEdgeBottom, 0);                                                 \
  }                                                                                                \
}

DEFINE_PROCESS_META_PROPS(Padding);
DEFINE_PROCESS_META_PROPS(Margin);
DEFINE_PROCESS_META_PROPS(Border);

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

- (void)applyLayoutNode:(ABI12_0_0CSSNodeRef)node
      viewsWithNewFrame:(NSMutableSet<ABI12_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  if (!ABI12_0_0CSSNodeGetHasNewLayout(node)) {
    return;
  }
  ABI12_0_0CSSNodeSetHasNewLayout(node, false);

  CGPoint absoluteTopLeft = {
    absolutePosition.x + ABI12_0_0CSSNodeLayoutGetLeft(node),
    absolutePosition.y + ABI12_0_0CSSNodeLayoutGetTop(node)
  };

  CGPoint absoluteBottomRight = {
    absolutePosition.x + ABI12_0_0CSSNodeLayoutGetLeft(node) + ABI12_0_0CSSNodeLayoutGetWidth(node),
    absolutePosition.y + ABI12_0_0CSSNodeLayoutGetTop(node) + ABI12_0_0CSSNodeLayoutGetHeight(node)
  };

  CGRect frame = {{
    ABI12_0_0RCTRoundPixelValue(ABI12_0_0CSSNodeLayoutGetLeft(node)),
    ABI12_0_0RCTRoundPixelValue(ABI12_0_0CSSNodeLayoutGetTop(node)),
  }, {
    ABI12_0_0RCTRoundPixelValue(absoluteBottomRight.x - absoluteTopLeft.x),
    ABI12_0_0RCTRoundPixelValue(absoluteBottomRight.y - absoluteTopLeft.y)
  }};

  if (!CGRectEqualToRect(frame, _frame)) {
    _frame = frame;
    [viewsWithNewFrame addObject:self];
  }

  absolutePosition.x += ABI12_0_0CSSNodeLayoutGetLeft(node);
  absolutePosition.y += ABI12_0_0CSSNodeLayoutGetTop(node);

  [self applyLayoutToChildren:node viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
}

- (void)applyLayoutToChildren:(ABI12_0_0CSSNodeRef)node
            viewsWithNewFrame:(NSMutableSet<ABI12_0_0RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition
{
  for (unsigned int i = 0; i < ABI12_0_0CSSNodeChildCount(node); ++i) {
    ABI12_0_0RCTShadowView *child = (ABI12_0_0RCTShadowView *)_ReactABI12_0_0Subviews[i];
    [child applyLayoutNode:ABI12_0_0CSSNodeGetChild(node, i)
         viewsWithNewFrame:viewsWithNewFrame
          absolutePosition:absolutePosition];
  }
}

- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<ABI12_0_0RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  // TODO: we always refresh all propagated properties when propagation is
  // dirtied, but really we should track which properties have changed and
  // only update those.

  if (_didUpdateSubviews) {
    _didUpdateSubviews = NO;
    [self didUpdateReactABI12_0_0Subviews];
    [applierBlocks addObject:^(NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      UIView *view = viewRegistry[self->_ReactABI12_0_0Tag];
      [view clearSortedSubviews];
      [view didUpdateReactABI12_0_0Subviews];
    }];
  }

  if (!_backgroundColor) {
    UIColor *parentBackgroundColor = parentProperties[ABI12_0_0RCTBackgroundColorProp];
    if (parentBackgroundColor) {
      [applierBlocks addObject:^(NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[self->_ReactABI12_0_0Tag];
        [view ReactABI12_0_0SetInheritedBackgroundColor:parentBackgroundColor];
      }];
    }
  } else {
    // Update parent properties for children
    NSMutableDictionary<NSString *, id> *properties = [NSMutableDictionary dictionaryWithDictionary:parentProperties];
    CGFloat alpha = CGColorGetAlpha(_backgroundColor.CGColor);
    if (alpha < 1.0) {
      // If bg is non-opaque, don't propagate further
      properties[ABI12_0_0RCTBackgroundColorProp] = [UIColor clearColor];
    } else {
      properties[ABI12_0_0RCTBackgroundColorProp] = _backgroundColor;
    }
    return properties;
  }
  return parentProperties;
}

- (void)collectUpdatedProperties:(NSMutableSet<ABI12_0_0RCTApplierBlock> *)applierBlocks
                parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  if (_propagationLifecycle == ABI12_0_0RCTUpdateLifecycleComputed && [parentProperties isEqualToDictionary:_lastParentProperties]) {
    return;
  }
  _propagationLifecycle = ABI12_0_0RCTUpdateLifecycleComputed;
  _lastParentProperties = parentProperties;
  NSDictionary<NSString *, id> *nextProps = [self processUpdatedProperties:applierBlocks parentProperties:parentProperties];
  for (ABI12_0_0RCTShadowView *child in _ReactABI12_0_0Subviews) {
    [child collectUpdatedProperties:applierBlocks parentProperties:nextProps];
  }
}

- (void)collectUpdatedFrames:(NSMutableSet<ABI12_0_0RCTShadowView *> *)viewsWithNewFrame
                   withFrame:(CGRect)frame
                      hidden:(BOOL)hidden
            absolutePosition:(CGPoint)absolutePosition
{
  if (_hidden != hidden) {
    // The hidden state has changed. Even if the frame hasn't changed, add
    // this ShadowView to viewsWithNewFrame so the UIManager will process
    // this ShadowView's UIView and update its hidden state.
    _hidden = hidden;
    [viewsWithNewFrame addObject:self];
  }

  if (!CGRectEqualToRect(frame, _frame)) {
    ABI12_0_0CSSNodeStyleSetPositionType(_cssNode, ABI12_0_0CSSPositionTypeAbsolute);
    ABI12_0_0CSSNodeStyleSetWidth(_cssNode, frame.size.width);
    ABI12_0_0CSSNodeStyleSetHeight(_cssNode, frame.size.height);
    ABI12_0_0CSSNodeStyleSetPosition(_cssNode, ABI12_0_0CSSEdgeLeft, frame.origin.x);
    ABI12_0_0CSSNodeStyleSetPosition(_cssNode, ABI12_0_0CSSEdgeTop, frame.origin.y);
  }

  ABI12_0_0CSSNodeCalculateLayout(_cssNode, frame.size.width, frame.size.height, ABI12_0_0CSSDirectionInherit);
  [self applyLayoutNode:_cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI12_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  ABI12_0_0RCTShadowView *shadowView = self;
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

- (BOOL)viewIsDescendantOf:(ABI12_0_0RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  ABI12_0_0RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    shadowView = shadowView->_superview;
    depth--;
  }
  return ancestor == shadowView;
}

- (instancetype)init
{
  if ((self = [super init])) {

    _frame = CGRectMake(0, 0, ABI12_0_0CSSUndefined, ABI12_0_0CSSUndefined);

    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = ABI12_0_0CSSUndefined;
      _marginMetaProps[ii] = ABI12_0_0CSSUndefined;
      _borderMetaProps[ii] = ABI12_0_0CSSUndefined;
    }

    _newView = YES;
    _propagationLifecycle = ABI12_0_0RCTUpdateLifecycleUninitialized;
    _textLifecycle = ABI12_0_0RCTUpdateLifecycleUninitialized;

    _ReactABI12_0_0Subviews = [NSMutableArray array];

    _cssNode = ABI12_0_0CSSNodeNew();
    ABI12_0_0CSSNodeSetContext(_cssNode, (__bridge void *)self);
    ABI12_0_0CSSNodeSetPrintFunc(_cssNode, ABI12_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isReactABI12_0_0RootView
{
  return ABI12_0_0RCTIsReactABI12_0_0RootView(self.ReactABI12_0_0Tag);
}

- (void)dealloc
{
  ABI12_0_0CSSNodeFree(_cssNode);
}

- (BOOL)isABI12_0_0CSSLeafNode
{
  return NO;
}

- (void)dirtyPropagation
{
  if (_propagationLifecycle != ABI12_0_0RCTUpdateLifecycleDirtied) {
    _propagationLifecycle = ABI12_0_0RCTUpdateLifecycleDirtied;
    [_superview dirtyPropagation];
  }
}

- (BOOL)isPropagationDirty
{
  return _propagationLifecycle != ABI12_0_0RCTUpdateLifecycleComputed;
}

- (void)dirtyText
{
  if (_textLifecycle != ABI12_0_0RCTUpdateLifecycleDirtied) {
    _textLifecycle = ABI12_0_0RCTUpdateLifecycleDirtied;
    [_superview dirtyText];
  }
}

- (BOOL)isTextDirty
{
  return _textLifecycle != ABI12_0_0RCTUpdateLifecycleComputed;
}

- (void)setTextComputed
{
  _textLifecycle = ABI12_0_0RCTUpdateLifecycleComputed;
}

- (void)insertReactABI12_0_0Subview:(ABI12_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [_ReactABI12_0_0Subviews insertObject:subview atIndex:atIndex];
  if (![self isABI12_0_0CSSLeafNode]) {
    ABI12_0_0CSSNodeInsertChild(_cssNode, subview.cssNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
  _didUpdateSubviews = YES;
  [self dirtyText];
  [self dirtyPropagation];
}

- (void)removeReactABI12_0_0Subview:(ABI12_0_0RCTShadowView *)subview
{
  [subview dirtyText];
  [subview dirtyPropagation];
  _didUpdateSubviews = YES;
  subview->_superview = nil;
  [_ReactABI12_0_0Subviews removeObject:subview];
  if (![self isABI12_0_0CSSLeafNode]) {
    ABI12_0_0CSSNodeRemoveChild(_cssNode, subview.cssNode);
  }
}

- (NSArray<ABI12_0_0RCTShadowView *> *)ReactABI12_0_0Subviews
{
  return _ReactABI12_0_0Subviews;
}

- (ABI12_0_0RCTShadowView *)ReactABI12_0_0Superview
{
  return _superview;
}

- (NSNumber *)ReactABI12_0_0TagAtPoint:(CGPoint)point
{
  for (ABI12_0_0RCTShadowView *shadowView in _ReactABI12_0_0Subviews) {
    if (CGRectContainsPoint(shadowView.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ReactABI12_0_0TagAtPoint:relativePoint];
    }
  }
  return self.ReactABI12_0_0Tag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; ReactABI12_0_0Tag: %@; frame: %@>", self.viewName, self.ReactABI12_0_0Tag, NSStringFromCGRect(self.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI12_0_0RCTShadowView *subview in _ReactABI12_0_0Subviews) {
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

#define ABI12_0_0RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(CGFloat)value            \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (CGFloat)margin##prop                           \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

ABI12_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI12_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI12_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI12_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI12_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI12_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI12_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)

// Padding

#define ABI12_0_0RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(CGFloat)value            \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (CGFloat)padding##prop                           \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

ABI12_0_0RCT_PADDING_PROPERTY(, ALL)
ABI12_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI12_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI12_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI12_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI12_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI12_0_0RCT_PADDING_PROPERTY(Right, RIGHT)

- (UIEdgeInsets)paddingAsInsets
{
  if (ABI12_0_0CSSNodeLayoutGetDirection(_cssNode) == ABI12_0_0CSSDirectionRTL) {
    return (UIEdgeInsets){
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeTop),
      !ABI12_0_0CSSValueIsUndefined(ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeEnd)) ?
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeEnd) :
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeLeft),
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeBottom),
      !ABI12_0_0CSSValueIsUndefined(ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeStart)) ?
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeStart) :
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeRight)
    };
  } else {
    return (UIEdgeInsets){
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeTop),
      !ABI12_0_0CSSValueIsUndefined(ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeStart)) ?
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeStart) :
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeLeft),
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeBottom),
      !ABI12_0_0CSSValueIsUndefined(ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeEnd)) ?
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeEnd) :
      ABI12_0_0CSSNodeStyleGetPadding(_cssNode, ABI12_0_0CSSEdgeRight)
    };
  }
}

// Border

#define ABI12_0_0RCT_BORDER_PROPERTY(prop, metaProp)            \
- (void)setBorder##prop##Width:(CGFloat)value          \
{                                                      \
  _borderMetaProps[META_PROP_##metaProp] = value;      \
  _recomputeBorder = YES;                              \
}                                                      \
- (CGFloat)border##prop##Width                         \
{                                                      \
  return _borderMetaProps[META_PROP_##metaProp];       \
}

ABI12_0_0RCT_BORDER_PROPERTY(, ALL)
ABI12_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI12_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI12_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI12_0_0RCT_BORDER_PROPERTY(Right, RIGHT)

// Dimensions


#define ABI12_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(CGFloat)value                                 \
{                                                                   \
  ABI12_0_0CSSNodeStyleSet##cssProp(_cssNode, value);                        \
  [self dirtyText];                                                 \
}                                                                   \
- (CGFloat)getProp                                                  \
{                                                                   \
  return ABI12_0_0CSSNodeStyleGet##cssProp(_cssNode);                        \
}

ABI12_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI12_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI12_0_0RCT_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI12_0_0RCT_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI12_0_0RCT_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI12_0_0RCT_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI12_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(CGFloat)value                                 \
{                                                                   \
  ABI12_0_0CSSNodeStyleSetPosition(_cssNode, edge, value);                   \
  [self dirtyText];                                                 \
}                                                                   \
- (CGFloat)getProp                                                  \
{                                                                   \
  return ABI12_0_0CSSNodeStyleGetPosition(_cssNode, edge);                   \
}

ABI12_0_0RCT_POSITION_PROPERTY(Top, top, ABI12_0_0CSSEdgeTop)
ABI12_0_0RCT_POSITION_PROPERTY(Right, right, ABI12_0_0CSSEdgeEnd)
ABI12_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI12_0_0CSSEdgeBottom)
ABI12_0_0RCT_POSITION_PROPERTY(Left, left, ABI12_0_0CSSEdgeStart)

- (void)setFrame:(CGRect)frame
{
  if (!CGRectEqualToRect(frame, _frame)) {
    _frame = frame;
    ABI12_0_0CSSNodeStyleSetPosition(_cssNode, ABI12_0_0CSSEdgeLeft, CGRectGetMinX(frame));
    ABI12_0_0CSSNodeStyleSetPosition(_cssNode, ABI12_0_0CSSEdgeTop, CGRectGetMinY(frame));
    ABI12_0_0CSSNodeStyleSetWidth(_cssNode, CGRectGetWidth(frame));
    ABI12_0_0CSSNodeStyleSetHeight(_cssNode, CGRectGetHeight(frame));
  }
}

static inline void ABI12_0_0RCTAssignSuggestedDimension(ABI12_0_0CSSNodeRef cssNode, ABI12_0_0CSSDimension dimension, CGFloat amount)
{
  if (amount != UIViewNoIntrinsicMetric) {
    switch (dimension) {
      case ABI12_0_0CSSDimensionWidth:
        if (isnan(ABI12_0_0CSSNodeStyleGetWidth(cssNode))) {
          ABI12_0_0CSSNodeStyleSetWidth(cssNode, amount);
        }
        break;
      case ABI12_0_0CSSDimensionHeight:
        if (isnan(ABI12_0_0CSSNodeStyleGetHeight(cssNode))) {
          ABI12_0_0CSSNodeStyleSetHeight(cssNode, amount);
        }
        break;
    }
  }
}

- (void)setIntrinsicContentSize:(CGSize)size
{
  if (ABI12_0_0CSSNodeStyleGetFlexGrow(_cssNode) == 0 && ABI12_0_0CSSNodeStyleGetFlexShrink(_cssNode) == 0) {
    ABI12_0_0RCTAssignSuggestedDimension(_cssNode, ABI12_0_0CSSDimensionHeight, size.height);
    ABI12_0_0RCTAssignSuggestedDimension(_cssNode, ABI12_0_0CSSDimensionWidth, size.width);
  }
}

- (void)setTopLeft:(CGPoint)topLeft
{
  ABI12_0_0CSSNodeStyleSetPosition(_cssNode, ABI12_0_0CSSEdgeLeft, topLeft.x);
  ABI12_0_0CSSNodeStyleSetPosition(_cssNode, ABI12_0_0CSSEdgeTop, topLeft.y);
}

- (void)setSize:(CGSize)size
{
  ABI12_0_0CSSNodeStyleSetWidth(_cssNode, size.width);
  ABI12_0_0CSSNodeStyleSetHeight(_cssNode, size.height);
}

// Flex

- (void)setFlex:(CGFloat)value
{
  ABI12_0_0CSSNodeStyleSetFlex(_cssNode, value);
}

#define ABI12_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  ABI12_0_0CSSNodeStyleSet##cssProp(_cssNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return ABI12_0_0CSSNodeStyleGet##cssProp(_cssNode);                \
}

ABI12_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, CGFloat)
ABI12_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, CGFloat)
ABI12_0_0RCT_STYLE_PROPERTY(FlexBasis, flexBasis, FlexBasis, CGFloat)
ABI12_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI12_0_0CSSFlexDirection)
ABI12_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI12_0_0CSSJustify)
ABI12_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI12_0_0CSSAlign)
ABI12_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI12_0_0CSSAlign)
ABI12_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI12_0_0CSSPositionType)
ABI12_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI12_0_0CSSWrapType)
ABI12_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI12_0_0CSSOverflow)

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

- (void)didUpdateReactABI12_0_0Subviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI12_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _cssNode);
  }
  if (_recomputeMargin) {
    ABI12_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _cssNode);
  }
  if (_recomputeBorder) {
    ABI12_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _cssNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
