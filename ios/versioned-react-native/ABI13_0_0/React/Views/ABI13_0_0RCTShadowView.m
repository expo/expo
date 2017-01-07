/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTShadowView.h"

#import "ABI13_0_0RCTConvert.h"
#import "ABI13_0_0RCTLog.h"
#import "ABI13_0_0RCTUtils.h"
#import "ABI13_0_0UIView+Private.h"
#import "UIView+ReactABI13_0_0.h"

typedef void (^ABI13_0_0RCTActionBlock)(ABI13_0_0RCTShadowView *shadowViewSelf, id value);
typedef void (^ABI13_0_0RCTResetActionBlock)(ABI13_0_0RCTShadowView *shadowViewSelf);

static NSString *const ABI13_0_0RCTBackgroundColorProp = @"backgroundColor";

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

@implementation ABI13_0_0RCTShadowView
{
  ABI13_0_0RCTUpdateLifecycle _propagationLifecycle;
  ABI13_0_0RCTUpdateLifecycle _textLifecycle;
  NSDictionary *_lastParentProperties;
  NSMutableArray<ABI13_0_0RCTShadowView *> *_ReactABI13_0_0Subviews;
  BOOL _recomputePadding;
  BOOL _recomputeMargin;
  BOOL _recomputeBorder;
  BOOL _didUpdateSubviews;
  float _paddingMetaProps[META_PROP_COUNT];
  float _marginMetaProps[META_PROP_COUNT];
  float _borderMetaProps[META_PROP_COUNT];
}

@synthesize ReactABI13_0_0Tag = _ReactABI13_0_0Tag;

// cssNode api

static void ABI13_0_0RCTPrint(ABI13_0_0YGNodeRef node)
{
  ABI13_0_0RCTShadowView *shadowView = (__bridge ABI13_0_0RCTShadowView *)ABI13_0_0YGNodeGetContext(node);
  printf("%s(%zd), ", shadowView.viewName.UTF8String, shadowView.ReactABI13_0_0Tag.integerValue);
}

