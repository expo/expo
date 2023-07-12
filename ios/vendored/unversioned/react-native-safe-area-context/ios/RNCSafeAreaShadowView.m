#import "RNCSafeAreaShadowView.h"

#import <React/RCTAssert.h>
#include <math.h>

#import "RNCSafeAreaViewEdgeMode.h"
#import "RNCSafeAreaViewEdges.h"
#import "RNCSafeAreaViewLocalData.h"
#import "RNCSafeAreaViewMode.h"

// From RCTShadowView.m
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

@implementation RNCSafeAreaShadowView {
  RNCSafeAreaViewLocalData *_localData;
  bool _needsUpdate;
  YGValue _paddingMetaProps[META_PROP_COUNT];
  YGValue _marginMetaProps[META_PROP_COUNT];
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _needsUpdate = false;
    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = YGValueUndefined;
      _marginMetaProps[ii] = YGValueUndefined;
    }
  }
  return self;
}

- (void)extractEdges:(YGValue[])_metaProps
                 top:(CGFloat *)top
               right:(CGFloat *)right
              bottom:(CGFloat *)bottom
                left:(CGFloat *)left
{
  if (_metaProps[META_PROP_ALL].unit == YGUnitPoint) {
    *top = _metaProps[META_PROP_ALL].value;
    *right = _metaProps[META_PROP_ALL].value;
    *bottom = _metaProps[META_PROP_ALL].value;
    *left = _metaProps[META_PROP_ALL].value;
  }

  if (_metaProps[META_PROP_HORIZONTAL].unit == YGUnitPoint) {
    *right = _metaProps[META_PROP_HORIZONTAL].value;
    *left = _metaProps[META_PROP_HORIZONTAL].value;
  }

  if (_metaProps[META_PROP_VERTICAL].unit == YGUnitPoint) {
    *top = _metaProps[META_PROP_VERTICAL].value;
    *bottom = _metaProps[META_PROP_VERTICAL].value;
  }

  if (_metaProps[META_PROP_TOP].unit == YGUnitPoint) {
    *top = _metaProps[META_PROP_TOP].value;
  }

  if (_metaProps[META_PROP_RIGHT].unit == YGUnitPoint) {
    *right = _metaProps[META_PROP_RIGHT].value;
  }

  if (_metaProps[META_PROP_BOTTOM].unit == YGUnitPoint) {
    *bottom = _metaProps[META_PROP_BOTTOM].value;
  }

  if (_metaProps[META_PROP_LEFT].unit == YGUnitPoint) {
    *left = _metaProps[META_PROP_LEFT].value;
  }
}

- (void)resetInsetsForMode:(RNCSafeAreaViewMode)mode
{
  if (mode == RNCSafeAreaViewModePadding) {
    super.paddingTop = _paddingMetaProps[META_PROP_TOP];
    super.paddingRight = _paddingMetaProps[META_PROP_RIGHT];
    super.paddingBottom = _paddingMetaProps[META_PROP_BOTTOM];
    super.paddingLeft = _paddingMetaProps[META_PROP_LEFT];
  } else if (mode == RNCSafeAreaViewModeMargin) {
    super.marginTop = _marginMetaProps[META_PROP_TOP];
    super.marginRight = _marginMetaProps[META_PROP_RIGHT];
    super.marginBottom = _marginMetaProps[META_PROP_BOTTOM];
    super.marginLeft = _marginMetaProps[META_PROP_LEFT];
  }
}

