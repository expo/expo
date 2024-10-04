#import "ABI42_0_0RNCSafeAreaShadowView.h"

#import <ABI42_0_0React/ABI42_0_0RCTAssert.h>
#include <math.h>

#import "ABI42_0_0RNCSafeAreaViewLocalData.h"
#import "ABI42_0_0RNCSafeAreaViewMode.h"
#import "ABI42_0_0RNCSafeAreaViewEdges.h"

// From ABI42_0_0RCTShadowView.m
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

@implementation ABI42_0_0RNCSafeAreaShadowView {
  ABI42_0_0RNCSafeAreaViewLocalData *_localData;
  bool _needsUpdate;
  ABI42_0_0YGValue _paddingMetaProps[META_PROP_COUNT];
  ABI42_0_0YGValue _marginMetaProps[META_PROP_COUNT];
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _needsUpdate = false;
    for (unsigned int ii = 0; ii < META_PROP_COUNT; ii++) {
      _paddingMetaProps[ii] = ABI42_0_0YGValueUndefined;
      _marginMetaProps[ii] = ABI42_0_0YGValueUndefined;
    }
  }
  return self;
}

- (void)extractEdges:(ABI42_0_0YGValue[])_metaProps top:(CGFloat *)top right:(CGFloat *)right bottom:(CGFloat *)bottom left:(CGFloat *)left
{
  if (_metaProps[META_PROP_ALL].unit == ABI42_0_0YGUnitPoint) {
    *top = _metaProps[META_PROP_ALL].value;
    *right = _metaProps[META_PROP_ALL].value;
    *bottom = _metaProps[META_PROP_ALL].value;
    *left = _metaProps[META_PROP_ALL].value;
  }

  if (_metaProps[META_PROP_HORIZONTAL].unit == ABI42_0_0YGUnitPoint) {
    *right = _metaProps[META_PROP_HORIZONTAL].value;
    *left = _metaProps[META_PROP_HORIZONTAL].value;
  }

  if (_metaProps[META_PROP_VERTICAL].unit == ABI42_0_0YGUnitPoint) {
    *top = _metaProps[META_PROP_VERTICAL].value;
    *bottom = _metaProps[META_PROP_VERTICAL].value;
  }

  if (_metaProps[META_PROP_TOP].unit == ABI42_0_0YGUnitPoint) {
    *top = _metaProps[META_PROP_TOP].value;
  }
    
  if (_metaProps[META_PROP_RIGHT].unit == ABI42_0_0YGUnitPoint) {
    *right = _metaProps[META_PROP_RIGHT].value;
  }

  if (_metaProps[META_PROP_BOTTOM].unit == ABI42_0_0YGUnitPoint) {
    *bottom = _metaProps[META_PROP_BOTTOM].value;
  }

  if (_metaProps[META_PROP_LEFT].unit == ABI42_0_0YGUnitPoint) {
    *left = _metaProps[META_PROP_LEFT].value;
  }
}