// Enforces precedence rules, e.g. marginLeft > marginHorizontal > margin.
#define DEFINE_PROCESS_META_PROPS(type)                                                            \
static void ABI13_0_0RCTProcessMetaProps##type(const float metaProps[META_PROP_COUNT], ABI13_0_0YGNodeRef node) {   \
  if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_LEFT])) {                                           \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeStart, metaProps[META_PROP_LEFT]);                          \
  } else if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_HORIZONTAL])) {                              \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeStart, metaProps[META_PROP_HORIZONTAL]);                    \
  } else if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeStart, metaProps[META_PROP_ALL]);                           \
  } else {                                                                                         \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeStart, 0);                                                  \
  }                                                                                                \
                                                                                                   \
  if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_RIGHT])) {                                          \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeEnd, metaProps[META_PROP_RIGHT]);                           \
  } else if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_HORIZONTAL])) {                              \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeEnd, metaProps[META_PROP_HORIZONTAL]);                      \
  } else if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeEnd, metaProps[META_PROP_ALL]);                             \
  } else {                                                                                         \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeEnd, 0);                                                    \
  }                                                                                                \
                                                                                                   \
  if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_TOP])) {                                            \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeTop, metaProps[META_PROP_TOP]);                             \
  } else if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_VERTICAL])) {                                \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeTop, metaProps[META_PROP_VERTICAL]);                        \
  } else if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeTop, metaProps[META_PROP_ALL]);                             \
  } else {                                                                                         \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeTop, 0);                                                    \
  }                                                                                                \
                                                                                                   \
  if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_BOTTOM])) {                                         \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeBottom, metaProps[META_PROP_BOTTOM]);                       \
  } else if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_VERTICAL])) {                                \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeBottom, metaProps[META_PROP_VERTICAL]);                     \
  } else if (!ABI13_0_0YGValueIsUndefined(metaProps[META_PROP_ALL])) {                                     \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeBottom, metaProps[META_PROP_ALL]);                          \
  } else {                                                                                         \
    ABI13_0_0YGNodeStyleSet##type(node, ABI13_0_0YGEdgeBottom, 0);                                                 \
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

- (void)applyLayoutNode:(ABI13_0_0YGNodeRef)node
      viewsWithNewFrame:(NSMutableSet<ABI13_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  if (!ABI13_0_0YGNodeGetHasNewLayout(node)) {
    return;
  }
  ABI13_0_0YGNodeSetHasNewLayout(node, false);

#if ABI13_0_0RCT_DEBUG
  // This works around a breaking change in css-layout where setting flexBasis needs to be set explicitly, instead of relying on flex to propagate.
  // We check for it by seeing if a width/height is provided along with a flexBasis of 0 and the width/height is laid out as 0.
  if ((!ABI13_0_0YGValueIsUndefined(ABI13_0_0YGNodeStyleGetFlexBasis(node)) && ABI13_0_0YGNodeStyleGetFlexBasis(node) == 0) &&
      ((!ABI13_0_0YGValueIsUndefined(ABI13_0_0YGNodeStyleGetWidth(node)) && ABI13_0_0YGNodeStyleGetWidth(node) > 0 && ABI13_0_0YGNodeLayoutGetWidth(node) == 0) ||
       (!ABI13_0_0YGValueIsUndefined(ABI13_0_0YGNodeStyleGetHeight(node)) && ABI13_0_0YGNodeStyleGetHeight(node) > 0 && ABI13_0_0YGNodeLayoutGetHeight(node) == 0))) {
    ABI13_0_0RCTLogError(@"View was rendered with explicitly set width/height but with a 0 flexBasis. (This might be fixed by changing flex: to flexGrow:) View: %@", self);
  }
#endif

  CGPoint absoluteTopLeft = {
    absolutePosition.x + ABI13_0_0YGNodeLayoutGetLeft(node),
    absolutePosition.y + ABI13_0_0YGNodeLayoutGetTop(node)
  };

  CGPoint absoluteBottomRight = {
    absolutePosition.x + ABI13_0_0YGNodeLayoutGetLeft(node) + ABI13_0_0YGNodeLayoutGetWidth(node),
    absolutePosition.y + ABI13_0_0YGNodeLayoutGetTop(node) + ABI13_0_0YGNodeLayoutGetHeight(node)
  };

  CGRect frame = {{
    ABI13_0_0RCTRoundPixelValue(ABI13_0_0YGNodeLayoutGetLeft(node)),
    ABI13_0_0RCTRoundPixelValue(ABI13_0_0YGNodeLayoutGetTop(node)),
  }, {
    ABI13_0_0RCTRoundPixelValue(absoluteBottomRight.x - absoluteTopLeft.x),
    ABI13_0_0RCTRoundPixelValue(absoluteBottomRight.y - absoluteTopLeft.y)
  }};

  if (!CGRectEqualToRect(frame, _frame)) {
    _frame = frame;
    [viewsWithNewFrame addObject:self];
  }

  absolutePosition.x += ABI13_0_0YGNodeLayoutGetLeft(node);
  absolutePosition.y += ABI13_0_0YGNodeLayoutGetTop(node);

  [self applyLayoutToChildren:node viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
}

- (void)applyLayoutToChildren:(ABI13_0_0YGNodeRef)node
            viewsWithNewFrame:(NSMutableSet<ABI13_0_0RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition
{
  for (unsigned int i = 0; i < ABI13_0_0YGNodeChildCount(node); ++i) {
    ABI13_0_0RCTShadowView *child = (ABI13_0_0RCTShadowView *)_ReactABI13_0_0Subviews[i];
    [child applyLayoutNode:ABI13_0_0YGNodeGetChild(node, i)
         viewsWithNewFrame:viewsWithNewFrame
          absolutePosition:absolutePosition];
  }
}

- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<ABI13_0_0RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  // TODO: we always refresh all propagated properties when propagation is
  // dirtied, but really we should track which properties have changed and
  // only update those.

  if (_didUpdateSubviews) {
    _didUpdateSubviews = NO;
    [self didUpdateReactABI13_0_0Subviews];
    [applierBlocks addObject:^(NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      UIView *view = viewRegistry[self->_ReactABI13_0_0Tag];
      [view clearSortedSubviews];
      [view didUpdateReactABI13_0_0Subviews];
    }];
  }

  if (!_backgroundColor) {
    UIColor *parentBackgroundColor = parentProperties[ABI13_0_0RCTBackgroundColorProp];
    if (parentBackgroundColor) {
      [applierBlocks addObject:^(NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[self->_ReactABI13_0_0Tag];
        [view ReactABI13_0_0SetInheritedBackgroundColor:parentBackgroundColor];
      }];
    }
  } else {
    // Update parent properties for children
    NSMutableDictionary<NSString *, id> *properties = [NSMutableDictionary dictionaryWithDictionary:parentProperties];
    CGFloat alpha = CGColorGetAlpha(_backgroundColor.CGColor);
    if (alpha < 1.0) {
      // If bg is non-opaque, don't propagate further
      properties[ABI13_0_0RCTBackgroundColorProp] = [UIColor clearColor];
    } else {
      properties[ABI13_0_0RCTBackgroundColorProp] = _backgroundColor;
    }
    return properties;
  }
  return parentProperties;
}

- (void)collectUpdatedProperties:(NSMutableSet<ABI13_0_0RCTApplierBlock> *)applierBlocks
                parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  if (_propagationLifecycle == ABI13_0_0RCTUpdateLifecycleComputed && [parentProperties isEqualToDictionary:_lastParentProperties]) {
    return;
  }
  _propagationLifecycle = ABI13_0_0RCTUpdateLifecycleComputed;
  _lastParentProperties = parentProperties;
  NSDictionary<NSString *, id> *nextProps = [self processUpdatedProperties:applierBlocks parentProperties:parentProperties];
  for (ABI13_0_0RCTShadowView *child in _ReactABI13_0_0Subviews) {
    [child collectUpdatedProperties:applierBlocks parentProperties:nextProps];
  }
}

- (void)collectUpdatedFrames:(NSMutableSet<ABI13_0_0RCTShadowView *> *)viewsWithNewFrame
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
    ABI13_0_0YGNodeStyleSetPositionType(_cssNode, ABI13_0_0YGPositionTypeAbsolute);
    ABI13_0_0YGNodeStyleSetWidth(_cssNode, frame.size.width);
    ABI13_0_0YGNodeStyleSetHeight(_cssNode, frame.size.height);
    ABI13_0_0YGNodeStyleSetPosition(_cssNode, ABI13_0_0YGEdgeLeft, frame.origin.x);
    ABI13_0_0YGNodeStyleSetPosition(_cssNode, ABI13_0_0YGEdgeTop, frame.origin.y);
  }

  ABI13_0_0YGNodeCalculateLayout(_cssNode, frame.size.width, frame.size.height, ABI13_0_0YGDirectionInherit);
  [self applyLayoutNode:_cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
}