- (void)updateInsets
{
  if (_localData == nil) {
    return;
  }

  UIEdgeInsets insets = _localData.insets;
  RNCSafeAreaViewMode mode = _localData.mode;
  RNCSafeAreaViewEdges edges = _localData.edges;

  CGFloat top = 0;
  CGFloat right = 0;
  CGFloat bottom = 0;
  CGFloat left = 0;

  if (mode == RNCSafeAreaViewModePadding) {
    [self extractEdges:_paddingMetaProps top:&top right:&right bottom:&bottom left:&left];
    super.paddingTop = (YGValue){[self getEdgeValue:edges.top insetValue:insets.top edgeValue:top], YGUnitPoint};
    super.paddingRight =
        (YGValue){[self getEdgeValue:edges.right insetValue:insets.right edgeValue:right], YGUnitPoint};
    super.paddingBottom =
        (YGValue){[self getEdgeValue:edges.bottom insetValue:insets.bottom edgeValue:bottom], YGUnitPoint};
    super.paddingLeft = (YGValue){[self getEdgeValue:edges.left insetValue:insets.left edgeValue:left], YGUnitPoint};
  } else if (mode == RNCSafeAreaViewModeMargin) {
    [self extractEdges:_marginMetaProps top:&top right:&right bottom:&bottom left:&left];
    super.marginTop = (YGValue){[self getEdgeValue:edges.top insetValue:insets.top edgeValue:top], YGUnitPoint};
    super.marginRight = (YGValue){[self getEdgeValue:edges.right insetValue:insets.right edgeValue:right], YGUnitPoint};
    super.marginBottom =
        (YGValue){[self getEdgeValue:edges.bottom insetValue:insets.bottom edgeValue:bottom], YGUnitPoint};
    super.marginLeft = (YGValue){[self getEdgeValue:edges.left insetValue:insets.left edgeValue:left], YGUnitPoint};
  }
}

- (CGFloat)getEdgeValue:(RNCSafeAreaViewEdgeMode)edgeMode insetValue:(CGFloat)insetValue edgeValue:(CGFloat)edgeValue
{
  if (edgeMode == RNCSafeAreaViewEdgeModeOff) {
    return edgeValue;
  } else if (edgeMode == RNCSafeAreaViewEdgeModeMaximum) {
    return MAX(insetValue, edgeValue);
  } else {
    return insetValue + edgeValue;
  }
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  if (_needsUpdate) {
    _needsUpdate = false;
    [self updateInsets];
  }
  [super didSetProps:changedProps];
}

- (void)setLocalData:(RNCSafeAreaViewLocalData *)localData
{
  RCTAssert(
      [localData isKindOfClass:[RNCSafeAreaViewLocalData class]],
      @"Local data object for `RCTRNCSafeAreaShadowView` must be `RCTRNCSafeAreaViewLocalData` instance.");

  if (_localData != nil && _localData.mode != localData.mode) {
    [self resetInsetsForMode:_localData.mode];
  }

  _localData = localData;
  _needsUpdate = false;
  [self updateInsets];

  if (_localData.mode == RNCSafeAreaViewModePadding) {
    [super didSetProps:@[ @"paddingTop", @"paddingRight", @"paddingBottom", @"paddingLeft" ]];
  } else {
    [super didSetProps:@[ @"marginTop", @"marginRight", @"marginBottom", @"marginLeft" ]];
  }
}

#define SHADOW_VIEW_MARGIN_PADDING_PROP(edge, metaProp) \
  -(void)setPadding##edge : (YGValue)value              \
  {                                                     \
    [super setPadding##edge:value];                     \
    _needsUpdate = true;                                \
    _paddingMetaProps[META_PROP_##metaProp] = value;    \
  }                                                     \
  -(void)setMargin##edge : (YGValue)value               \
  {                                                     \
    [super setMargin##edge:value];                      \
    _needsUpdate = true;                                \
    _marginMetaProps[META_PROP_##metaProp] = value;     \
  }

SHADOW_VIEW_MARGIN_PADDING_PROP(, ALL);
SHADOW_VIEW_MARGIN_PADDING_PROP(Vertical, VERTICAL);
SHADOW_VIEW_MARGIN_PADDING_PROP(Horizontal, HORIZONTAL);
SHADOW_VIEW_MARGIN_PADDING_PROP(Top, TOP);
SHADOW_VIEW_MARGIN_PADDING_PROP(Right, RIGHT);
SHADOW_VIEW_MARGIN_PADDING_PROP(Bottom, BOTTOM);
SHADOW_VIEW_MARGIN_PADDING_PROP(Left, LEFT);

@end