- (void)resetInsetsForMode:(ABI42_0_0RNCSafeAreaViewMode)mode {
  if (mode == ABI42_0_0RNCSafeAreaViewModePadding) {
    super.paddingTop = _paddingMetaProps[META_PROP_TOP];
    super.paddingRight = _paddingMetaProps[META_PROP_RIGHT];
    super.paddingBottom = _paddingMetaProps[META_PROP_BOTTOM];
    super.paddingLeft = _paddingMetaProps[META_PROP_LEFT];
  } else if (mode == ABI42_0_0RNCSafeAreaViewModeMargin) {
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
  ABI42_0_0RNCSafeAreaViewMode mode = _localData.mode;
  ABI42_0_0RNCSafeAreaViewEdges edges = _localData.edges;

  CGFloat top = 0;
  CGFloat right = 0;
  CGFloat bottom = 0;
  CGFloat left = 0;

  CGFloat insetTop = (edges & ABI42_0_0RNCSafeAreaViewEdgesTop) ? insets.top : 0;
  CGFloat insetRight = (edges & ABI42_0_0RNCSafeAreaViewEdgesRight) ? insets.right : 0;
  CGFloat insetBottom = (edges & ABI42_0_0RNCSafeAreaViewEdgesBottom) ? insets.bottom : 0;
  CGFloat insetLeft = (edges & ABI42_0_0RNCSafeAreaViewEdgesLeft) ? insets.left : 0;

  if (mode == ABI42_0_0RNCSafeAreaViewModePadding) {
    [self extractEdges:_paddingMetaProps top:&top right:&right bottom:&bottom left:&left];
    super.paddingTop = (ABI42_0_0YGValue){insetTop + top, ABI42_0_0YGUnitPoint};
    super.paddingRight = (ABI42_0_0YGValue){insetRight + right, ABI42_0_0YGUnitPoint};
    super.paddingBottom = (ABI42_0_0YGValue){insetBottom + bottom, ABI42_0_0YGUnitPoint};
    super.paddingLeft = (ABI42_0_0YGValue){insetLeft + left, ABI42_0_0YGUnitPoint};
  } else if (mode == ABI42_0_0RNCSafeAreaViewModeMargin) {
    [self extractEdges:_marginMetaProps top:&top right:&right bottom:&bottom left:&left];
    super.marginTop = (ABI42_0_0YGValue){insetTop + top, ABI42_0_0YGUnitPoint};
    super.marginRight = (ABI42_0_0YGValue){insetRight + right, ABI42_0_0YGUnitPoint};
    super.marginBottom = (ABI42_0_0YGValue){insetBottom + bottom, ABI42_0_0YGUnitPoint};
    super.marginLeft = (ABI42_0_0YGValue){insetLeft + left, ABI42_0_0YGUnitPoint};
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

- (void)setLocalData:(ABI42_0_0RNCSafeAreaViewLocalData *)localData
{
  ABI42_0_0RCTAssert(
    [localData isKindOfClass:[ABI42_0_0RNCSafeAreaViewLocalData class]],
    @"Local data object for `ABI42_0_0RCTRNCSafeAreaShadowView` must be `ABI42_0_0RCTRNCSafeAreaViewLocalData` instance."
  );

  if (_localData != nil && _localData.mode != localData.mode) {
    [self resetInsetsForMode:_localData.mode];
  }
  
  _localData = localData;
  _needsUpdate = false;
  [self updateInsets];
  
  if (_localData.mode == ABI42_0_0RNCSafeAreaViewModePadding) {
    [super didSetProps:@[@"paddingTop", @"paddingRight", @"paddingBottom", @"paddingLeft"]];
  } else {
    [super didSetProps:@[@"marginTop", @"marginRight", @"marginBottom", @"marginLeft"]];
  }
}

#define SHADOW_VIEW_MARGIN_PADDING_PROP(edge, metaProp) \
- (void)setPadding##edge:(ABI42_0_0YGValue)value                 \
{                                                       \
  [super setPadding##edge:value];                       \
  _needsUpdate = true;                                  \
  _paddingMetaProps[META_PROP_##metaProp] = value;      \
}                                                       \
- (void)setMargin##edge:(ABI42_0_0YGValue)value                  \
{                                                       \
  [super setMargin##edge:value];                        \
  _needsUpdate = true;                                  \
  _marginMetaProps[META_PROP_##metaProp] = value;       \
}

SHADOW_VIEW_MARGIN_PADDING_PROP(, ALL);
SHADOW_VIEW_MARGIN_PADDING_PROP(Vertical, VERTICAL);
SHADOW_VIEW_MARGIN_PADDING_PROP(Horizontal, HORIZONTAL);
SHADOW_VIEW_MARGIN_PADDING_PROP(Top, TOP);
SHADOW_VIEW_MARGIN_PADDING_PROP(Right, RIGHT);
SHADOW_VIEW_MARGIN_PADDING_PROP(Bottom, BOTTOM);
SHADOW_VIEW_MARGIN_PADDING_PROP(Left, LEFT);

@end