- (CGRect)measureLayoutRelativeToAncestor:(ABI13_0_0RCTShadowView *)ancestor
{
  CGPoint offset = CGPointZero;
  NSInteger depth = 30; // max depth to search
  ABI13_0_0RCTShadowView *shadowView = self;
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

- (BOOL)viewIsDescendantOf:(ABI13_0_0RCTShadowView *)ancestor
{
  NSInteger depth = 30; // max depth to search
  ABI13_0_0RCTShadowView *shadowView = self;
  while (depth && shadowView && shadowView != ancestor) {
    shadowView = shadowView->_superview;
    depth--;
  }
  return ancestor == shadowView;
}

- (instancetype)init
{
  if ((self = [super init])) {

    _frame = CGRectMake(0, 0, ABI13_0_0YGUndefined, ABI13_0_0YGUndefined);

    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = ABI13_0_0YGUndefined;
      _marginMetaProps[ii] = ABI13_0_0YGUndefined;
      _borderMetaProps[ii] = ABI13_0_0YGUndefined;
    }

    _newView = YES;
    _propagationLifecycle = ABI13_0_0RCTUpdateLifecycleUninitialized;
    _textLifecycle = ABI13_0_0RCTUpdateLifecycleUninitialized;

    _ReactABI13_0_0Subviews = [NSMutableArray array];

    _cssNode = ABI13_0_0YGNodeNew();
    ABI13_0_0YGNodeSetContext(_cssNode, (__bridge void *)self);
    ABI13_0_0YGNodeSetPrintFunc(_cssNode, ABI13_0_0RCTPrint);
  }
  return self;
}

- (BOOL)isReactABI13_0_0RootView
{
  return ABI13_0_0RCTIsReactABI13_0_0RootView(self.ReactABI13_0_0Tag);
}

- (void)dealloc
{
  ABI13_0_0YGNodeFree(_cssNode);
}

- (BOOL)isCSSLeafNode
{
  return NO;
}

- (void)dirtyPropagation
{
  if (_propagationLifecycle != ABI13_0_0RCTUpdateLifecycleDirtied) {
    _propagationLifecycle = ABI13_0_0RCTUpdateLifecycleDirtied;
    [_superview dirtyPropagation];
  }
}

- (BOOL)isPropagationDirty
{
  return _propagationLifecycle != ABI13_0_0RCTUpdateLifecycleComputed;
}

- (void)dirtyText
{
  if (_textLifecycle != ABI13_0_0RCTUpdateLifecycleDirtied) {
    _textLifecycle = ABI13_0_0RCTUpdateLifecycleDirtied;
    [_superview dirtyText];
  }
}

- (BOOL)isTextDirty
{
  return _textLifecycle != ABI13_0_0RCTUpdateLifecycleComputed;
}

- (void)setTextComputed
{
  _textLifecycle = ABI13_0_0RCTUpdateLifecycleComputed;
}

- (void)insertReactABI13_0_0Subview:(ABI13_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [_ReactABI13_0_0Subviews insertObject:subview atIndex:atIndex];
  if (![self isCSSLeafNode]) {
    ABI13_0_0YGNodeInsertChild(_cssNode, subview.cssNode, (uint32_t)atIndex);
  }
  subview->_superview = self;
  _didUpdateSubviews = YES;
  [self dirtyText];
  [self dirtyPropagation];
}

- (void)removeReactABI13_0_0Subview:(ABI13_0_0RCTShadowView *)subview
{
  [subview dirtyText];
  [subview dirtyPropagation];
  _didUpdateSubviews = YES;
  subview->_superview = nil;
  [_ReactABI13_0_0Subviews removeObject:subview];
  if (![self isCSSLeafNode]) {
    ABI13_0_0YGNodeRemoveChild(_cssNode, subview.cssNode);
  }
}

- (NSArray<ABI13_0_0RCTShadowView *> *)ReactABI13_0_0Subviews
{
  return _ReactABI13_0_0Subviews;
}

- (ABI13_0_0RCTShadowView *)ReactABI13_0_0Superview
{
  return _superview;
}

- (NSNumber *)ReactABI13_0_0TagAtPoint:(CGPoint)point
{
  for (ABI13_0_0RCTShadowView *shadowView in _ReactABI13_0_0Subviews) {
    if (CGRectContainsPoint(shadowView.frame, point)) {
      CGPoint relativePoint = point;
      CGPoint origin = shadowView.frame.origin;
      relativePoint.x -= origin.x;
      relativePoint.y -= origin.y;
      return [shadowView ReactABI13_0_0TagAtPoint:relativePoint];
    }
  }
  return self.ReactABI13_0_0Tag;
}

- (NSString *)description
{
  NSString *description = super.description;
  description = [[description substringToIndex:description.length - 1] stringByAppendingFormat:@"; viewName: %@; ReactABI13_0_0Tag: %@; frame: %@>", self.viewName, self.ReactABI13_0_0Tag, NSStringFromCGRect(self.frame)];
  return description;
}

- (void)addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"  | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (ABI13_0_0RCTShadowView *subview in _ReactABI13_0_0Subviews) {
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

#define ABI13_0_0RCT_MARGIN_PROPERTY(prop, metaProp)       \
- (void)setMargin##prop:(float)value              \
{                                                 \
  _marginMetaProps[META_PROP_##metaProp] = value; \
  _recomputeMargin = YES;                         \
}                                                 \
- (float)margin##prop                             \
{                                                 \
  return _marginMetaProps[META_PROP_##metaProp];  \
}

ABI13_0_0RCT_MARGIN_PROPERTY(, ALL)
ABI13_0_0RCT_MARGIN_PROPERTY(Vertical, VERTICAL)
ABI13_0_0RCT_MARGIN_PROPERTY(Horizontal, HORIZONTAL)
ABI13_0_0RCT_MARGIN_PROPERTY(Top, TOP)
ABI13_0_0RCT_MARGIN_PROPERTY(Left, LEFT)
ABI13_0_0RCT_MARGIN_PROPERTY(Bottom, BOTTOM)
ABI13_0_0RCT_MARGIN_PROPERTY(Right, RIGHT)

// Padding

#define ABI13_0_0RCT_PADDING_PROPERTY(prop, metaProp)       \
- (void)setPadding##prop:(float)value              \
{                                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value; \
  _recomputePadding = YES;                         \
}                                                  \
- (float)padding##prop                             \
{                                                  \
  return _paddingMetaProps[META_PROP_##metaProp];  \
}

ABI13_0_0RCT_PADDING_PROPERTY(, ALL)
ABI13_0_0RCT_PADDING_PROPERTY(Vertical, VERTICAL)
ABI13_0_0RCT_PADDING_PROPERTY(Horizontal, HORIZONTAL)
ABI13_0_0RCT_PADDING_PROPERTY(Top, TOP)
ABI13_0_0RCT_PADDING_PROPERTY(Left, LEFT)
ABI13_0_0RCT_PADDING_PROPERTY(Bottom, BOTTOM)
ABI13_0_0RCT_PADDING_PROPERTY(Right, RIGHT)

- (UIEdgeInsets)paddingAsInsets
{
  if (ABI13_0_0YGNodeLayoutGetDirection(_cssNode) == ABI13_0_0YGDirectionRTL) {
    return (UIEdgeInsets){
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeTop),
      !ABI13_0_0YGValueIsUndefined(ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeEnd)) ?
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeEnd) :
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeLeft),
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeBottom),
      !ABI13_0_0YGValueIsUndefined(ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeStart)) ?
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeStart) :
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeRight)
    };
  } else {
    return (UIEdgeInsets){
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeTop),
      !ABI13_0_0YGValueIsUndefined(ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeStart)) ?
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeStart) :
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeLeft),
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeBottom),
      !ABI13_0_0YGValueIsUndefined(ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeEnd)) ?
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeEnd) :
      ABI13_0_0YGNodeStyleGetPadding(_cssNode, ABI13_0_0YGEdgeRight)
    };
  }
}

// Border

#define ABI13_0_0RCT_BORDER_PROPERTY(prop, metaProp)            \
- (void)setBorder##prop##Width:(float)value            \
{                                                      \
  _borderMetaProps[META_PROP_##metaProp] = value;      \
  _recomputeBorder = YES;                              \
}                                                      \
- (float)border##prop##Width                           \
{                                                      \
  return _borderMetaProps[META_PROP_##metaProp];       \
}

ABI13_0_0RCT_BORDER_PROPERTY(, ALL)
ABI13_0_0RCT_BORDER_PROPERTY(Top, TOP)
ABI13_0_0RCT_BORDER_PROPERTY(Left, LEFT)
ABI13_0_0RCT_BORDER_PROPERTY(Bottom, BOTTOM)
ABI13_0_0RCT_BORDER_PROPERTY(Right, RIGHT)

// Dimensions


#define ABI13_0_0RCT_DIMENSION_PROPERTY(setProp, getProp, cssProp)           \
- (void)set##setProp:(float)value                                   \
{                                                                   \
  ABI13_0_0YGNodeStyleSet##cssProp(_cssNode, value);                        \
  [self dirtyText];                                                 \
}                                                                   \
- (float)getProp                                                    \
{                                                                   \
  return ABI13_0_0YGNodeStyleGet##cssProp(_cssNode);                        \
}

ABI13_0_0RCT_DIMENSION_PROPERTY(Width, width, Width)
ABI13_0_0RCT_DIMENSION_PROPERTY(Height, height, Height)
ABI13_0_0RCT_DIMENSION_PROPERTY(MinWidth, minWidth, MinWidth)
ABI13_0_0RCT_DIMENSION_PROPERTY(MinHeight, minHeight, MinHeight)
ABI13_0_0RCT_DIMENSION_PROPERTY(MaxWidth, maxWidth, MaxWidth)
ABI13_0_0RCT_DIMENSION_PROPERTY(MaxHeight, maxHeight, MaxHeight)

// Position

#define ABI13_0_0RCT_POSITION_PROPERTY(setProp, getProp, edge)               \
- (void)set##setProp:(float)value                                   \
{                                                                   \
  ABI13_0_0YGNodeStyleSetPosition(_cssNode, edge, value);                   \
  [self dirtyText];                                                 \
}                                                                   \
- (float)getProp                                                    \
{                                                                   \
  return ABI13_0_0YGNodeStyleGetPosition(_cssNode, edge);                   \
}

ABI13_0_0RCT_POSITION_PROPERTY(Top, top, ABI13_0_0YGEdgeTop)
ABI13_0_0RCT_POSITION_PROPERTY(Right, right, ABI13_0_0YGEdgeEnd)
ABI13_0_0RCT_POSITION_PROPERTY(Bottom, bottom, ABI13_0_0YGEdgeBottom)
ABI13_0_0RCT_POSITION_PROPERTY(Left, left, ABI13_0_0YGEdgeStart)

- (void)setFrame:(CGRect)frame
{
  if (!CGRectEqualToRect(frame, _frame)) {
    _frame = frame;
    ABI13_0_0YGNodeStyleSetPosition(_cssNode, ABI13_0_0YGEdgeLeft, CGRectGetMinX(frame));
    ABI13_0_0YGNodeStyleSetPosition(_cssNode, ABI13_0_0YGEdgeTop, CGRectGetMinY(frame));
    ABI13_0_0YGNodeStyleSetWidth(_cssNode, CGRectGetWidth(frame));
    ABI13_0_0YGNodeStyleSetHeight(_cssNode, CGRectGetHeight(frame));
  }
}

static inline void ABI13_0_0RCTAssignSuggestedDimension(ABI13_0_0YGNodeRef cssNode, ABI13_0_0YGDimension dimension, CGFloat amount)
{
  if (amount != UIViewNoIntrinsicMetric) {
    switch (dimension) {
      case ABI13_0_0YGDimensionWidth:
        if (isnan(ABI13_0_0YGNodeStyleGetWidth(cssNode))) {
          ABI13_0_0YGNodeStyleSetWidth(cssNode, amount);
        }
        break;
      case ABI13_0_0YGDimensionHeight:
        if (isnan(ABI13_0_0YGNodeStyleGetHeight(cssNode))) {
          ABI13_0_0YGNodeStyleSetHeight(cssNode, amount);
        }
        break;
      case ABI13_0_0YGDimensionCount:
        break;
    }
  }
}

- (void)setIntrinsicContentSize:(CGSize)size
{
  if (ABI13_0_0YGNodeStyleGetFlexGrow(_cssNode) == 0 && ABI13_0_0YGNodeStyleGetFlexShrink(_cssNode) == 0) {
    ABI13_0_0RCTAssignSuggestedDimension(_cssNode, ABI13_0_0YGDimensionHeight, size.height);
    ABI13_0_0RCTAssignSuggestedDimension(_cssNode, ABI13_0_0YGDimensionWidth, size.width);
  }
}

- (void)setTopLeft:(CGPoint)topLeft
{
  ABI13_0_0YGNodeStyleSetPosition(_cssNode, ABI13_0_0YGEdgeLeft, topLeft.x);
  ABI13_0_0YGNodeStyleSetPosition(_cssNode, ABI13_0_0YGEdgeTop, topLeft.y);
}

- (void)setSize:(CGSize)size
{
  ABI13_0_0YGNodeStyleSetWidth(_cssNode, size.width);
  ABI13_0_0YGNodeStyleSetHeight(_cssNode, size.height);
}

// Flex

- (void)setFlex:(float)value
{
  ABI13_0_0YGNodeStyleSetFlex(_cssNode, value);
}

#define ABI13_0_0RCT_STYLE_PROPERTY(setProp, getProp, cssProp, type) \
- (void)set##setProp:(type)value                            \
{                                                           \
  ABI13_0_0YGNodeStyleSet##cssProp(_cssNode, value);                \
}                                                           \
- (type)getProp                                             \
{                                                           \
  return ABI13_0_0YGNodeStyleGet##cssProp(_cssNode);                \
}

ABI13_0_0RCT_STYLE_PROPERTY(FlexGrow, flexGrow, FlexGrow, float)
ABI13_0_0RCT_STYLE_PROPERTY(FlexShrink, flexShrink, FlexShrink, float)
ABI13_0_0RCT_STYLE_PROPERTY(FlexBasis, flexBasis, FlexBasis, float)
ABI13_0_0RCT_STYLE_PROPERTY(FlexDirection, flexDirection, FlexDirection, ABI13_0_0YGFlexDirection)
ABI13_0_0RCT_STYLE_PROPERTY(JustifyContent, justifyContent, JustifyContent, ABI13_0_0YGJustify)
ABI13_0_0RCT_STYLE_PROPERTY(AlignSelf, alignSelf, AlignSelf, ABI13_0_0YGAlign)
ABI13_0_0RCT_STYLE_PROPERTY(AlignItems, alignItems, AlignItems, ABI13_0_0YGAlign)
ABI13_0_0RCT_STYLE_PROPERTY(Position, position, PositionType, ABI13_0_0YGPositionType)
ABI13_0_0RCT_STYLE_PROPERTY(FlexWrap, flexWrap, FlexWrap, ABI13_0_0YGWrap)
ABI13_0_0RCT_STYLE_PROPERTY(Overflow, overflow, Overflow, ABI13_0_0YGOverflow)
ABI13_0_0RCT_STYLE_PROPERTY(AspectRatio, aspectRatio, AspectRatio, float)

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

- (void)didUpdateReactABI13_0_0Subviews
{
  // Does nothing by default
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  if (_recomputePadding) {
    ABI13_0_0RCTProcessMetaPropsPadding(_paddingMetaProps, _cssNode);
  }
  if (_recomputeMargin) {
    ABI13_0_0RCTProcessMetaPropsMargin(_marginMetaProps, _cssNode);
  }
  if (_recomputeBorder) {
    ABI13_0_0RCTProcessMetaPropsBorder(_borderMetaProps, _cssNode);
  }
  _recomputeMargin = NO;
  _recomputePadding = NO;
  _recomputeBorder = NO;
}

@end
